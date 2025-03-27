import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request } from "express";


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

const roleObject = rolesResponse.data; 

// Assigner le rôle à l'utilisateur
await axios.post(
  `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
  [roleObject], 
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

//Un middleware Express qui permet de restreindre l'accès à certaines routes en fonction du rôle de l'utilisateur
export function requireRole(role: string) {
  return (req: any, res: any, next: any) => {
      if (!req.kauth || !req.kauth.grant || !req.kauth.grant.access_token) {
          return res.status(401).json({ message: "Utilisateur non authentifié" });
      }

      const tokenPayload = req.kauth.grant.access_token.content;
      console.log("Payload du token:", JSON.stringify(tokenPayload, null, 2));

      const roles: string[] = req.kauth.grant.access_token.content?.realm_access?.roles || [];
      console.log("Rôles de l'utilisateur :", roles);

      if (!roles.includes(role)) {
          return res.status(403).json({ message: "Accès refusé, rôle insuffisant." });
      }

      next();
  };
}


export function getUserIdFromToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token) as { sub: string };
    return decoded?.sub || null;
  } catch (error) {
    console.error("Erreur de décodage du token:", error);
    return null;
  }
}


