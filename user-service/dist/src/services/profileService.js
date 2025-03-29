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
exports.saveCvUrl = exports.updateUserProfile = exports.getUserProfile = void 0;
const UserProfile_1 = __importDefault(require("../models/UserProfile"));
// Récupérer le profil d'un utilisateur
const getUserProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield UserProfile_1.default.findOne({ where: { user_id: userId } });
    if (!profile)
        throw new Error("Profil non trouvé");
    return profile;
});
exports.getUserProfile = getUserProfile;
// Mettre à jour le profil de l'utilisateur
const updateUserProfile = (userId, profileData) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield UserProfile_1.default.findOne({ where: { user_id: userId } });
    if (!profile)
        throw new Error("Profil non trouvé");
    yield profile.update(profileData);
    return profile;
});
exports.updateUserProfile = updateUserProfile;
// Enregistrer l'URL du CV
const saveCvUrl = (userId, cvUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield UserProfile_1.default.findOne({ where: { user_id: userId } });
    if (!profile)
        throw new Error("Profil non trouvé");
    profile.cv_url = cvUrl;
    yield profile.save();
});
exports.saveCvUrl = saveCvUrl;
