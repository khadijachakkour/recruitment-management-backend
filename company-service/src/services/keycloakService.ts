import jwt from "jsonwebtoken";
import { Request } from "express";
import axios from "axios";
import dotenv from "dotenv";



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