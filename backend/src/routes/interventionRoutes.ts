import { Router } from 'express';
import interventionController from '../controllers/interventionController';
import { auth, isAgent } from '../middlewares/authMiddleware';

const router = Router();

// Toutes ces routes sont réservées aux Agents ou Admins
router.use(auth, isAgent);

// Liste des nouvelles alertes dans la zone de l'agent connecté
router.get('/new', interventionController.getNewSignalementsByZone);

// Prise en charge (Affectation + Début intervention)
router.post('/take-charge', interventionController.takeCharge);

// Suivi (Notes de terrain)
router.patch('/:id/notes', interventionController.updateFieldNotes);

// Suivi GPS temps réel (DB persistence + broadcast via controller/service)
router.patch('/location', interventionController.updateLocation);

// Liste des agents actifs sur la carte
router.get('/active-agents', interventionController.getActiveAgents);

// Navigation (Points d'itinéraire + ETA)
router.get('/:id/route', interventionController.getRoute);

// Clôture finale (Rapport + Fin intervention)
router.patch('/:id/close', interventionController.closeIntervention);

export default router;
