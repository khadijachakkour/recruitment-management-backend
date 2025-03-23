import { NextFunction, Request, Response } from "express";
import axios from "axios";
import {createUserInKeycloak } from "../services/keycloakService";
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


export const loginWithEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email et mot de passe sont requis." });
      return;
    }

    const params = new URLSearchParams({
      grant_type: "password",
      client_id: process.env.KEYCLOAK_CLIENT_ID as string,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
      username: email,
      password: password,
    });

    // Effectuer la requête à Keycloak
    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = response.data;

    // Définir un cookie sécurisé pour le refresh token
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false,
      path: "/",

      sameSite: "none",
    });

    res.status(200).json({ access_token });
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ message: error.response.data.error_description || "Erreur d'authentification." });
    } else {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
};

// Rafraîchir le token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.KEYCLOAK_CLIENT_ID as string,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
      refresh_token: refreshToken,
    });

    const response = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.cookie("refresh_token", response.data.refresh_token, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "none",
    });

    res.status(200).json({ access_token: response.data.access_token });
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 400 && error.response.data.error === "invalid_grant") {
        res.clearCookie("refresh_token", { path: "/api/users/refresh-token" }); 
        res.status(401).json({ message: "Session expirée, veuillez vous reconnecter." });
      } else {
        res.status(error.response.status).json({ message: error.response.data.error_description || "Erreur d'authentification." });
      }
    } else {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
};
