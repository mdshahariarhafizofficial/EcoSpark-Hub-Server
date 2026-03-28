import { Router } from 'express';
import {
  initiatePayment,
  handleWebhook,
  handlePaymentSuccess,
  getAllPurchases,
  getMyPurchases
} from '../controllers/payment.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// /api/payments

// Webhook — receives raw body from Stripe (pre-parsed before express.json in index.ts)
router.post('/webhook', handleWebhook);

router.post('/idea/:id', authenticate, initiatePayment);
router.get('/success', authenticate, handlePaymentSuccess);
router.get('/my', authenticate, getMyPurchases);
router.get('/', authenticate, requireAdmin, getAllPurchases);

export default router;
