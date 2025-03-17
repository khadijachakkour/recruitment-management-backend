import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function authenticateClient(): Promise<string> {
  try {
    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error("Erreur d'authentification avec Keycloak:", error.response?.data || error.message);
    throw error;
  }
}

export async function createUserInKeycloak(userData: {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  role: string;
}): Promise<void> {
  try {
    const token = await authenticateClient();

    // Création de l'utilisateur
    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstname,
        lastName: userData.lastname,
        enabled: true,
        credentials: [{ type: "password", value: userData.password, temporary: false }],
      },
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );

    // Récupérer l'ID de l'utilisateur Keycloak
    const userId = response.headers.location?.split("/").pop();

    if (!userId) throw new Error("Utilisateur créé mais ID introuvable.");

    // Récupérer le rôle depuis Keycloak
const rolesResponse = await axios.get(
  `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${userData.role}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const roleObject = rolesResponse.data; // Récupérer l'objet complet du rôle

// Assigner le rôle à l'utilisateur
await axios.post(
  `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
  [roleObject], // ✅ Keycloak attend l'objet complet du rôle
  {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  }
);


    console.log(`Utilisateur ${userData.username} inscrit avec le rôle ${userData.role}`);
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur dans Keycloak:", error.response?.data || error.message);
    throw error;
  }
}
