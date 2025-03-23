"use strict";
/* import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import { keycloak, memoryStore } from "../config/keycloak-config"; // Importer la configuration Keycloak
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

// 🔹 Configuration des cookies sécurisés
app.use(cors({
  origin: "http://localhost:3000", // URL du frontend
  credentials: true // Permet d'envoyer les cookies
}));

app.use(bodyParser.json());
app.use(cookieParser());

// 🔹 1️⃣ Activer les sessions AVANT Keycloak
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore, // Utiliser le même store que Keycloak
  })
);



// 🔹 3️⃣ Activer Keycloak APRÈS la session
app.use(keycloak.middleware());

// 🔹 4️⃣ Déclarer les routes APRÈS Keycloak
app.use("/api/users", userRoutes);

// 🔹 5️⃣ Lancer le serveur
app.listen(process.env.PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configuration des middlewares
app.use((0, cors_1.default)({ credentials: true, origin: "http://localhost:3000" })); // Autoriser les cookies cross-origin
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
// Déclarer les routes
app.use("/api/users", userRoutes_1.default);
// Lancer le serveur
app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
