import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request } from "express";


dotenv.config();

export async function authenticateClient(): Promise<string> {
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
  }): Promise<{ id: string }> { 
    try {
      const token = await authenticateClient();
  
      // Création de l'utilisateur dans Keycloak
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
  
      // Récupérer l'ID Keycloak depuis l'en-tête Location
      const userId = response.headers.location?.split("/").pop();
      if (!userId) throw new Error("Utilisateur créé mais ID introuvable.");
  
      // Récupérer le rôle depuis Keycloak
      const rolesResponse = await axios.get(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${userData.role}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const roleObject = rolesResponse.data;
  
      // Assigner le rôle à l'utilisateur
      await axios.post(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
        [roleObject], 
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
  
      console.log(`Utilisateur ${userData.username} inscrit avec l'ID ${userId} et le rôle ${userData.role}`);
      return { id: userId }; // 👈 Retourner l'ID Keycloak
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur dans Keycloak:", error.response?.data || error.message);
      throw error;
    }
  }
  

  export function getUserIdFromToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
  
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("Invalid Authorization header format");
      return null;
    }
  
    const token = parts[1];
    try {
      const decoded = jwt.decode(token) as { sub: string };
      return decoded?.sub || null;
    } catch (error) {
      console.error("Erreur de décodage du token:", error);
      return null;
    }
  }
  


// Route pour ajouter un utilisateur
export const createUser = async (req: Request): Promise<void> => {
  const { firstname, lastname, username, email, password, role } = req.body;

  try {
    const user = await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    console.log("Utilisateur créé avec succès");
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur");
  }
};
