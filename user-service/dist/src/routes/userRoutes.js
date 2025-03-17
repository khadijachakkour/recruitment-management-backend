"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const keycloak_config_1 = require("../../config/keycloak-config");
const userController_1 = require("../controllers/userController");
const keycloakService_1 = require("../services/keycloakService");
const router = (0, express_1.Router)();
// Route pour l'inscription des candidats
router.post("/register/candidat", userController_1.registerCandidat);
// Route pour l'inscription des admins (entreprises)
router.post("/register/entreprise", userController_1.registerAdmin);
router.post("/login", userController_1.loginWithEmail);
router.get("/x", keycloak_config_1.keycloak.protect('Candidat'), (req, res) => {
    // Si l'utilisateur est authentifié, on peut accéder à ses données
    if (req.kauth && req.kauth.grant) {
        const user = req.kauth.grant.access_token.content; // Vous pouvez adapter ce champ selon vos besoins
        res.status(200).json({ message: "Votre profil utilisateur" });
    }
    else {
        res.status(401).json({ message: "Utilisateur non authentifié" });
    }
});
// Route protégée accessible uniquement aux candidats
router.get("/profile", keycloak_config_1.keycloak.protect(), (0, keycloakService_1.requireRole)("Candidat"), (req, res) => {
    res.status(200).json({ message: "Bienvenue Candidat !" });
});
exports.default = router;
