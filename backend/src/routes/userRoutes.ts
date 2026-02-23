import { Router } from 'express';
import userController from '../controllers/userController';
import { auth } from '../middlewares/authMiddleware';
import { upload } from '../utils/upload';

const router = Router();

// Route de profil (Auteurisé pour tous les utilisateurs connectés)
router.get('/profile', auth, userController.getProfile);
router.patch('/profile', auth, upload.single('photo'), userController.updateProfile);
router.get('/all', auth, userController.getAllUsers);

export default router;
