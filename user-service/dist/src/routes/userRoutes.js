"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Route pour l'inscription des candidats
router.post("/register/candidat", userController_1.registerCandidat);
// Route pour l'inscription des admins (entreprises)
router.post("/register/entreprise", userController_1.registerAdmin);
exports.default = router;
