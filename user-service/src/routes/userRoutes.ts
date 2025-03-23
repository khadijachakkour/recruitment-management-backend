import { Router } from "express";
import {loginWithEmail, refreshToken, registerAdmin,registerCandidat } from "../controllers/userController";

const router = Router();

// Route pour l'inscription des candidats
router.post("/register/candidat", registerCandidat);

// Route pour l'inscription des admins (entreprises)
router.post("/register/entreprise", registerAdmin);


router.post("/login", loginWithEmail);

router.post("/refresh-token", refreshToken);


export default router;
