import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import axios from "axios";

dotenv.config();

const app = express();

// Configuration des middlewares
app.use(cors({ credentials: true, origin: "http://localhost:3000" })); // Autoriser les cookies cross-origin
app.use(bodyParser.json());
app.use(cookieParser());

// Déclarer les routes
app.use("/api/users", userRoutes);

app.post("/logout", (req: Request, res: Response): void => {
  (async () => {
    try {
      const refreshToken = req.cookies?.refresh_token;
  
      if (!refreshToken) {
        res.status(400).json({ message: "Aucun refresh token trouvé" });
        return;
      }
  
      await axios.post(
        `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
        new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID as string,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
          refresh_token: refreshToken,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
  
      res.clearCookie("refresh_token", { httpOnly: true, path: "/" });
      res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error.response?.data || error.message);
      res.status(500).json({ message: "Erreur lors de la déconnexion" });
    }
  })();
});

// Lancer le serveur
app.listen(process.env.PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
