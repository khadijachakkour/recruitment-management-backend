const axios = require('axios');
require("dotenv").config();

// Fonction pour obtenir un Access Token avec client_credentials
async function authenticateClient() {
  try {
    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials', // Utilisation du grant_type client_credentials
        client_id: process.env.KEYCLOAK_CLIENT_ID,  // ID du client
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,  // Secret du client
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Nécessaire pour POST
        },
      }
    );
    
    // Afficher le token d'accès obtenu
    console.log('Access Token:', response.data.access_token);
    return response.data.access_token; // Retourne le token d'accès

  } catch (error) {
    console.error('Erreur lors de l\'authentification avec Keycloak:', error.response ? error.response.data : error.message);
    throw error; // Propagation de l'erreur pour gestion dans l'appelant
  }
}

// Exemple d'utilisation pour créer un utilisateur (après authentification)
async function createUserInKeycloak(userData) {
  try {
    const token = await authenticateClient(); // Authentification avec client_credentials

    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstname,
        lastName: userData.lastname,
        //role:userData.role,
        enabled: true,
        credentials: [
          {
            type: "password",  // Mot de passe de l'utilisateur
            value: userData.password,
            temporary: false,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,  // Utilisation du token d'accès pour l'authentification
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Utilisateur créé avec succès dans Keycloak:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur dans Keycloak", error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { authenticateClient, createUserInKeycloak };
