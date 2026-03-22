import { Router } from "express";
import multer from "multer";
import { PlatformReimburseFlow } from "../controllers/reimburse.controller.js";
import {x402Getter} from "../agent/x402/auditorx402.ts"
import {
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  inviteEmployee,
  deleteEmployeeInCompany,
  getEmployeesInCompany,
} from "../controllers/company.controller.js";
import {
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  acceptEmployeeInvite,
} from "../controllers/employee.controller.js";
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../controllers/policies.controller.js";
import {
  getAuditationsByEmployee,
  getAuditationsByCompany,
} from "../controllers/auditations.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Configure multer for memory storage (files are kept in memory as buffers)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Auditor routes
router.post(
  "/api/auditup",
  verifyToken,
  upload.single("file"),
  PlatformReimburseFlow,
);
router.post("/api/auditor", upload.single("file"), x402Getter);

//Employees routes
router.get("/api/employee", verifyToken, getEmployee);
router.post("/api/employeeup", verifyToken, createEmployee);
router.put("/api/employee", verifyToken, updateEmployee);
router.delete("/api/employee", verifyToken, deleteEmployee);
router.post("/api/employee/accept", verifyToken, acceptEmployeeInvite);

//Company routes
router.get("/api/company", verifyToken, getCompany);
router.post("/api/companyup", verifyToken, createCompany);
router.put("/api/company", verifyToken, updateCompany);
router.delete("/api/company", verifyToken, deleteCompany);
router.post("/api/company/invite", verifyToken, inviteEmployee);
router.put("/api/company/delete", verifyToken, deleteEmployeeInCompany);
router.get("/api/company/employees", verifyToken, getEmployeesInCompany);

//Policy routes
router.get("/api/policy", verifyToken, getPolicies);
router.post("/api/policy", verifyToken, createPolicy);
router.put("/api/policy", verifyToken, updatePolicy);
router.delete("/api/policy", verifyToken, deletePolicy);

//Auditations routes
router.get("/api/auditations/employee", verifyToken, getAuditationsByEmployee);
router.get("/api/auditations/company", verifyToken, getAuditationsByCompany);

export default router;
