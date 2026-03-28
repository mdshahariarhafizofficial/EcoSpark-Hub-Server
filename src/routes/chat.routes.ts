import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { askAssistant } from '../controllers/chat.handler';

const router = Router();

// Strict rate limiting to prevent API abuse
const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 30, // Limit each IP to 30 chat requests per window
  message: { success: false, message: 'Too many requests to the AI Assistant. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Optionally protect this with authenticate if we only want logged-in users
// For now, anyone browsing the site can ask the assistant if they need onboarding help
router.post('/', chatRateLimiter, askAssistant);

export default router;
