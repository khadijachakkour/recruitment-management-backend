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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdmin = exports.registerCandidat = void 0;
const keycloakService_1 = require("../services/keycloakService");
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
