import { Router } from 'express';
import * as entretienController from '../controllers/entretienController';
import { createEntretien, getEntretienById, updateEntretien } from '../controllers/entretienController';

const router = Router();

// Planifier un entretien pour une candidature
router.post('/CreateEntretien', createEntretien);

// Récupérer les détails d’un entretien
router.get('/entretiens/:id', getEntretienById);

// Modifier la date, le lieu ou le statut de l’entretien
router.put('/entretiens/:id', updateEntretien);

// Supprimer un entretien
router.delete('/entretiens/:id', entretienController.deleteEntretien);

// Récupérer l’entretien lié à une candidature
router.get('/candidature/:candidatureId', entretienController.getEntretienByCandidature);

// Récupérer tous les entretiens planifiés par un recruteur
router.get('/recruteur/:recruteurId', entretienController.getEntretiensByRecruteur);

router.get('/by-jitsi-url', entretienController.getEntretienIdByJitsiUrl);

export default router;
