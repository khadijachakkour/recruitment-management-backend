"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Route pour l'inscription des candidats
router.post("/register/candidat", userController_1.registerCandidat);
// Route pour l'inscription des admins (entreprises)
router.post("/register/entreprise", userController_1.registerAdmin);
router.post("/login", userController_1.loginWithEmail);
console.log(userController_1.refreshToken);
router.post("/refresh-token", userController_1.refreshToken);
/*router.get("/x", keycloak.protect('Candidat'), (req, res) => {
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
});*/
exports.default = router;
