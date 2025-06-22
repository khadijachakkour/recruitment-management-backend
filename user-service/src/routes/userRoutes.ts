import { Router } from "express";
import {createRecruteurManagerRH, deleteUser, getCurrentUserId, getUsers, getUsersCountByRoleHandler, loginWithEmail, refreshToken, registerAdmin,registerCandidat, resetPassword, getRecruitmentDistribution, getUserById, getUserProfile, updateCurrentUser, logout } from "../controllers/userController";
import { deleteAvatar, deleteCv, getProfile, updateProfile, uploadAvatar, uploadCv } from "../controllers/profileController";
import upload from "../middlewares/upload";
import { authenticateUser } from "../middlewares/authMiddleware";


const router = Router();

// Route pour l'inscription des candidats
router.post("/register/candidat", registerCandidat);

// Route pour l'inscription des admins (entreprises)
router.post("/register/admin", registerAdmin);


router.post("/login", (req, res, next) => {
  console.log("[USER-SERVICE][ROUTE] POST /login appelée avec body :", req.body);
  next();
}, loginWithEmail);

router.post("/logout", logout);

router.post("/refresh-token", refreshToken);

router.get("/profile", getProfile);
router.put("/updateprofile", updateProfile);

router.post("/upload-cv", upload.single("cv"), uploadCv); 
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.delete("/delete-avatar", deleteAvatar);
router.delete("/delete-cv", deleteCv);


//Gestion des utilisateurs par Admin
router.get("/users", getUsers); 
router.post("/users", createRecruteurManagerRH); 
router.delete("/users/:userId", deleteUser); 
router.get("/userbyId/:userId", getUserById); 


//Reset password
router.post("/reset-password", resetPassword);

router.get('/count-by-role/:userId',authenticateUser, getUsersCountByRoleHandler);
router.get("/userId", getCurrentUserId);

router.get("/UserProfile", getUserProfile);

// Route pour la répartition des utilisateurs par rôle
router.get("/statistics/recruitment-distribution", getRecruitmentDistribution);

router.put("/updateProfileCurrentUser", updateCurrentUser);


export default router;
