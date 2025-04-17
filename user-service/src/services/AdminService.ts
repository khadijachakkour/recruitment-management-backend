//Gestion des utilisateurs par Admin
"use client";
import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request } from "express";
import nodemailer from "nodemailer";
import { generateResetToken } from "../utils/jwtUtils";
import { authenticateClient } from "./keycloakService";

dotenv.config();

async function sendResetEmail(email: string, token: string) {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "2b8e494031167d",
      pass: "3b40456de46d0b",
    },
  });

  // Envoi de l'email en arrière-plan (asynchrone)
  setTimeout(async () => {
    await transporter.sendMail({
      from: '"Admin" <no-reply@example.com>',
      to: email,
      subject: "Account Activation – Set Your Password",
      html: `
        <p>Welcome to the platform. Your user account has been successfully created.</p>
        <p>To activate your account and set your password, please click on the link below:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will remain valid for 24 hours.</p>
        <p>If you have any questions or did not expect this email, please contact the system administrator.</p>
        <p>Best regards,<br/>Admin Team</p>
      `,
    });
  }, 0);

}
  
export async function getCompanyByAdminId(IdAdmin: string): Promise<{ id: string, name?: string }> {
  try {
    const response = await axios.get(`http://localhost:5000/api/companies/by-admin/${IdAdmin}`);
    return response.data; // Assure-toi que l'API retourne un objet avec au moins `id`
  } catch (error: any) {
    console.error("Erreur dans getCompanyByAdminId:", error.response?.data || error.message);
    throw new Error("Impossible de récupérer la company liée à l'admin.");
  }
}
// Creation des utilisateurs par l'admin
export async function createUser(userData: {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: string;
}, IdAdmin: string,): Promise<{ id: string, resetToken: string }> {
  try {
    // Authentification de l'utilisateur une seule fois
    const token = await authenticateClient();
   // 🏢 Récupération de l'id de la company via ta fonction perso
  const adminCompany = await getCompanyByAdminId(IdAdmin);
  const companyId = adminCompany.id;
    // Effectuer les deux requêtes de manière parallèle pour gagner du temps
    const userCreationPromise = axios.post(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstname,
      lastName: userData.lastname,
      enabled: true,
      emailVerified: true,
      attributes: {
        IdAdmin: [IdAdmin],
        IdCompany: [companyId] 
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const rolePromise = axios.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${userData.role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Attendre que les deux requêtes soient terminées
    const [createResponse, roleResp] = await Promise.all([userCreationPromise, rolePromise]);

    const userId = createResponse.headers.location?.split("/").pop();
    if (!userId) throw new Error("Utilisateur créé mais ID introuvable.");

    // Ajouter le rôle à l'utilisateur
    await axios.post(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      [roleResp.data],
      { headers: { Authorization: `Bearer ${token}` } });

    // Générer un token de réinitialisation et envoyer l'email de réinitialisation
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


