import { AuditsService } from "../database/audits/index.js";
import { CompaniesService } from "../database/companies/index.js";
import { EmployeesService } from "../database/employees/index.js";

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

export const getAuditationsByEmployee = async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const requesterIsEmployee = parseBoolean(req.query.employee);
    const targetEmployeeId = req.query.id || requesterUid;

    let requester = null;
    if (requesterIsEmployee) {
      requester = await EmployeesService.getById(requesterUid);
      if (!requester) {
        return res.status(403).json({ error: "Access denied: User profile not found" });
      }
    } else {
      requester = await CompaniesService.getById(requesterUid);
      if (!requester) {
        return res.status(403).json({ error: "Access denied: Company profile not found" });
      }
    }

    const targetEmployee = await EmployeesService.getById(targetEmployeeId);
    if (!targetEmployee) return res.status(404).json({ error: "Employee not found" });

    if (requesterIsEmployee) {
      const isSelf = requesterUid === targetEmployeeId;
      const isCompanyManager =
        (requester.employee_role === "admin" || requester.employee_role === "manager") &&
        requester.company_id &&
        requester.company_id === targetEmployee.company_id;

      if (!isSelf && !isCompanyManager) return res.status(403).json({ error: "Access denied" });
    } else {
      if (targetEmployee.company_id !== requesterUid) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const audits = await AuditsService.getByEmployee(targetEmployeeId);
    return res.status(200).json(audits);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAuditationsByCompany = async (req, res) => {
  try {
    const requesterUid = req.user.uid;
    const requesterIsEmployee = parseBoolean(req.query.employee);

    let companyIdToFetch;
    if (requesterIsEmployee) {
      const requester = await EmployeesService.getById(requesterUid);
      if (!requester) {
        return res.status(403).json({ error: "Access denied: User profile not found" });
      }
      if (!requester.company_id) {
        return res.status(404).json({ error: "Company not found" });
      }
      companyIdToFetch = requester.company_id;
    } else {
      const requester = await CompaniesService.getById(requesterUid);
      if (!requester) {
        return res.status(403).json({ error: "Access denied: Company profile not found" });
      }
      companyIdToFetch = requesterUid;
    }

    const targetCompanyId = req.query.id || companyIdToFetch;
    if (targetCompanyId !== companyIdToFetch) {
      return res.status(403).json({ error: "Access denied" });
    }

    const audits = await AuditsService.getByCompany(companyIdToFetch);
    return res.status(200).json(audits);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
