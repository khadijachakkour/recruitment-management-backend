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
const CandidatureRoutes_1 = __importDefault(require("./routes/CandidatureRoutes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({ credentials: true, origin: "http://localhost:3000" }));
app.use(body_parser_1.default.json());
app.use(express_1.default.json());
// Routes
app.use("/api/candidatures", CandidatureRoutes_1.default);
// Synchronisation de la base de données
const syncDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.sync({ alter: true });
        console.log("Base de données synchronisée !");
    }
    catch (error) {
        console.error("Erreur de synchronisation de la base de données :", error);
    }
});
syncDb();
// Démarrage du serveur
app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
