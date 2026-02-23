import { Router } from 'express';
import statsController from '../controllers/statsController';
import { auth, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', auth, isAdmin, statsController.getStats);

export default router;
