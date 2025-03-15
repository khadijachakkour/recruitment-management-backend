const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { createUserInKeycloak, assignRoleToUser } = require("../services/keycloakService");


// Inscription d'un utilisateur
const register = async (req, res) => {
  try {
    const { firstname, lastname, username, email, password} = req.body;


    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 1. Création de l'utilisateur dans PostgreSQL
    const user = await User.create({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
    });

    // 🔹 2. Création de l'utilisateur dans Keycloak
    await createUserInKeycloak({
      firstname,
      lastname,
      username,
      email,
      password, // On envoie le mot de passe en clair pour Keycloak
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
};


/* Connexion d'un utilisateur
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

*/

// Export des fonctions correctement
//module.exports = { register, login};
module.exports = { register};

