import { Router } from 'express';
import {
  createMessage,
  getMessages,
  updateMessageStatus,
  deleteMessage
} from '../controllers/contact.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// /api/contact

router.post('/', createMessage);
router.get('/', authenticate, requireAdmin, getMessages);
router.patch('/:id/status', authenticate, requireAdmin, updateMessageStatus);
router.delete('/:id', authenticate, requireAdmin, deleteMessage);

export default router;
