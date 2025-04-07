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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const axios_1 = __importDefault(require("axios"));
const dbConfig_1 = __importDefault(require("./config/dbConfig"));
const app = (0, express_1.default)();
// Configuration des middlewares
app.use((0, cors_1.default)({ credentials: true, origin: "http://localhost:3000" }));
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// Déclarer les routes
app.use("/api/users", userRoutes_1.default);
// Route de déconnexion
app.post("/logout", (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refresh_token;
            if (!refreshToken) {
                res.status(400).json({ message: "Aucun refresh token trouvé" });
                return;
            }
            yield axios_1.default.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`, new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
                refresh_token: refreshToken,
            }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
            res.clearCookie("refresh_token", { httpOnly: true, path: "/" });
            res.status(200).json({ message: "Déconnexion réussie" });
        }
        catch (error) {
            console.error("Erreur lors de la déconnexion:", ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            res.status(500).json({ message: "Erreur lors de la déconnexion" });
        }
    }))();
});
// Synchroniser la base de données
const syncDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbConfig_1.default.sync({ alter: true });
        console.log("Base de données synchronisée !");
    }
    catch (error) {
        console.error("Erreur de synchronisation de la base de données : ", error);
    }
});
syncDb();
// Lancer le serveur
app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
