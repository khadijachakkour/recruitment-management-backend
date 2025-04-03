// controllers/companyController.ts
import { Request, Response } from "express";
import * as companyService from "../services/companyService";

export const createCompanyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const userId = req.user.id;
    const company = await companyService.createCompanyProfile(userId, req.body);

    res.status(201).json({ message: "Entreprise créée avec succès.", company });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    res.status(500).json({ message: errorMessage });
  }
};


export const getCompanyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const userId = req.user.id;
    const company = await companyService.getCompanyProfile(userId);

    if (!company) {
      res.status(404).json({ message: "Aucune entreprise trouvée." });
      return;
    }

    res.status(200).json(company);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    res.status(500).json({ message: errorMessage });
  }
};

export const updateCompanyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const userId = req.user.id;
    const updatedCompany = await companyService.updateCompanyProfile(userId, req.body);

    res.status(200).json({ message: "Profil mis à jour avec succès.", updatedCompany });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    res.status(500).json({ message: errorMessage });
  }
};
