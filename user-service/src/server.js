process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const { keycloak, memoryStore } = require("../config/keycloak-config"); 
const userRoutes = require("./routes/userRoutes");
const sequelize = require("../config/database");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: true,
  store: memoryStore, 
}));

// Intégration de Keycloak comme middleware
app.use(keycloak.middleware());

// Route protégée pour tester Keycloak
app.get("/protected", keycloak.protect(), (req, res) => {
  res.json({ message: "🔒 Accès autorisé avec token valide !" });
});

// Utilisation des routes pour les utilisateurs
app.use("/api/users", userRoutes);

// Connexion à la base de données
sequelize.sync().then(() => {
  console.log("✅ Database connected");
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
  });
});
