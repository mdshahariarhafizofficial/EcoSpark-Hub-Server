import { Router } from 'express';
import { subscribeNewsletter, getSubscriptions } from '../controllers/newsletter.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/subscribe', subscribeNewsletter);
router.get('/', authenticate, requireAdmin, getSubscriptions);

export default router;
