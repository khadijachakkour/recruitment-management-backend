import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import offerRoutes from "./routes/offerRoutes";
import sequelize from "./config/dbConfig";

const app = express();

// Middlewares
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use("/api/offers", offerRoutes);

// Synchronisation de la base de données
const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée !");
  } catch (error) {
    console.error("Erreur de synchronisation de la base de données :", error);
  }
};

syncDb();

// Démarrage du serveur
app.listen(process.env.PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});