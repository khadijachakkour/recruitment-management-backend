//Gestion des utilisateurs par Admin
"use client";
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
export async function createUser(userData: {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    role: string;
  }): Promise<{ id: string }> {
    try {
      const token = await authenticateClient();
  
      // 1. Créer l'utilisateur sans mot de passe
      const createResponse = await axios.post(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
        {
          username: userData.username,
          email: userData.email,
          firstName: userData.firstname,
          lastName: userData.lastname,
          enabled: true,
          emailVerified: true,
          requiredActions: ["UPDATE_PASSWORD"], // 👉 forcer la réinitialisation du mot de passe
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      // 2. Récupérer l'ID de l'utilisateur nouvellement créé
      const userId = createResponse.headers.location?.split("/").pop();
      if (!userId) throw new Error("Utilisateur créé mais ID introuvable.");
  
      // 3. Assigner un rôle
      const roleResp = await axios.get(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${userData.role}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      await axios.post(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
        [roleResp.data],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      // 4. Envoyer un email de réinitialisation de mot de passe
      await axios.put(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/execute-actions-email`,
        ["UPDATE_PASSWORD"],
        {
          params: {
            lifespan: 86400, // lien valide pendant 24h
            redirect_uri: "http://localhost:3000/reset-password", // personnalise ici si besoin
            client_id: process.env.KEYCLOAK_CLIENT_ID,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log(`✅ Utilisateur ${userData.username} créé avec succès !`);
      return { id: userId };
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur :", error.response?.data || error.message);
      throw error;
    }
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


