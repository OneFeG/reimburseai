import { EmployeesService } from "../database/employees/index.js";
import { createServerWallet } from "../services/thirdweb/playground/ServerWallet.js";

export const getEmployee = async (req, res) => {
  try {
    // 1. Identify who is asking
    const requesterUid = req.user.uid;

    // 2. Identify who they want to see
    // If query param 'id' is provided, use it; otherwise default to themselves
    const targetId = req.query.id || requesterUid;

    // 3. Fetch requester's full profile to check role/company
    const requester = await EmployeesService.getById(requesterUid);

    if (!requester) {
      return res
        .status(403)
        .json({ error: "Access denied: User profile not found" });
    }

    // 4. Access Control Logic
    // Policy: Users can view own profile OR Company admins can view employees in their company
    let isAllowed = false;

    // Optimization: Fetch target first
    const employee = await EmployeesService.getById(targetId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Re-evaluating permission with target data
    if (requesterUid === targetId) {
      isAllowed = true;
    } else if (
      (requester.employee_role === "admin" ||
        requester.employee_role === "manager") &&
      requester.company_id === employee.company_id
    ) {
      isAllowed = true;
    }

    if (!isAllowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, IdentificationNumber } = req.body;
    const { uid, email } = req.user;

    if (!name || name.length >= 50)
      return res.status(400).json({ error: "Name is required" });
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (
      !IdentificationNumber ||
      typeof IdentificationNumber !== "number" ||
      IdentificationNumber.toString().length > 15
    )
      return res.status(400).json({ error: "ID Number is invalid" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Create a wallet for the employee
    const wallet = await createServerWallet(email);
    if (!wallet || !wallet.smartAccountAddress || !wallet.address) return res.status(500).json({ error: "Failed to create wallet" });

    const doc = {
      id: uid,
      name,
      email,
      identificationnumber: Number(IdentificationNumber),
      smart_wallet_address: wallet.smartAccountAddress,
      wallet_address: wallet.address,
    };
    
    const employee = await EmployeesService.create(doc);
  
    return res.status(201).json(employee);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.query;
    const updates = req.body;
    const requesterUid = req.user.uid;

    if (!id) return res.status(400).json({ error: "Employee ID is required" });

    // 1. Fetch requester to check permissions
    const requester = await EmployeesService.getById(requesterUid);
    if (!requester)
      return res
        .status(403)
        .json({ error: "Access denied: User profile not found" });

    // 2. Fetch target to check company
    const targetEmployee = await EmployeesService.getById(id);
    if (!targetEmployee)
      return res.status(404).json({ error: "Employee not found" });

    // 3. Access Control
    // Allow if self-update OR admin of same company
    let isAllowed = false;
    if (requesterUid === id) {
      isAllowed = true;
      // Optional: Prevent self from changing critical fields like 'employee_role' or 'company_id'
      // if (updates.employee_role && updates.employee_role !== requester.employee_role) ...
    } else if (
      (requester.employee_role === "admin" ||
        requester.employee_role === "manager") &&
      requester.company_id === targetEmployee.company_id
    ) {
      isAllowed = true;
    }

    if (!isAllowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    const employee = await EmployeesService.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    // 1. Fetch requester
    const requester = await EmployeesService.getById(requesterUid);
    if (!requester)
      return res
        .status(403)
        .json({ error: "Access denied: User profile not found" });

    await EmployeesService.delete(id);
    return res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const acceptEmployeeInvite = async (req, res) => {
  try {
    const requesterUid = req.user.uid;

    // 1. Fetch requester
    const requester = await EmployeesService.getById(requesterUid);
    if (!requester)
      return res.status(403).json({ error: "Employee not found" });

    if (requester.employee_status !== "invited") {
      return res
        .status(403)
        .json({ error: "Access denied: Only invited employees can accept" });
    }

    if (!requester.invitedby) {
      return res
        .status(403)
        .json({ error: "Access denied: Employee not invited" });
    }

    // 4. Update employee status and company_id
    await EmployeesService.update(requesterUid, {
      employee_status: "active",
      company_id: requester.invitedby,
      invitedby: null,
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ message: "Employee accepted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
