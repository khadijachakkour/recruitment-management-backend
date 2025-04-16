//Gestion des utilisateurs par Admin
"use client";
import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request } from "express";
import nodemailer from "nodemailer";
import { generateResetToken } from "../utils/jwtUtils";

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

async function sendResetEmail(email: string, token: string) {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user:"2b8e494031167d",
      pass: "3b40456de46d0b",
    },
  });

  await transporter.sendMail({
    from: '"Admin" <no-reply@example.com>',
    to: email,
    subject: "Réinitialisation du mot de passe",
    html: `<p>Bonjour,</p>
           <p>Veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe :</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>Ce lien est valable pendant 24 heures.</p>`,
  });
}

export async function createUser(userData: {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: string;
}): Promise<{ id: string, resetToken: string }> {
  try {
    const token = await authenticateClient();
    const createResponse = await axios.post(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
    username: userData.username,
    email: userData.email,
    firstName: userData.firstname,
    lastName: userData.lastname,
    enabled: true,
    emailVerified: true,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log("User créé avec location:", createResponse.headers.location);


  const userId = createResponse.headers.location?.split("/").pop();
  if (!userId) throw new Error("Utilisateur créé mais ID introuvable.");

  // Ajout du rôle
  const roleResp = await axios.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${userData.role}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await axios.post(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
    [roleResp.data],
    { headers: { Authorization: `Bearer ${token}` } });

    const resetToken = generateResetToken(userId);
    await sendResetEmail(userData.email, resetToken);
    
  return { id: userId, resetToken };

} catch (err: any) {
  console.error("Erreur dans createUser:", err.response?.data || err.message);
  throw err;
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


