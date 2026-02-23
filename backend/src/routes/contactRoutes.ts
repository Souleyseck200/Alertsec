import { Router } from 'express';
import contactController from '../controllers/contactController';
import { auth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', auth, contactController.add);
router.get('/', auth, contactController.getAll);
router.delete('/:id', auth, contactController.delete);

export default router;
