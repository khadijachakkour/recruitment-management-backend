import { Request, Response } from "express";
import { createUserInKeycloak } from "../services/keycloakService";

export const register = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;

    
    await createUserInKeycloak({ firstname, lastname, username, email, password });

    res.status(201).json({ message: "Utilisateur inscrit avec succès dans Keycloak" });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur d'inscription", error });
  }
};
