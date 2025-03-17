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
exports.loginWithEmail = exports.registerAdmin = exports.registerCandidat = void 0;
const axios_1 = __importDefault(require("axios"));
const keycloakService_1 = require("../services/keycloakService");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Inscription d'un candidat (assignation automatique du rôle "Candidat")
const registerCandidat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstname, lastname, username, email, password } = req.body;
        const role = "Candidat"; // Assignation automatique du rôle
        yield (0, keycloakService_1.createUserInKeycloak)({ firstname, lastname, username, email, password, role });
        res.status(201).json({ message: "Candidat inscrit avec succès" });
    }
    catch (error) {
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
/// Fonction de login avec email et mot de passe
const loginWithEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email et mot de passe sont requis." });
        }
        // Demande un token d'accès à Keycloak
        const response = yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, new URLSearchParams({
            grant_type: "password",
            client_id: process.env.KEYCLOAK_CLIENT_ID,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
            username: email,
            password: password,
        }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        // Si la connexion réussie, retourner les tokens d'accès
        res.status(200).json({
            message: "Connexion réussie",
            access_token: response.data.access_token, // Token d'accès
            refresh_token: response.data.refresh_token, // Token de rafraîchissement
        });
    }
    catch (error) {
        // Gestion des erreurs
        console.error("Erreur lors de la connexion avec Keycloak:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        // Vérification de l'erreur, message plus précis en fonction du code d'erreur
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 400) {
            res.status(400).json({
                message: "Identifiants invalides, veuillez vérifier votre email et mot de passe.",
            });
        }
        res.status(((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) || 500).json({
            message: "Échec de la connexion",
            error: ((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || error.message,
        });
    }
});
exports.loginWithEmail = loginWithEmail;
