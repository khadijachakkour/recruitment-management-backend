import Offer from "../models/Offer";
import jwt from "jsonwebtoken";
import { Request } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export function getUserIdFromToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];
  try {
    const decoded = jwt.decode(token) as { sub: string };
    return decoded?.sub || null;
  } catch (error) {
    console.error("Erreur de décodage du token:", error);
    return null;
  }
}

export const createOffer = async (req: Request, offerData: any) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    console.error("Erreur : Utilisateur non authentifié"); // Log si l'utilisateur n'est pas authentifié
    throw new Error("Utilisateur non authentifié");
  }

  try {

    // Récupérer le token d'accès pour appeler Keycloak
    const tokenResponse = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Appeler Keycloak pour récupérer les informations de l'utilisateur
    const userResponse = await axios.get(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const user = userResponse.data;

    const idCompany = user.attributes?.IdCompany?.[0];
    if (!idCompany) {
      console.error("Erreur : idCompany introuvable pour l'utilisateur connecté"); // Log si idCompany est introuvable
      throw new Error("idCompany introuvable pour l'utilisateur connecté");
    }

    // Ajouter userId et idCompany aux données de l'offre
    const offerWithUserData = {
      ...offerData,
      userId,
      companyId: idCompany,
    };


    // Créer l'offre
    const createdOffer = await Offer.create(offerWithUserData);

    return createdOffer;
  } catch (error: any) {
    console.error("Erreur lors de la création de l'offre :", error.response?.data || error.message); // Log de l'erreur
    throw error;
  }
};

export const getOffersByRecruiter = async (userId: string) => {
  return await Offer.findAll({ where: { userId } });
};

export const getOfferById = async (id: number) => {
  return await Offer.findByPk(id);
};

export const updateOffer = async (id: number, offerData: any) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw new Error("Offer not found");
  return await offer.update(offerData);
};

export const deleteOffer = async (id: number) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw new Error("Offer not found");
  return await offer.destroy();
};

export const getAllOffers = async () => {
  return await Offer.findAll();
};

export const countOffersByRecruiter = async (userId: string) => {
  return await Offer.count({ where: { userId } });
};