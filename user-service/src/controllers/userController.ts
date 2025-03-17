import { Request, Response } from "express";
import axios from "axios";
import { createUserInKeycloak } from "../services/keycloakService";
import dotenv from "dotenv";

dotenv.config();

// Inscription d'un candidat (assignation automatique du rôle "Candidat")
export const registerCandidat = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    const role = "Candidat"; // Assignation automatique du rôle

    await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    res.status(201).json({ message: "Candidat inscrit avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur d'inscription du candidat", error });
  }
};

// Inscription d'un admin entreprise (assignation automatique du rôle "Admin")
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    const role = "Admin"; // Assignation automatique du rôle

    await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    res.status(201).json({ message: "Admin inscrit avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur d'inscription de l'admin", error });
  }
};

/// Fonction de login avec email et mot de passe
export const loginWithEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
       res.status(400).json({ message: "Email et mot de passe sont requis." });
    }

    // Demande un token d'accès à Keycloak
    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "password", 
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
        username: email, 
        password: password,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // Si la connexion réussie, retourner les tokens d'accès
    res.status(200).json({
      message: "Connexion réussie",
      access_token: response.data.access_token,  // Token d'accès
      refresh_token: response.data.refresh_token, // Token de rafraîchissement
    });
  } catch (error: any) {
    // Gestion des erreurs
    console.error("Erreur lors de la connexion avec Keycloak:", error.response?.data || error.message);

    // Vérification de l'erreur, message plus précis en fonction du code d'erreur
    if (error.response?.status === 400) {
       res.status(400).json({
        message: "Identifiants invalides, veuillez vérifier votre email et mot de passe.",
      });
    }

     res.status(error.response?.status || 500).json({
      message: "Échec de la connexion",
      error: error.response?.data || error.message,
    });
  }
};
