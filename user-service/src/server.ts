import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import { keycloak } from "../config/keycloak-config"; // Importer la configuration Keycloak

dotenv.config();

const app = express();

// Utilisation des middlewares nécessaires
app.use(cors());
app.use(bodyParser.json());
app.use(session({ secret: "mysecret", resave: false, saveUninitialized: true }));

// Keycloak middleware pour sécuriser l'application
app.use(keycloak.middleware());

// Routes utilisateurs - Inscription, connexion
app.use("/api/users", userRoutes);



app.listen(process.env.PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
