import express from 'express';
import entretienRoutes from './routes/entretienRoutes';
import sequelize from './config/dbConfig';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/entretiens', entretienRoutes);

// Synchroniser la base de données
const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée !");
  } catch (error) {
    console.error("Erreur de synchronisation de la base de données : ", error);
  }
};

syncDb();

app.listen(process.env.PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
