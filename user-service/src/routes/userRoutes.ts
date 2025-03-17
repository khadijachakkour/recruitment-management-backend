import { Router } from "express";
import { registerAdmin,registerCandidat } from "../controllers/userController";
const router = Router();

// Route pour l'inscription des candidats
router.post("/register/candidat", registerCandidat);

// Route pour l'inscription des admins (entreprises)
router.post("/register/entreprise", registerAdmin);

export default router;
