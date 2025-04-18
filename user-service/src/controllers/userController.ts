import { NextFunction, Request, Response } from "express";
import axios from "axios";
import {authenticateClient, getUserIdFromToken } from "../services/keycloakService";
import dotenv from "dotenv";
import UserProfile from "../models/CandidatProfile";
import { createUser } from "../services/AdminService";
import { createUserInKeycloak } from "../services/keycloakService";
import { getUserIdFromResetToken } from "../utils/jwtUtils";



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

//Endpoint pour récupérer les utilisateurs sauf ceux avec les rôles 'candidate' et 'admin'
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = await authenticateClient(); // Authentification
    const adminId = getUserIdFromToken(req);
    if (!adminId) {
      res.status(401).json({ message: "Token invalide ou manquant" });
      return;
    }
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
      const userAttrs = user.attributes || {};
  const IdAdmin = Array.isArray(userAttrs.IdAdmin) ? userAttrs.IdAdmin[0] : userAttrs.IdAdmin;

  if (IdAdmin === adminId) {
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
  }
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Erreur lors de la récupération filtrée des utilisateurs :", error);
    res.status(500).json({ message: "Erreur lors de la récupération filtrée des utilisateurs" });
  }
};




export const createRecruteurManagerRH = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstname, lastname, username, email, role } = req.body;
    const adminId = getUserIdFromToken(req); 

    if (!adminId) {
      res.status(401).json({ message: "Token invalide ou manquant" });
      return;
    }

    const user = await createUser({ firstname, lastname, username, email, role }, adminId);

    // Retourner l'ID de l'utilisateur créé
    res.status(201).json({ userId: user.id });
  } catch (error: any) {
    console.error("Erreur dans createRecruteurManagerRH:", error?.response?.data || error.message || error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur"});
  }
  
}

// Dans ton controller Node.js
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  try {
    // 🔒 Vérifier le token dans ta DB ou cache
    
    const userId = await getUserIdFromResetToken(token); // à implémenter selon ton stockage
    if (!userId) {
       res.status(400).json({ message: "Token invalide ou expiré" });
       return;
    }
    
    const kcToken = await authenticateClient();
    await axios.put(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/reset-password`,
      {
        type: "password",
        value: password,
        temporary: false,
      },
      {
        headers: {
          Authorization: `Bearer ${kcToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur de réinitialisation", err);
    res.status(500).json({ message: "Erreur de réinitialisation" });
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



export async function getUsersCountByRole(userId: string): Promise<Record<string, number>> {
  const token = await authenticateClient();
  const roles = ['Recruteur', 'Manager', 'RH'];
  const result: Record<string, number> = {};

  // Récupérer tous les utilisateurs
  const response = await axios.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      max: 1000,
    }
  });

  const users = response.data;
  console.log(`📦 ${users.length} utilisateurs récupérés depuis Keycloak`);

  for (const role of roles) {
    console.log(`🔍 Recherche des utilisateurs avec rôle: ${role}`);
    let count = 0;

    for (const user of users) {
      const userAttrs = user.attributes || {};
      const idAdmin = Array.isArray(userAttrs.IdAdmin) ? userAttrs.IdAdmin[0] : userAttrs.IdAdmin;

      if (idAdmin === userId) {
        try {
          const rolesResponse = await axios.get(
            `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/realm`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const userRoles = rolesResponse.data.map((r: any) => r.name.toLowerCase());
          if (userRoles.includes(role.toLowerCase())) {
            console.log(`✅ Match: ${user.username} (role: ${role}, admin: ${idAdmin})`);
            count++;
          }
        } catch (err) {
          console.warn(`⚠️ Erreur lors de la récupération des rôles pour ${user.username}:`);
        }
      }
    }

    result[role] = count;
    console.log(`📊 ${count} utilisateurs trouvés pour le rôle "${role}" (adminId: ${userId})`);
  }

  console.log(`📤 Résultat des stats retourné :`, result);
  return result;
}


// Handler Express
// Handler Express
export async function getUsersCountByRoleHandler(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    console.log("📥 [API] Requête pour statistiques avec userId:", userId);

    const result = await getUsersCountByRole(userId);

    console.log("✅ [API] Statistiques renvoyées:", result);
    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching user count by role:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}



export const getCurrentUserId = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserIdFromToken(req);

  console.log("🔑 userId extrait du token:", userId);

  if (!userId) {
    console.warn("🚫 Aucun userId trouvé dans le token.");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ userId });
};
