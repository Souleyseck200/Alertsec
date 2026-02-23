import { Router } from 'express';
import signalementController from '../controllers/signalementController';
import { auth, checkRole, isCitoyen } from '../middlewares/authMiddleware';
import { upload } from '../utils/upload';

const router = Router();

const signalementMediaUpload = upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Tout utilisateur connecté peut signaler ou voir ses signalements
router.post('/', auth, isCitoyen, signalementMediaUpload, signalementController.createSignalement);
router.get('/me', auth, signalementController.getMySignalements);
router.get('/heatmap', auth, signalementController.getHeatmap);

// Seuls les agents et admins voient tout
router.get('/all', auth, checkRole(['AGENT', 'ADMIN']), signalementController.getAllSignalements);
router.patch('/:id/status', auth, checkRole(['AGENT', 'ADMIN']), signalementController.updateStatus);
router.patch('/:id/annuler', auth, signalementController.cancelSignalement);

export default router;
