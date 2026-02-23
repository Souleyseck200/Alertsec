import { Router } from 'express';
import adminController from '../controllers/adminController';
import { auth, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Toutes les routes admin sont protégées
router.use(auth, isAdmin);

// Gestion des Agents
router.post('/agents/create', adminController.createAgent);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/validate-clearance', adminController.validateClearance);

// Gestion des Zones
router.get('/zones', adminController.getZones);
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);

// Opérations Tactiques (Force Assign)
router.patch('/interventions/force-assign', adminController.forceAssign);

// Intelligence & Analytics
router.get('/analytics/prediction', adminController.getPredictions);
router.get('/stats/dashboard', adminController.getDashboard);

// Audit & Logs
router.get('/logs', adminController.getLogs);

export default router;
