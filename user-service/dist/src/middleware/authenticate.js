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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// URL pour obtenir la clé publique de Keycloak
const keycloakCertUrl = `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`;
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token; // Extraire le token du cookie HTTP-Only
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        // Récupérer la clé publique de Keycloak (une fois)
        const response = yield axios_1.default.get(keycloakCertUrl);
        const keycloakPublicKey = response.data.keys[0].x5c[0];
        // Vérifier le token avec la clé publique de Keycloak
        const decoded = jsonwebtoken_1.default.verify(token, `-----BEGIN CERTIFICATE-----\n${keycloakPublicKey}\n-----END CERTIFICATE-----`);
        req.user = decoded; // Attacher les informations de l'utilisateur à req.user
        next(); // Passer au middleware suivant ou à la route protégée
    }
    catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
});
exports.default = authenticate;
