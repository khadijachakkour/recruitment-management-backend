import { NextFunction, Request, Response } from "express";
import axios from "axios";
import {authenticateClient, getUserIdFromToken } from "../services/keycloakService";
import dotenv from "dotenv";
import UserProfile from "../models/CandidatProfile";
import { createUser } from "../services/AdminService";
import { createUserInKeycloak } from "../services/keycloakService";
import { getUserIdFromResetToken } from "../utils/jwtUtils";


dotenv.config();

export const registerCandidat = async (req: Request, res: Response): Promise<void> => {  
  try {
    const { firstname, lastname, username, email, password } = req.body;
    const role = "Candidat"; 

    const keycloakUser = await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    if (!keycloakUser || !keycloakUser.id) {
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur dans Keycloak" });
      return;  
    }

    const keycloakUserId = keycloakUser.id; 
    // Créer un profil vide dans PostgreSQL avec l'ID Keycloak comme user_id
    await UserProfile.create({ user_id: keycloakUserId });

    res.status(201).json({ message: "Candidat inscrit avec succès", user_id: keycloakUserId });
  } catch (error) {
    console.error("Erreur d'inscription du candidat :", error);
    res.status(500).json({ message: "Erreur d'inscription du candidat", error });
  }
};

// Inscription d'un admin entreprise (assignation automatique du rôle "Admin")
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {  
  try {
    const { firstname, lastname, username, email, password } = req.body;
    const role = "Admin"; 

    const keycloakUser = await createUserInKeycloak({ firstname, lastname, username, email, password, role });

    if (!keycloakUser || !keycloakUser.id) {
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur dans Keycloak" });
      return;  }
    
      const keycloakUserId = keycloakUser.id; 

      await UserProfile.create({ user_id: keycloakUserId });

    res.status(201).json({ message: "Admin inscrit avec succès", user_id: keycloakUserId });
  } catch (error) {
    console.error("Erreur d'inscription du admin :", error);
    res.status(500).json({ message: "Erreur d'inscription du admin", error });
  }
};

export const loginWithEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log("[USER-SERVICE][CONTROLLER] loginWithEmail appelée avec body :", req.body);
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
        res.clearCookie("refresh_token", { path: "/" }); 
        res.status(401).json({ message: "Session expirée, veuillez vous reconnecter." });
      } else {
        res.status(error.response.status).json({ message: error.response.data.error_description || "Erreur d'authentification." });
      }
    } else {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
};

//Endpoint pour récupérer les utilisateurs sauf ceux avec les rôles 'candidate' et 'admin'
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = await authenticateClient(); 
    const adminId = getUserIdFromToken(req);
    if (!adminId) {
      res.status(401).json({ message: "Token invalide ou manquant" });
      return;
    }
    const usersResponse = await axios.get(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const users = usersResponse.data;

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
      const filteredRoles = userRoles.filter((role: string) => role !== 'default-roles-apprecrutement');
      user.role = filteredRoles;
      if (!userRoles.includes('admin') && !userRoles.includes('candidat')) {
        const departmentsResponse = await axios.get(
          `http://localhost:5000/api/companies/user-departments/${user.id}`
        );

        user.departments = departmentsResponse.data;
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

    res.status(201).json({ userId: user.id });
  } catch (error: any) {
    console.error("Erreur dans createRecruteurManagerRH:", error?.response?.data || error.message || error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur"});
  }
  
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  try {    
    const userId = await getUserIdFromResetToken(token); 
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

    await axios.delete(
  `http://localhost:5000/api/companies/user-departments/${userId}`
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

  const response = await axios.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      max: 1000,
    }
  });

  const users = response.data;

  for (const role of roles) {
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
            count++;
          }
        } catch (err) {
          console.warn(`Erreur lors de la récupération des rôles pour ${user.username}:`);
        }
      }
    }

    result[role] = count;
  }

  return result;
}

export async function getUsersCountByRoleHandler(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const result = await getUsersCountByRole(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getCurrentUserId = async (req: Request, res: Response): Promise<void> => {
  
  const userId = getUserIdFromToken(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ userId });
};


//Recuperer le profile de l'utilisateur
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      res.status(401).json({ message: "Token invalide ou manquant" });
      return;
    }

    const token = await authenticateClient();

    const userResponse = await axios.get(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const profile = {
      ...userResponse.data,
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil admin :", error);
    res.status(500).json({ message: "Erreur lors de la récupération du profil admin" });
  }
};

//Route pour la répartition des utilisateurs par rôle
export const getRecruitmentDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = getUserIdFromToken(req);
    if (!adminId) {
      res.status(401).json({ message: "Token invalide ou manquant" });
      return;
    }
    const token = await authenticateClient();
    // Récupérer tous les utilisateurs
    const response = await axios.get(`${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { max: 1000 },
    });
    const users = response.data;
    let recruiters = 0, managers = 0, hr = 0;
    for (const user of users) {
      const userAttrs = user.attributes || {};
      const IdAdmin = Array.isArray(userAttrs.IdAdmin) ? userAttrs.IdAdmin[0] : userAttrs.IdAdmin;
      if (IdAdmin !== adminId) continue;
      try {
        const rolesResponse = await axios.get(
          `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/realm`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userRoles = rolesResponse.data.map((r: any) => r.name.toLowerCase());
        if (userRoles.includes('recruteur')) recruiters++;
        if (userRoles.includes('manager')) managers++;
        if (userRoles.includes('rh')) hr++;
      } catch (err) {
      }
    }
    res.json([
      { name: 'Recruiters', value: recruiters },
      { name: 'Managers', value: managers },
      { name: 'HR Staff', value: hr }
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const token = await authenticateClient();
    const userResponse = await axios.get(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.status(200).json(userResponse.data);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur par ID:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur", error });
  }
};

export const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Token invalide ou manquant" });
      return;
    }
    const { firstname, lastname, email, username, password } = req.body;
    const token = await authenticateClient();
    const updateData: any = {};
    if (firstname) updateData.firstName = firstname;
    if (lastname) updateData.lastName = lastname;
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (Object.keys(updateData).length > 0) {
      await axios.put(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }
    if (password) {
      await axios.put(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/reset-password`,
        {
          type: "password",
          value: password,
          temporary: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    res.status(200).json({ message: "Profil utilisateur mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil utilisateur:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil utilisateur" });
  }
};


// Implémentation de la route /logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      res.status(400).json({ message: "Aucun refresh token trouvé" });
      return;
    }

    await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
      new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
        refresh_token: refreshToken,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.clearCookie("refresh_token", { httpOnly: true, path: "/" });
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de la déconnexion" });
  }
};
