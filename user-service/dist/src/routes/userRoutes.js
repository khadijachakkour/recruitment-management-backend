"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const profileController_1 = require("../controllers/profileController");
const upload_1 = __importDefault(require("../middlewares/upload"));
const router = (0, express_1.Router)();
// Route pour l'inscription des candidats
router.post("/register/candidat", userController_1.registerCandidat);
// Route pour l'inscription des admins (entreprises)
router.post("/register/admin", userController_1.registerAdmin);
router.post("/login", userController_1.loginWithEmail);
router.post("/refresh-token", userController_1.refreshToken);
router.get("/profile", profileController_1.getProfile);
router.put("/profile", profileController_1.updateProfile);
router.post("/upload-cv", upload_1.default.single("cv"), profileController_1.uploadCv); // nouvelle route pour le CV
router.post("/upload-avatar", upload_1.default.single("avatar"), profileController_1.uploadAvatar);
router.delete("/delete-avatar", profileController_1.deleteAvatar);
router.delete("/delete-cv", profileController_1.deleteCv);
exports.default = router;
