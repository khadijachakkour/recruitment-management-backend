import { Request, Response } from 'express';
import * as entretienService from '../services/entretienService';
import axios from 'axios';

export const createEntretien = async (req: Request, res: Response) => {
  try {
    // S'assurer que candidatureId est bien fourni
    const { candidatureId } = req.body;
    if (!candidatureId) {
      return res.status(400).json({ error: 'candidatureId requis pour planifier un entretien' });
    }
    // Vérifier qu'aucun entretien n'est déjà planifié pour cette candidature
    const candidatureIdStr = String(candidatureId);
    const existing = await entretienService.getEntretienByCandidature(candidatureIdStr);
    if (existing) {
      return res.status(409).json({ error: 'Un entretien est déjà planifié pour cette candidature' });
    }
    // Créer l'entretien
    const entretien = await entretienService.createEntretien({ ...req.body, candidatureId: candidatureIdStr });
    res.status(201).json(entretien);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const getEntretienById = async (req: Request, res: Response) => {
  try {
    const entretien = await entretienService.getEntretienById(Number(req.params.id));
    if (!entretien) return res.status(404).json({ error: 'Entretien non trouvé' });
    res.json(entretien);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const updateEntretien = async (req: Request, res: Response) => {
  try {
    const entretien = await entretienService.updateEntretien(Number(req.params.id), req.body);
    if (!entretien) return res.status(404).json({ error: 'Entretien non trouvé' });
    res.json(entretien);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const deleteEntretien = async (req: Request, res: Response) => {
  try {
    const deleted = await entretienService.deleteEntretien(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Entretien non trouvé' });
    res.json({ message: 'Entretien supprimé' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const getEntretienByCandidature = async (req: Request, res: Response) => {
  try {
    const entretien = await entretienService.getEntretienByCandidature(req.params.candidatureId);
    if (!entretien) return res.status(404).json({ error: 'Entretien non trouvé' });
    res.json(entretien);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const getEntretiensByRecruteur = async (req: Request, res: Response) => {
  try {
    const entretiens = await entretienService.getEntretiensByRecruteur(req.params.recruteurId);
    const enriched = await Promise.all(
      entretiens.map(async (e: any) => {
        let candidate = null;
        let offer_id = null;
        let offer_title = null;
        try {
          const candidatureRes = await axios.get(`http://localhost:8082/api/candidatures/${e.candidatureId}`);
          const candidature = candidatureRes.data;
          if (candidature) {
            // Récupérer infos candidat via user-service
            const userRes = await axios.get(`http://localhost:4000/api/users/userbyId/${candidature.candidate_id}`);
            candidate = {
              firstName: userRes.data.firstName,
              lastName: userRes.data.lastName,
              email: userRes.data.email,
            };
            offer_id = candidature.offer_id ? String(candidature.offer_id) : null;
            // Récupérer le titre de l'offre via offer-service
            if (offer_id) {
              const offerRes = await axios.get(`http://localhost:8081/api/offers/${offer_id}`);
              offer_title = offerRes.data.title;
            }
          }
        } catch {}
        return { ...e.toJSON(), candidate, offer_id, offer_title };
      })
    );
    res.json(enriched);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};
