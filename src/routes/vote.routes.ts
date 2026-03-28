import { Router } from 'express';
import { vote, removeVote } from '../controllers/vote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// /api/votes/idea/:id
router.post('/idea/:id', authenticate, vote);
router.delete('/idea/:id', authenticate, removeVote);

export default router;
