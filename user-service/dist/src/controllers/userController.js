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
exports.refreshToken = exports.loginWithEmail = exports.registerAdmin = exports.registerCandidat = void 0;
const axios_1 = __importDefault(require("axios"));
const keycloakService_1 = require("../services/keycloakService");
const dotenv_1 = __importDefault(require("dotenv"));
const UserProfile_1 = __importDefault(require("../models/UserProfile"));
dotenv_1.default.config();
const registerCandidat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstname, lastname, username, email, password } = req.body;
        const role = "Candidat"; // Assignation automatique du rôle
        // Création de l'utilisateur dans Keycloak
        const keycloakUser = yield (0, keycloakService_1.createUserInKeycloak)({ firstname, lastname, username, email, password, role });
        if (!keycloakUser || !keycloakUser.id) {
            res.status(500).json({ message: "Erreur lors de la création de l'utilisateur dans Keycloak" });
            return; // Retour explicite après envoi de la réponse
        }
        const keycloakUserId = keycloakUser.id; // Récupération de l'ID Keycloak
        // Créer un profil vide dans PostgreSQL avec l'ID Keycloak comme user_id
        yield UserProfile_1.default.create({ user_id: keycloakUserId });
        res.status(201).json({ message: "Candidat inscrit avec succès", user_id: keycloakUserId });
    }
    catch (error) {
        console.error("Erreur d'inscription du candidat :", error);
        res.status(500).json({ message: "Erreur d'inscription du candidat", error });
    }
});
exports.registerCandidat = registerCandidat;
// Inscription d'un admin entreprise (assignation automatique du rôle "Admin")
const registerAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstname, lastname, username, email, password } = req.body;
        const role = "Admin"; // Assignation automatique du rôle
        yield (0, keycloakService_1.createUserInKeycloak)({ firstname, lastname, username, email, password, role });
        res.status(201).json({ message: "Admin inscrit avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur d'inscription de l'admin", error });
    }
});
exports.registerAdmin = registerAdmin;
const loginWithEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email et mot de passe sont requis." });
            return;
        }
        const params = new URLSearchParams({
            grant_type: "password",
            client_id: process.env.KEYCLOAK_CLIENT_ID,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
            username: email,
            password: password,
        });
        // Effectuer la requête à Keycloak
        const response = yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, params, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        const { access_token, refresh_token } = response.data;
        // Définir un cookie sécurisé pour le refresh token
        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: false,
            path: "/",
            sameSite: "lax",
        });
        res.status(200).json({ access_token });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            res.status(error.response.status).json({ message: error.response.data.error_description || "Erreur d'authentification." });
        }
        else {
            res.status(500).json({ message: "Erreur interne du serveur." });
        }
    }
});
exports.loginWithEmail = loginWithEmail;
// Rafraîchir le token
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }
        const params = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.KEYCLOAK_CLIENT_ID,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
            refresh_token: refreshToken,
        });
        const response = yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, params, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        res.cookie("refresh_token", response.data.refresh_token, {
            httpOnly: true,
            secure: false,
            path: "/",
            sameSite: "lax",
        });
        res.status(200).json({ access_token: response.data.access_token });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            if (error.response.status === 400 && error.response.data.error === "invalid_grant") {
                res.clearCookie("refresh_token", { path: "/api/users/refresh-token" });
                res.status(401).json({ message: "Session expirée, veuillez vous reconnecter." });
            }
            else {
                res.status(error.response.status).json({ message: error.response.data.error_description || "Erreur d'authentification." });
            }
        }
        else {
            res.status(500).json({ message: "Erreur interne du serveur." });
        }
    }
});
exports.refreshToken = refreshToken;
