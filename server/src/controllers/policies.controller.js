import { PoliciesService } from "../database/policies/index.js";
import { EmployeesService } from "../database/employees/index.js";
import { CompaniesService } from "../database/companies/index.js";

export const getPolicies = async (req, res) => {
  try {
    // 1. Fetch requester
    const isCompany = req.query.company;
    const requesterUid = req.user.uid;

    let requester = null;
    let companyID = null;

    // 2. Access Control
    // Policy: "Employees can view policies of their company"
    // We only return policies for the requester's company.
    if (!isCompany) {
      requester = await EmployeesService.getById(requesterUid);
      if (!requester || !requester.company_id) {
        return res.status(403).json({
          error:
            "Access denied: Employee not found or not assigned to a company",
        });
      }
      companyID = requester.company_id;
    } else {
      requester = await CompaniesService.getById(requesterUid);
      if (!requester) {
        return res.status(403).json({
          error: "Access denied: Company not found or not assigned",
        });
      }
      companyID = requester.id;
    }

    const policies = await PoliciesService.getByCompanyId(companyID);
    return res.json(policies);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createPolicy = async (req, res) => {
  try {
    const isCompany = req.query.company;
    const requesterUid = req.user.uid;
    const {
      name,
      verification_mode,
      daily_receipt_limit,
      currencies,
      amount_cap,
      monthly_cap,
      allowed_categories,
      vendor_whitelist,
      vendor_blacklist,
      max_days_old,
      custom_rules,
      require_description,
      require_category,
      auto_approve_under,
    } = req.body;

    // 1. Fetch requester
    let requester = null;
    let company_id = null;
    if (!isCompany) {
      requester = await EmployeesService.getById(requesterUid);
      if (!requester) return res.status(403).json({ error: "Access denied" });
      // 2. Access Control
      // Policy: "Admins can manage policies"
      if (
        requester.employee_role !== "admin" &&
        requester.employee_role !== "manager"
      ) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }
      company_id = requester.company_id;
    } else {
      requester = await CompaniesService.getById(requesterUid);
      if (!requester) return res.status(403).json({ error: "Access denied" });
      company_id = requester.id;
    }

    if (!company_id)
      return res.status(400).json({ error: "User not assigned to a company" });

    // Validate numeric constraints
    if (daily_receipt_limit !== undefined) {
      if (daily_receipt_limit < 1 || daily_receipt_limit > 50) {
        return res
          .status(400)
          .json({ error: "Daily receipt limit must be between 1 and 50" });
      }
    }

    if (currencies !== undefined && currencies.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one currency must be specified" });
    }

    if (amount_cap !== undefined && amount_cap <= 0) {
      return res
        .status(400)
        .json({ error: "Amount cap must be greater than 0" });
    }

    if (monthly_cap !== undefined && monthly_cap <= 0) {
      return res
        .status(400)
        .json({ error: "Monthly cap must be greater than 0" });
    }

    if (max_days_old !== undefined) {
      if (max_days_old < 1 || max_days_old > 365) {
        return res
          .status(400)
          .json({ error: "Max days old must be between 1 and 365" });
      }
    }

    if (
      verification_mode &&
      !["autonomous", "human_verification"].includes(verification_mode)
    ) {
      return res.status(400).json({ error: "Invalid verification mode" });
    }

    const policy = await PoliciesService.create({
      company_id, // Forced from requester
      name,
      verification_mode,
      daily_receipt_limit,
      currencies,
      amount_cap,
      monthly_cap,
      allowed_categories,
      vendor_whitelist,
      vendor_blacklist,
      max_days_old,
      custom_rules,
      require_description,
      require_category,
      auto_approve_under,
      is_active: true,
    });

    return res.status(201).json(policy);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePolicy = async (req, res) => {
  try {
    const {id, company} = req.query;
    const requesterUid = req.user.uid;
    const updates = req.body;

    if (!id) return res.status(400).json({ error: "Policy ID is required" });
    
    // 1. Fetch requester
    let requester = null;
    let company_id = null;
    if (!company) {
      requester = await EmployeesService.getById(requesterUid);
      if (!requester) return res.status(403).json({ error: "Access denied" });
      // 2. Access Control
      // Policy: "Admins can manage policies"
      if (
        requester.employee_role !== "admin" &&
        requester.employee_role !== "manager"
      ) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }
      company_id = requester.company_id;
    } else {
      requester = await CompaniesService.getById(requesterUid);
      if (!requester) return res.status(403).json({ error: "Access denied" });
      company_id = requester.id;
    }

    if (!company_id)
      return res.status(400).json({ error: "User not assigned to a company" });


    // 3. Verify ownership: Policy must belong to Admin's company
    const existingPolicy = await PoliciesService.getById(id);
    if (!existingPolicy)
      return res.status(404).json({ error: "Policy not found" });

    if (existingPolicy.company_id !== company_id) {
      return res.status(403).json({
        error: "Access denied: This policy belongs to another company",
      });
    }

    // Validate numeric constraints if present in updates
    if (updates.daily_receipt_limit !== undefined) {
      if (updates.daily_receipt_limit < 1 || updates.daily_receipt_limit > 50) {
        return res
          .status(400)
          .json({ error: "Daily receipt limit must be between 1 and 50" });
      }
    }

    if (updates.currencies !== undefined && updates.currencies.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one currency must be specified" });
    }

    if (updates.amount_cap !== undefined && updates.amount_cap <= 0) {
      return res
        .status(400)
        .json({ error: "Amount cap must be greater than 0" });
    }

    if (updates.monthly_cap !== undefined && updates.monthly_cap <= 0) {
      return res
        .status(400)
        .json({ error: "Monthly cap must be greater than 0" });
    }

    if (updates.max_days_old !== undefined) {
      if (updates.max_days_old < 1 || updates.max_days_old > 365) {
        return res
          .status(400)
          .json({ error: "Max days old must be between 1 and 365" });
      }
    }

    if (updates.verification_mode &&
      !["autonomous", "human_verification"].includes(updates.verification_mode)) {
      return res.status(400).json({ error: "Invalid verification mode" });
    }

    const policy = await PoliciesService.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return res.json(policy);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deletePolicy = async (req, res) => {
  try {
    const {id, company} = req.query;
    const requesterUid = req.user.uid;

    if (!id) return res.status(400).json({ error: "Policy ID is required" });

    // 1. Fetch requester
    let requester = null;
    let company_id = null;
    if (!company) {
      requester = await EmployeesService.getById(requesterUid);
      if (!requester) return res.status(403).json({ error: "Access denied" });
      // 2. Access Control
      // Policy: "Admins can manage policies"
      if (
        requester.employee_role !== "admin" &&
        requester.employee_role !== "manager"
      ) {
        return res.status(403).json({ error: "Access denied: Admins only" });
      }
      company_id = requester.company_id;
    } else {
      requester = await CompaniesService.getById(requesterUid);
      if (!requester) return res.status(403).json({ error: "Access denied" });
      company_id = requester.id;
    }

    if (!company_id)
      return res.status(400).json({ error: "User not assigned to a company" });

    // 3. Verify ownership
    const existingPolicy = await PoliciesService.getById(id);
    if (!existingPolicy)
      return res.status(404).json({ error: "Policy not found" });

    if (existingPolicy.company_id !== company_id) {
      return res.status(403).json({
        error: "Access denied: This policy belongs to another company",
      });
    }

    await PoliciesService.delete(id);
    return res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
