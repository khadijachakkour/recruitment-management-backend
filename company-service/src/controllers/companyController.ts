import { Request, Response } from "express";
import * as companyService from "../services/companyService";
import Company from "../models/Company";
import Department from "../models/Department";
import { authenticateClient } from "../services/keycloakService";
import axios from "axios";
import { Op } from "sequelize";
import UserDepartments from "../models/UserDepartments";

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
      res.status(204).end();
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
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const userId = req.user.id;
    const updatedCompany = await companyService.updateCompanyProfile(userId, req.body);

    res.status(200).json({ message: "Profil mis à jour avec succès.", updatedCompany });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    res.status(500).json({ message: errorMessage });
  }
};



export const checkCompanyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // L'ID de l'utilisateur récupéré depuis Keycloak
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return; // 🚀 Ajout d'un return pour éviter l'exécution de la suite
    }

    const hasProfile = await companyService.hasCompanyProfile(userId);
    res.json({ hasCompanyProfile: hasProfile }); // ✅ Envoie la réponse sans return explicite
  } catch (error) {
    console.error("Erreur lors de la vérification du profil d'entreprise:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getCompanyByAdminId = async (req: Request, res: Response): Promise<void> => {
  const { adminId } = req.params;

  try {
    const company = await Company.findOne({
      where: { user_id: adminId },
      include: [{ model: Department, as: "departments" }],
    });

    if (!company) {
      res.status(404).json({ message: "Aucune entreprise trouvée pour cet admin." });
      return;
    }

    res.json({
      id: company.id,
      name: company.companyName,
      logo: company.companyLogo,
      industry: company.industry,
      otherIndustry: company.otherIndustry,
      description: company.companyDescription,
      companyAddress: company.companyAddress,
      country: company.country,
      region: company.region,
      yearFounded: company.yearFounded,
      companySize: company.companySize,
      numberOfEmployees: company.numberOfEmployees,
      contractTypes: company.contractTypes,
      requiredDocuments: company.requiredDocuments,
      contactEmail: company.contactEmail,
      phoneNumber: company.phoneNumber,
      website: company.website,
      socialLinks: company.socialLinks,
      ceo: company.ceo,
      ceoImage: company.ceoImage,
      revenue: company.revenue,

      // 🔽 Liste des départements associés à l'entreprise
      departments: company.departments?.map((dept) => ({
        id: dept.id,
        name: dept.name,
      })) || [],
    });
  } catch (err) {
    console.error("Erreur lors de la recherche de l'entreprise :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};



export const assignDepartmentsToUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params; // ID de l'utilisateur provenant de Keycloak
  const { departments } = req.body; // Liste des noms de départements

  if (!Array.isArray(departments)) {
    res.status(400).json({ message: "Aucun département fourni." });
    return;
  }

  try {
    // Vérifier si l'utilisateur existe dans Keycloak
    const token = await authenticateClient();
    const userResponse = await axios.get(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!userResponse.data) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({ message: "Utilisateur non authentifié." });
      return;
    }

    // Récupérer l'entreprise de l'admin connecté
    const userCompany = await Company.findOne({ where: { user_id: req.user.id } });
    if (!userCompany) {
      res.status(404).json({ message: "Entreprise introuvable pour cet utilisateur." });
      return;
    }

    // Vérifier si les départements existent dans la base de données
    const existingDepartments = await Department.findAll({
      where: {
        name: { [Op.in]: departments },
        company_id: userCompany.id,
      },
    });

    if (existingDepartments.length !== departments.length) {
      const missingDepartments = departments.filter(
        (dept) => !existingDepartments.some((existing) => existing.name === dept)
      );
      res.status(400).json({
        message: "Un ou plusieurs départements sont invalides.",
        missingDepartments,
      });
      return;
    }

    // Récupérer les départements actuellement associés à l'utilisateur
    const currentAssociations = await UserDepartments.findAll({
      where: { user_id: userId }, // Filtrer uniquement par l'utilisateur spécifique
    });
    console.log(currentAssociations);

    // Identifier les départements à supprimer
    const departmentsToRemove = currentAssociations.filter(
      (assoc) => !existingDepartments.some((dept) => dept.id === assoc.department_id)
    );

    // Supprimer les associations non sélectionnées
    await Promise.all(
      departmentsToRemove.map((assoc) =>
        UserDepartments.destroy({ where: { id: assoc.id } })
      )
    );

    // Identifier les nouveaux départements à ajouter
    const departmentsToAdd = existingDepartments.filter(
      (dept) => !currentAssociations.some((assoc) => assoc.department_id === dept.id)
    );

    // Ajouter les nouvelles associations
    await Promise.all(
      departmentsToAdd.map((dept) =>
        UserDepartments.create({ user_id: userId, department_id: dept.id })
      )
    );

    res.status(200).json({ message: "Départements mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'affectation des départements :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


export const deleteUserDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Supprimer les départements associés à l'utilisateur
    await UserDepartments.deleteByUserId(userId);

    res.status(200).json({ message: "Départements de l'utilisateur supprimés avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression des départements de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur lors de la suppression des départements de l'utilisateur" });
  }
}


export const getUserDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Vérifier si l'ID utilisateur est fourni
    if (!userId) {
      res.status(400).json({ message: "L'ID de l'utilisateur est requis." });
      return;
    }

    // Récupérer les départements associés à l'utilisateur
    const userDepartments = await UserDepartments.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Department,
          as: "Department", // Utiliser l'alias défini dans l'association
          attributes: ["id", "name"], // Inclure uniquement les champs nécessaires
        },
      ],
    });

    // Formater la réponse
    const departments = userDepartments.map((ud) => ({
      id: ud.department_id,
      name: ud.Department?.name, // Accéder au nom du département via l'association
    }));

    res.status(200).json(departments);
  } catch (error) {
    console.error("Erreur lors de la récupération des départements de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des départements de l'utilisateur." });
  }
};