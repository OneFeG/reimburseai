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
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image uploads are allowed"));
  },
});

// Auditor routes
router.post(
  "/api/auditup",
  verifyToken,
  upload.single("file"),
  PlatformReimburseFlow,
);
router.post("/auditor", upload.single("file"), x402Getter);

//Employees routes
router.get("/employee", verifyToken, getEmployee);
router.post("/employeeup", verifyToken, createEmployee);
router.put("/employee", verifyToken, updateEmployee);
router.delete("/employee", verifyToken, deleteEmployee);
router.post("/employee/accept", verifyToken, acceptEmployeeInvite);

//Company routes
router.get("/company", verifyToken, getCompany);
router.post("/companyup", verifyToken, createCompany);
router.put("/company", verifyToken, updateCompany);
router.delete("/company", verifyToken, deleteCompany);
router.post("/company/invite", verifyToken, inviteEmployee);
router.put("/company/delete", verifyToken, deleteEmployeeInCompany);
router.get("/company/employees", verifyToken, getEmployeesInCompany);

//Policy routes
router.get("/policy", verifyToken, getPolicies);
router.post("/policy", verifyToken, createPolicy);
router.put("/policy", verifyToken, updatePolicy);
router.delete("/policy", verifyToken, deletePolicy);

//Auditations routes
router.get("/auditations/employee", verifyToken, getAuditationsByEmployee);
router.get("/auditations/company", verifyToken, getAuditationsByCompany);

export default router;
