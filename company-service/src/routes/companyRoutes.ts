// routes/companyRoutes.ts
import { Router } from "express";
import { assignDepartmentsToUser, checkCompanyProfile, createCompanyProfile, getCompanyByAdminId, getCompanyProfile, updateCompanyProfile } from "../controllers/companyController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.post("/createCompany", authenticateUser, createCompanyProfile);
router.get("/profile", authenticateUser, getCompanyProfile);
router.put("/updateProfile", authenticateUser, updateCompanyProfile);
router.get("/admin/company", authenticateUser, checkCompanyProfile);
router.get("/by-admin/:adminId", getCompanyByAdminId);

router.put("/users/:userId/departments", authenticateUser, assignDepartmentsToUser);

export default router;