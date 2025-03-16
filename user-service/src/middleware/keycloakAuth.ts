/*const axios = require('axios');
require("dotenv").config({ path: __dirname + "./config/env" });


// Fonction pour authentifier un utilisateur (par exemple, admin)
async function authenticateAdmin() {
  try {
    const response = await axios.post(`${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, new URLSearchParams({
      grant_type: 'client_credentials', 
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Nécessaire pour POST
      },
    });

    console.log('Admin authentifié avec succès');
    console.log('Access Token:', response.data.access_token);
    return response.data.access_token;

  } catch (error) {
    console.error('Erreur d\'authentification avec Keycloak:', error.response ? error.response.data : error.message);
    throw error;  // Propagation de l'erreur pour gestion dans l'appelant
  }
}

// Export de la fonction si vous avez besoin de l'utiliser ailleurs
module.exports = {
  authenticateAdmin,
};
*/
