"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const keycloak_config_1 = require("../config/keycloak-config"); // Importer la configuration Keycloak
dotenv_1.default.config();
const app = (0, express_1.default)();
// Utilisation des middlewares nécessaires
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use((0, express_session_1.default)({ secret: "mysecret", resave: false, saveUninitialized: true }));
// Keycloak middleware pour sécuriser l'application
app.use(keycloak_config_1.keycloak.middleware());
// Routes utilisateurs - Inscription, connexion
app.use("/api/users", userRoutes_1.default);
app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
