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
exports.uploadCv = exports.updateProfile = exports.getProfile = void 0;
const profileService_1 = require("../services/profileService");
const keycloakService_1 = require("../services/keycloakService");
// Récupérer le profil du candidat
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
// Mettre à jour le profil
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const updatedProfile = yield (0, profileService_1.updateUserProfile)(userId, req.body);
        res.status(200).json(updatedProfile);
    }
    catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error });
    }
});
exports.updateProfile = updateProfile;
// 📌 Téléverser un CV
const uploadCv = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Aucun fichier reçu" });
            return;
        }
        // Générer l'URL du fichier
        const cvUrl = `/uploads/${req.file.filename}`;
        // Sauvegarder l'URL du CV en base de données
        yield (0, profileService_1.saveCvUrl)(userId, cvUrl);
        res.status(200).json({ message: "CV téléversé avec succès", cv_url: cvUrl });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur lors du téléversement du CV", error });
    }
});
exports.uploadCv = uploadCv;
