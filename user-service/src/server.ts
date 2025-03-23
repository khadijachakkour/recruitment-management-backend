import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import { requireRole } from "./services/keycloakService";

dotenv.config();

const app = express();

// Configuration des middlewares
app.use(cors({ credentials: true, origin: "http://localhost:3000" })); // Autoriser les cookies cross-origin
app.use(bodyParser.json());
app.use(cookieParser());

// Déclarer les routes
app.use("/api/users", userRoutes);


// Lancer le serveur
app.listen(process.env.PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
