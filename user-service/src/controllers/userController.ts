import { Request, Response } from "express";
import { createUserInKeycloak } from "../services/keycloakService";

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
