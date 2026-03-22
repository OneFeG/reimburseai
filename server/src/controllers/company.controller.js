import { CompaniesService } from "../database/companies/index.js";
import { EmployeesService } from "../database/employees/index.js";
import { createServerWallet } from "../services/thirdweb/playground/ServerWallet.js";

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

export const getCompany = async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const targetCompanyId = req.query.id;
    const isEmployee = parseBoolean(req.query.employee);

    // 2. Fetch requester profile
    let requester;
    let companyIdToFetch;
    if (isEmployee) {
      requester = await EmployeesService.getById(requesterUid);
      if (!requester)
        return res.status(404).json({ error: "User profile not found" });
      companyIdToFetch = requester.company_id;
    } else {
      requester = await CompaniesService.getById(requesterUid);
      if (!requester)
        return res.status(404).json({ error: "Company profile not found" });
      companyIdToFetch = requester.id;
    }

    // 4. Access Control
    // Policy: Employees can view own company info
    if (targetCompanyId !== companyIdToFetch) {
      // If requesting a different company, deny.
      // (Unless we have a super-admin role not scoped to company, but sticking to basic policy)
      return res
        .status(403)
        .json({ error: "Access denied: You can only view your own company" });
    }

    const company = await CompaniesService.getById(companyIdToFetch);
    if (!company) return res.status(404).json({ error: "Company not found" });

    return res.status(200).json(company);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, IdentificationNumber } = req.body;
    const { uid, email } = req.user;

    if (!name || name.length >= 50)
      return res.status(400).json({ error: "Company name is required" });
    if (!email)
      return res.status(400).json({ error: "Company email is required" });
    if (
      !IdentificationNumber ||
      typeof IdentificationNumber !== "number" ||
      IdentificationNumber.toString().length > 15
    )
      return res.status(400).json({ error: "Company ID Number is invalid" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Create a wallet for the company
    const wallet = await createServerWallet(email);
    if (!wallet || !wallet.smartAccountAddress || !wallet.address) return res.status(500).json({ error: "Failed to create wallet" });

    const doc = {
      id: uid,
      name,
      email,
      identificationnumber: Number(IdentificationNumber),
      status: "active",
      smart_wallet_address: wallet.smartAccountAddress,
      wallet_address: wallet.address,
    }

    const company = await CompaniesService.create(doc);


    return res.status(201).json(company);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.query;
    const employee = parseBoolean(req.query.employee);
    const updates = req.body;
    const requesterUid = req.user.uid;

    if (!id) return res.status(400).json({ error: "Company ID is required" });

    // 1. Fetch requester
    let requester = null;
    if (employee) {
      requester = await EmployeesService.getById(requesterUid);
    } else {
      requester = await CompaniesService.getById(requesterUid);
    }

    if (!requester) return res.status(403).json({ error: "Access denied" });

    // 2. Access Control
    // Policy: "Admins can update own company" (and only their own)
    if (employee) {
      if (requester.company_id !== id) {
        return res.status(403).json({
          error: "Access denied: You can only update your own company",
        });
      }
      if (requester.employee_role !== "manager") {
        return res.status(403).json({ error: "Access denied: Managers only" });
      }
    } else if (requester.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Validate email if present
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    const company = await CompaniesService.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return res.json(company);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.query;
    const employee = parseBoolean(req.query.employee);
    const requesterUid = req.user.uid;

    if (!id) return res.status(400).json({ error: "Company ID is required" });

    // 1. Fetch requester
    let requester = null;
    if (employee) {
      requester = await EmployeesService.getById(requesterUid);
    } else {
      requester = await CompaniesService.getById(requesterUid);
    }

    if (!requester) return res.status(403).json({ error: "Access denied" });

    // 2. Access Control
    // Policy: "Admins can update own company" (and only their own)
    if (employee) {
      if (requester.company_id !== id) {
        return res.status(403).json({
          error: "Access denied: You can only update your own company",
        });
      }
      if (requester.employee_role !== "manager") {
        return res.status(403).json({ error: "Access denied: Managers only" });
      }
    } else if (requester.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await CompaniesService.delete(id);
    return res.json({ message: "Company deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const inviteEmployee = async (req, res) => {
  try {
    const { employeeEmail } = req.query;
    const employee = parseBoolean(req.query.employee);
    const requesterUid = req.user.uid;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!employeeEmail && !emailRegex.test(employeeEmail))
      return res.status(400).json({ error: "Employee email is required" });

    // 1. Fetch requester
    let requester = null;
    if (employee) {
      requester = await EmployeesService.getById(requesterUid);
    } else {
      requester = await CompaniesService.getById(requesterUid);
    }

    if (!requester) return res.status(403).json({ error: "Access denied" });

    const employeeToInvite = await EmployeesService.getByEmail(employeeEmail);
    if (!employeeToInvite) {
      return res.status(400).json({ error: "Employee not found" });
    }
    if (employeeToInvite.company_id) {
      return res
        .status(400)
        .json({ error: "Employee already belongs to a company" });
    }

    // 2. Access Control
    let companyId = null;
    if (employee) {
      companyId = requester.company_id;
      if (
        requester.employee_role !== "manager" &&
        requester.employee_role !== "admin"
      ) {
        return res
          .status(403)
          .json({ error: "Access denied: Admins and Managers only" });
      }
    } else {
      companyId = requester.id;
    }

    await EmployeesService.update(employeeToInvite.id, {
      employee_status: "invited",
      invitedby: companyId,
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ message: "Employee invited successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteEmployeeInCompany = async (req, res) => {
  try {
    const { id } = req.query;
    const employee = parseBoolean(req.query.employee);
    const requesterUid = req.user.uid;

    if (!id) return res.status(400).json({ error: "Employee ID is required" });

    // 1. Fetch requester
    let requester = null;
    if (employee) {
      requester = await EmployeesService.getById(requesterUid);
    } else {
      requester = await CompaniesService.getById(requesterUid);
    }

    if (!requester) return res.status(403).json({ error: "Access denied" });

    const employeeToDelete = await EmployeesService.getById(id);
    if (!employeeToDelete)
      return res.status(404).json({ error: "Employee not found" });

    // 2. Access Control
    // Policy: "Admins can update own company" (and only their own)
    if (employee) {
      if (requester.company_id !== employeeToDelete.company_id) {
        return res.status(403).json({
          error:
            "Access denied: You can only delete employees from your own company",
        });
      }
      if (
        requester.employee_role !== "manager" &&
        requester.employee_role !== "admin"
      ) {
        return res.status(403).json({ error: "Access denied: Managers only" });
      }
    } else if (requester.id !== employeeToDelete.company_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await EmployeesService.update(employeeToDelete.id, {
      employee_status: "inactive",
      company_id: null,
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEmployeesInCompany = async (req, res) => {
  try {
    const isEmployee = parseBoolean(req.query.employee);
    const requesterUid = req.user.uid;

    // 1. Fetch requester
    let requester = null;
    if (isEmployee) {
      requester = await EmployeesService.getById(requesterUid);
    } else {
      requester = await CompaniesService.getById(requesterUid);
    }

    if (!requester) return res.status(403).json({ error: "Access denied" });

    // 2. Access Control
    // Policy: "Admins can update own company" (and only their own)
    let companyId;
    if (isEmployee) {
      if (
        requester.employee_role !== "manager" &&
        requester.employee_role !== "admin"
      )
        return res.status(403).json({ error: "Access denied: Managers only" });
      companyId = requester.company_id;
    } else {
      companyId = requester.id;
    }

    const employees = await EmployeesService.getEmployeesInCompany(companyId);

    return res.status(200).json(employees);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
