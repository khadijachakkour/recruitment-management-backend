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
exports.createUserInKeycloak = createUserInKeycloak;
exports.requireRole = requireRole;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function authenticateClient() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const response = yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, new URLSearchParams({
                grant_type: "client_credentials",
                client_id: process.env.KEYCLOAK_CLIENT_ID,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
            }), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            return response.data.access_token;
        }
        catch (error) {
            console.error("Erreur d'authentification avec Keycloak:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        }
    });
}
function createUserInKeycloak(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const token = yield authenticateClient();
            // Création de l'utilisateur
            const response = yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
                username: userData.username,
                email: userData.email,
                firstName: userData.firstname,
                lastName: userData.lastname,
                enabled: true,
                credentials: [{ type: "password", value: userData.password, temporary: false }],
            }, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            // Récupérer l'ID de l'utilisateur Keycloak
            const userId = (_a = response.headers.location) === null || _a === void 0 ? void 0 : _a.split("/").pop();
            if (!userId)
                throw new Error("Utilisateur créé mais ID introuvable.");
            // Récupérer le rôle depuis Keycloak
            const rolesResponse = yield axios_1.default.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${userData.role}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const roleObject = rolesResponse.data; // Récupérer l'objet complet du rôle
            // Assigner le rôle à l'utilisateur
            yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`, [roleObject], // ✅ Keycloak attend l'objet complet du rôle
            {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            console.log(`Utilisateur ${userData.username} inscrit avec le rôle ${userData.role}`);
        }
        catch (error) {
            console.error("Erreur lors de la création de l'utilisateur dans Keycloak:", ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            throw error;
        }
    });
}
function requireRole(role) {
    return (req, res, next) => {
        var _a, _b;
        if (!req.kauth || !req.kauth.grant || !req.kauth.grant.access_token) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }
        const roles = ((_b = (_a = req.kauth.grant.access_token.content) === null || _a === void 0 ? void 0 : _a.realm_access) === null || _b === void 0 ? void 0 : _b.roles) || [];
        console.log("Rôles de l'utilisateur :", roles);
        if (!roles.includes(role)) {
            return res.status(403).json({ message: "Accès refusé, rôle insuffisant." });
        }
        next();
    };
}
