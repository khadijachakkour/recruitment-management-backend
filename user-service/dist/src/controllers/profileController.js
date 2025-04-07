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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCv = exports.deleteAvatar = exports.uploadAvatar = exports.uploadCv = exports.updateProfile = exports.getProfile = void 0;
const profileService_1 = require("../services/profileService");
const keycloakService_1 = require("../services/keycloakService");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
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
    var _a;
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
        const profile = yield (0, profileService_1.getUserProfile)(userId);
        const oldCvUrl = profile.cv_url; // L'URL du CV actuel, avant de le remplacer
        // Extraire le public_id du CV actuel (si disponible)
        const oldPublicId = oldCvUrl ? (_a = oldCvUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0] : undefined;
        // Stream du buffer vers Cloudinary avec un public_id spécifique pour remplacer l'ancien fichier
        const streamUpload = () => new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({
                folder: "CVsCandidats", // Dossier Cloudinary
                public_id: oldPublicId || undefined, // Remplacer l'ancien fichier avec le même public_id si disponible, sinon laisser vide
                resource_type: "auto", // Accepter tous les types de fichiers
            }, (error, result) => {
                if (result)
                    resolve(result);
                else
                    reject(error);
            });
            if (!req.file) {
                res.status(400).json({ message: "Aucun fichier reçu" });
                return;
            }
            streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
        });
        const result = yield streamUpload();
        const cvUrl = result.secure_url;
        // Sauvegarder la nouvelle URL du CV dans la base de données
        yield (0, profileService_1.saveCvUrl)(userId, cvUrl);
        res.status(200).json({ cv_url: cvUrl });
    }
    catch (error) {
        console.error("Erreur Cloudinary :", error);
        res.status(500).json({ message: "Erreur lors de l'upload du CV", error });
    }
});
exports.uploadCv = uploadCv;
const uploadAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(400).json({ message: "Données manquantes" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Aucun fichier reçu" });
            return;
        }
        const profile = yield (0, profileService_1.getUserProfile)(userId);
        const oldAvatarUrl = profile.avatar_url;
        const oldPublicId = oldAvatarUrl ? (_a = oldAvatarUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0] : undefined;
        const streamUpload = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({
                    folder: "avatars",
                    public_id: oldPublicId || undefined, // Remplacer l'ancien fichier avec le même public_id si disponible, sinon laisser vide
                    resource_type: "image",
                }, (error, result) => {
                    if (result)
                        resolve(result);
                    else
                        reject(error);
                });
                if (!req.file) {
                    res.status(400).json({ message: "Aucun fichier reçu" });
                    return;
                }
                streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
            });
        };
        const result = yield streamUpload();
        const avatarUrl = result.secure_url;
        yield (0, profileService_1.saveAvatarUrl)(userId, avatarUrl);
        res.status(200).json({ avatar_url: avatarUrl });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur lors de l’upload de l’avatar", error });
    }
});
exports.uploadAvatar = uploadAvatar;
const extractCloudinaryPublicId = (url) => {
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)\.[^\/]+$/);
    return matches ? matches[1] : null;
};
const deleteAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const profile = yield (0, profileService_1.getUserProfile)(userId);
        if (!profile.avatar_url) {
            res.status(400).json({ message: "Aucun avatar à supprimer." });
            return;
        }
        const publicId = extractCloudinaryPublicId(profile.avatar_url); // à créer
        if (publicId) {
            yield cloudinary_1.default.uploader.destroy(publicId);
        }
        yield (0, profileService_1.saveAvatarUrl)(userId, null); // mets avatar_url à null en BDD
        res.status(200).json({ message: "Avatar supprimé avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur suppression avatar", error });
    }
});
exports.deleteAvatar = deleteAvatar;
const deleteCv = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = (0, keycloakService_1.getUserIdFromToken)(req);
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const profile = yield (0, profileService_1.getUserProfile)(userId);
        if (!profile.cv_url) {
            res.status(400).json({ message: "Aucun CV à supprimer." });
            return;
        }
        const publicId = extractCloudinaryPublicId(profile.cv_url); // à créer
        if (publicId) {
            yield cloudinary_1.default.uploader.destroy(publicId, { resource_type: "auto" });
        }
        yield (0, profileService_1.saveCvUrl)(userId, null); // mets cv_url à null en BDD
        res.status(200).json({ message: "CV supprimé avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur suppression CV", error });
    }
});
exports.deleteCv = deleteCv;
