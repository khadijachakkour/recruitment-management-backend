import { Router } from "express";
import {createRecruteurManagerRH, deleteUser, getCurrentUserId, getUsers, getUsersCountByRoleHandler, loginWithEmail, refreshToken, registerAdmin,registerCandidat, resetPassword } from "../controllers/userController";
import { deleteAvatar, deleteCv, getProfile, updateProfile, uploadAvatar, uploadCv } from "../controllers/profileController";
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
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.delete("/delete-avatar", deleteAvatar);
router.delete("/delete-cv", deleteCv);


//Gestion des utilisateurs par Admin
router.get("/users", getUsers); // Route pour récupérer les utilisateurs
router.post("/users", createRecruteurManagerRH); // Route pour créer un utilisateur
router.delete("/users/:userId", deleteUser); // Route pour supprimer un utilisateur


//Reset password
router.post("/reset-password", resetPassword);

router.get('/count-by-role/:userId', getUsersCountByRoleHandler);
router.get("/userId", getCurrentUserId);


export default router;
