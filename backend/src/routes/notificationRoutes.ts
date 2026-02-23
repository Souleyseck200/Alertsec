import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { auth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/me', auth, notificationController.getMyNotifications);
router.patch('/:id/read', auth, notificationController.markAsRead);

export default router;
