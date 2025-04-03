import { Router } from "express";
import {loginWithEmail, refreshToken, registerAdmin,registerCandidat } from "../controllers/userController";
import { getProfile, updateProfile } from "../controllers/profileController";

const router = Router();

// Route pour l'inscription des candidats
router.post("/register/candidat", registerCandidat);

// Route pour l'inscription des admins (entreprises)
router.post("/register/admin", registerAdmin);


router.post("/login", loginWithEmail);

router.post("/refresh-token", refreshToken);
router.post("/create-company-profile", );

router.get("/profile", getProfile);
router.put("/profile", updateProfile);


export default router;
