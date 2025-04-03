"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const profileController_1 = require("../controllers/profileController");
const router = (0, express_1.Router)();
// Route pour l'inscription des candidats
router.post("/register/candidat", userController_1.registerCandidat);
// Route pour l'inscription des admins (entreprises)
router.post("/register/admin", userController_1.registerAdmin);
router.post("/login", userController_1.loginWithEmail);
router.post("/refresh-token", userController_1.refreshToken);
router.post("/create-company-profile");
router.get("/profile", profileController_1.getProfile);
router.put("/profile", profileController_1.updateProfile);
exports.default = router;
