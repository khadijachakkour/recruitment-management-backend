"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const profileService_1 = require("../services/profileService");
const keycloakService_1 = require("../services/keycloakService");
// Récupérer le profil de l'utilisateur
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const profile = yield (0, profileService_1.getUserProfile)(userId);
        res.status(200).json(profile);
    }
    catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du profil", error });
    }
});
exports.getProfile = getProfile;
// Mettre à jour le profil de l'utilisateur
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const { phone_number, address, experience, education_level, skills, cv_url } = req.body;
        const updatedProfile = yield (0, profileService_1.updateUserProfile)(userId, {
            phone_number,
            address,
            experience,
            education_level,
            skills,
            cv_url,
        });
        res.status(200).json(updatedProfile);
    }
    catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error });
    }
});
exports.updateProfile = updateProfile;
