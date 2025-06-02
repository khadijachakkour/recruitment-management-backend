import { Entretien, EntretienType, EntretienStatut } from '../models/Entretien';

export const createEntretien = async (data: {
  date: Date;
  type: EntretienType;
  lieu: string;
  recruteurId: string;
  candidatureId: string;
  statut: EntretienStatut;
}) => {
  return await Entretien.create(data);
};

export const getEntretienById = async (id: number) => {
  return await Entretien.findByPk(id);
};

export const updateEntretien = async (
  id: number,
  updates: Partial<{
    date: Date;
    lieu: string;
    statut: EntretienStatut;
  }>
) => {
  const entretien = await Entretien.findByPk(id);
  if (!entretien) return null;
  return await entretien.update(updates);
};

export const deleteEntretien = async (id: number) => {
  return await Entretien.destroy({ where: { id } });
};

export const getEntretienByCandidature = async (candidatureId: string) => {
  return await Entretien.findOne({ where: { candidatureId } });
};

export const getEntretiensByRecruteur = async (recruteurId: string) => {
  return await Entretien.findAll({ where: { recruteurId } });
};
