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
exports.hasCompanyProfile = exports.updateCompanyProfile = exports.getCompanyProfile = exports.createCompanyProfile = void 0;
const Company_1 = __importDefault(require("../models/Company"));
const createCompanyProfile = (userId, companyData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingCompany = yield Company_1.default.getCompanyByUserId(userId);
        if (existingCompany) {
            throw new Error("L'utilisateur a déjà une entreprise.");
        }
        const company = yield Company_1.default.create(Object.assign(Object.assign({}, companyData), { user_id: userId }));
        return company;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error("Erreur lors de la création du profil d'entreprise: " + error.message);
        }
        throw new Error("Erreur lors de la création du profil d'entreprise.");
    }
});
exports.createCompanyProfile = createCompanyProfile;
const getCompanyProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Company_1.default.getCompanyByUserId(userId);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error("Erreur lors de la récupération du profil d'entreprise: " + error.message);
        }
        throw new Error("Erreur lors de la récupération du profil d'entreprise.");
    }
});
exports.getCompanyProfile = getCompanyProfile;
const updateCompanyProfile = (userId, companyData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const company = yield Company_1.default.getCompanyByUserId(userId);
        if (!company) {
            throw new Error("Aucune entreprise associée à cet utilisateur.");
        }
        yield company.update(companyData);
        return company;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error("Erreur lors de la mise à jour du profil d'entreprise: " + error.message);
        }
        throw new Error("Erreur lors de la mise à jour du profil d'entreprise.");
    }
});
exports.updateCompanyProfile = updateCompanyProfile;
const hasCompanyProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingCompany = yield Company_1.default.getCompanyByUserId(userId);
        return existingCompany !== null; // Renvoie true si l'admin a une entreprise, sinon false
    }
    catch (error) {
        console.error("Erreur lors de la vérification du profil d'entreprise:", error);
        return false; // En cas d'erreur, on suppose qu'il n'a pas d'entreprise
    }
});
exports.hasCompanyProfile = hasCompanyProfile;
