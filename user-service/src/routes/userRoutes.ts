import { Router } from "express";
import { keycloak } from "../../config/keycloak-config";
import {loginWithEmail, registerAdmin,registerCandidat } from "../controllers/userController";
import { requireRole } from "../services/keycloakService";

const router = Router();

// Route pour l'inscription des candidats
router.post("/register/candidat", registerCandidat);

// Route pour l'inscription des admins (entreprises)
router.post("/register/entreprise", registerAdmin);


router.post("/login", loginWithEmail);

router.get("/x", keycloak.protect('Candidat'), (req, res) => {
    // Si l'utilisateur est authentifié, on peut accéder à ses données
    if (req.kauth && req.kauth.grant) {
        const user = req.kauth.grant.access_token.content;  // Vous pouvez adapter ce champ selon vos besoins
        res.status(200).json({ message: "Votre profil utilisateur" });
    } else {
        res.status(401).json({ message: "Utilisateur non authentifié" });
    }
});

// Route protégée accessible uniquement aux candidats
router.get("/profile", keycloak.protect(), requireRole("Candidat"), (req, res) => {
    res.status(200).json({ message: "Bienvenue Candidat !" });
});


export default router;
