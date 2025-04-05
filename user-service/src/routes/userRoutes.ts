import { Router } from "express";
import {loginWithEmail, refreshToken, registerAdmin,registerCandidat } from "../controllers/userController";
import { getProfile, updateProfile, uploadCv } from "../controllers/profileController";
import upload from "../middlewares/upload";

const router = Router();

// Route pour l'inscription des candidats
router.post("/register/candidat", registerCandidat);

// Route pour l'inscription des admins (entreprises)
router.post("/register/admin", registerAdmin);


router.post("/login", loginWithEmail);

router.post("/refresh-token", refreshToken);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.post("/upload-cv", upload.single("cv"), uploadCv); // nouvelle route pour le CV

export default router;
