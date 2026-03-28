import { Router } from 'express';
import {
  getComments,
  addComment,
  deleteComment,
  getAllComments
} from '../controllers/comment.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Note: In index.ts, we mount this at /api/comments for global actions
// AND ideas/:id/comments in idea.routes (handled manually or via direct access)
// For simplicity, we'll prefix idea ID in the route definition here as well if needed.

// Mount points:
// /api/ideas/:id/comments (list, create)
// /api/comments/:id (update, delete)
// /api/comments (admin list all)

router.get('/idea/:id', getComments);
router.post('/idea/:id', authenticate, addComment);
router.delete('/:id', authenticate, deleteComment);
router.get('/', authenticate, requireAdmin, getAllComments);

export default router;
