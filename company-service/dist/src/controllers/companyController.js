"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.checkCompanyProfile = exports.updateCompanyProfile = exports.getCompanyProfile = exports.createCompanyProfile = void 0;
const companyService = __importStar(require("../services/companyService"));
const createCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const userId = req.user.id;
        const company = yield companyService.createCompanyProfile(userId, req.body);
        res.status(201).json({ message: "Entreprise créée avec succès.", company });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        res.status(500).json({ message: errorMessage });
    }
});
exports.createCompanyProfile = createCompanyProfile;
const getCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const userId = req.user.id;
        const company = yield companyService.getCompanyProfile(userId);
        if (!company) {
            res.status(404).json({ message: "Aucune entreprise trouvée." });
            return;
        }
        res.status(200).json(company);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        res.status(500).json({ message: errorMessage });
    }
});
exports.getCompanyProfile = getCompanyProfile;
const updateCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Utilisateur non authentifié" });
            return;
        }
        const userId = req.user.id;
        const updatedCompany = yield companyService.updateCompanyProfile(userId, req.body);
        res.status(200).json({ message: "Profil mis à jour avec succès.", updatedCompany });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        res.status(500).json({ message: errorMessage });
    }
});
exports.updateCompanyProfile = updateCompanyProfile;
const checkCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // L'ID de l'utilisateur récupéré depuis Keycloak
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return; // 🚀 Ajout d'un return pour éviter l'exécution de la suite
        }
        const hasProfile = yield companyService.hasCompanyProfile(userId);
        res.json({ hasCompanyProfile: hasProfile }); // ✅ Envoie la réponse sans return explicite
    }
    catch (error) {
        console.error("Erreur lors de la vérification du profil d'entreprise:", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
});
exports.checkCompanyProfile = checkCompanyProfile;
