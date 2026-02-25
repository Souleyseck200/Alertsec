import { Router } from 'express';
import adminController from '../controllers/adminController';
import { auth, isAdmin, isAgent } from '../middlewares/authMiddleware';

const router = Router();

// Données Tactiques (Ouvertes aux Agents & Admins)
router.get('/agents', auth, isAgent, adminController.getAgents);
router.get('/zones', auth, isAgent, adminController.getZones);

// Gestion des Agents (Admin seulement)
router.post('/agents/create', auth, isAdmin, adminController.createAgent);
router.patch('/users/:id/block', auth, isAdmin, adminController.blockUser);
router.patch('/users/:id/validate-clearance', auth, isAdmin, adminController.validateClearance);
router.patch('/agents/:id/reset-password', auth, isAdmin, adminController.resetAgentPassword);
router.patch('/agents/:id', auth, isAdmin, adminController.updateAgent);
router.delete('/agents/:id', auth, isAdmin, adminController.deleteAgent);

// Gestion des Zones (Admin seulement)
router.post('/zones', auth, isAdmin, adminController.createZone);
router.patch('/zones/:id', auth, isAdmin, adminController.updateZone);
router.delete('/zones-delete/:id', auth, isAdmin, adminController.deleteZone);

// Opérations Tactiques (Force Assign)
router.patch('/interventions/force-assign', auth, isAdmin, adminController.forceAssign);

// Intelligence & Analytics
router.get('/analytics/prediction', auth, isAdmin, adminController.getPredictions);
router.get('/stats/dashboard', auth, isAdmin, adminController.getDashboard);

// Audit & Logs
router.get('/logs', auth, isAdmin, adminController.getLogs);

export default router;
