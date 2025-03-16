import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(session({ secret: "mysecret", resave: false, saveUninitialized: true }));

app.use("/api/users", userRoutes);


  app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
  });


