// routes/companyRoutes.ts
import { Router } from "express";
import { createCompanyProfile, getCompanyProfile, updateCompanyProfile } from "../controllers/companyController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.post("/createCompany", authenticateUser, createCompanyProfile);
router.get("/profile", authenticateUser, getCompanyProfile);
router.put("/updateProfile", authenticateUser, updateCompanyProfile);

export default router;
