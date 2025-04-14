import { NextFunction, Request, Response } from "express";
import axios from "axios";
import {authenticateClient, createUser, createUserInKeycloak } from "../services/keycloakService";
import dotenv from "dotenv";
import UserProfile from "../models/CandidatProfile";


dotenv.config();


export const registerCandidat = async (req: Request, res: Response): Promise<void> => {  // Retour de type void, car la réponse est envoyée via res
  try {
    const { firstname, lastname, username, email, password } = req.body;
    const role = "Candidat"; 

    // Création de l'utilisateur dans Keycloak
    const keycloakUser = await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    if (!keycloakUser || !keycloakUser.id) {
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur dans Keycloak" });
      return;  // Retour explicite après envoi de la réponse
    }

    const keycloakUserId = keycloakUser.id; // Récupération de l'ID Keycloak

    // Créer un profil vide dans PostgreSQL avec l'ID Keycloak comme user_id
    await UserProfile.create({ user_id: keycloakUserId });

    res.status(201).json({ message: "Candidat inscrit avec succès", user_id: keycloakUserId });
  } catch (error) {
    console.error("Erreur d'inscription du candidat :", error);
    res.status(500).json({ message: "Erreur d'inscription du candidat", error });
  }
};




// Inscription d'un admin entreprise (assignation automatique du rôle "Admin")
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {  // Retour de type void, car la réponse est envoyée via res
  try {
    const { firstname, lastname, username, email, password } = req.body;
    const role = "Admin"; // Assignation automatique du rôle

    // Création de l'utilisateur dans Keycloak
    const keycloakUser = await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    if (!keycloakUser || !keycloakUser.id) {
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur dans Keycloak" });
      return;  // Retour explicite après envoi de la réponse
    }

    const keycloakUserId = keycloakUser.id; // Récupération de l'ID Keycloak

    // Créer un profil vide dans PostgreSQL avec l'ID Keycloak comme user_id
    await UserProfile.create({ user_id: keycloakUserId });

    res.status(201).json({ message: "Candidat inscrit avec succès", user_id: keycloakUserId });
  } catch (error) {
    console.error("Erreur d'inscription du candidat :", error);
    res.status(500).json({ message: "Erreur d'inscription du candidat", error });
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
      sameSite: "lax",
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
      sameSite: "lax",
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

//Gestion des utilisateurs par Admin

// Endpoint pour récupérer les utilisateurs sauf ceux avec les rôles 'candidate' et 'admin'
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = await authenticateClient(); // Authentification

    // Étape 1: Récupérer tous les utilisateurs
    const usersResponse = await axios.get(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const users = usersResponse.data;

    // Étape 2: Pour chaque utilisateur, récupérer ses rôles et filtrer
    const filteredUsers: any[] = [];

    for (const user of users) {
      const rolesResponse = await axios.get(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/realm`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const userRoles = rolesResponse.data.map((role: { name: string }) => role.name.toLowerCase());
      // Filtrer le rôle par défaut
      const filteredRoles = userRoles.filter((role: string) => role !== 'default-roles-apprecrutement');
      // Assignation des rôles filtrés
      user.role = filteredRoles;
      // Exclure les utilisateurs avec le rôle 'admin' ou 'candidate'
      if (!userRoles.includes('admin') && !userRoles.includes('candidat')) {
        filteredUsers.push(user);
      }
    }

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Erreur lors de la récupération filtrée des utilisateurs :", error);
    res.status(500).json({ message: "Erreur lors de la récupération filtrée des utilisateurs" });
  }
};


// Endpoint pour supprimer un utilisateur
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const token = await authenticateClient();

    await axios.delete(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
  }
};


export const createRecruteurManagerRH = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstname, lastname, username, email, password, role } = req.body;

    // Appeler la fonction pour créer un utilisateur dans Keycloak
    const user = await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    // Retourner l'ID de l'utilisateur créé
    res.status(201).json({ userId: user.id });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur"});
  }
}

