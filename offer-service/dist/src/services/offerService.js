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
exports.getAllOffers = exports.deleteOffer = exports.updateOffer = exports.getOfferById = exports.getOffersByRecruiter = exports.createOffer = void 0;
exports.getUserIdFromToken = getUserIdFromToken;
const Offer_1 = __importDefault(require("../models/Offer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getUserIdFromToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return null;
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        console.log("Invalid Authorization header format");
        return null;
    }
    const token = parts[1];
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return (decoded === null || decoded === void 0 ? void 0 : decoded.sub) || null;
    }
    catch (error) {
        console.error("Erreur de décodage du token:", error);
        return null;
    }
}
const createOffer = (req, offerData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = getUserIdFromToken(req);
    if (!userId) {
        console.error("Erreur : Utilisateur non authentifié"); // Log si l'utilisateur n'est pas authentifié
        throw new Error("Utilisateur non authentifié");
    }
    try {
        console.log("Début de la création de l'offre pour l'utilisateur :", userId); // Log de l'utilisateur
        console.log("Données reçues pour l'offre :", offerData);
        // Récupérer le token d'accès pour appeler Keycloak
        const tokenResponse = yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.KEYCLOAK_CLIENT_ID,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
        }), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const accessToken = tokenResponse.data.access_token;
        console.log("Access Token récupéré avec succès :", accessToken); // Log du token d'accès
        // Appeler Keycloak pour récupérer les informations de l'utilisateur
        const userResponse = yield axios_1.default.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const user = userResponse.data;
        console.log("Informations utilisateur récupérées depuis Keycloak :", user); // Log des informations utilisateur
        const idCompany = (_b = (_a = user.attributes) === null || _a === void 0 ? void 0 : _a.IdCompany) === null || _b === void 0 ? void 0 : _b[0];
        if (!idCompany) {
            console.error("Erreur : idCompany introuvable pour l'utilisateur connecté"); // Log si idCompany est introuvable
            throw new Error("idCompany introuvable pour l'utilisateur connecté");
        }
        console.log("User ID :", userId); // Log de l'ID utilisateur
        console.log("Company ID :", idCompany); // Log de l'ID de la société
        // Ajouter userId et idCompany aux données de l'offre
        const offerWithUserData = Object.assign(Object.assign({}, offerData), { userId, companyId: idCompany });
        console.log("Données de l'offre avant création :", offerWithUserData); // Log des données de l'offre
        // Créer l'offre
        const createdOffer = yield Offer_1.default.create(offerWithUserData);
        console.log("Offre créée avec succès :", createdOffer); // Log de l'offre créée
        return createdOffer;
    }
    catch (error) {
        console.error("Erreur lors de la création de l'offre :", ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message); // Log de l'erreur
        throw error;
    }
});
exports.createOffer = createOffer;
const getOffersByRecruiter = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Offer_1.default.findAll({ where: { userId } });
});
exports.getOffersByRecruiter = getOffersByRecruiter;
const getOfferById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Offer_1.default.findByPk(id);
});
exports.getOfferById = getOfferById;
const updateOffer = (id, offerData) => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield Offer_1.default.findByPk(id);
    if (!offer)
        throw new Error("Offer not found");
    return yield offer.update(offerData);
});
exports.updateOffer = updateOffer;
const deleteOffer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield Offer_1.default.findByPk(id);
    if (!offer)
        throw new Error("Offer not found");
    return yield offer.destroy();
});
exports.deleteOffer = deleteOffer;
const getAllOffers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Offer_1.default.findAll();
});
exports.getAllOffers = getAllOffers;
