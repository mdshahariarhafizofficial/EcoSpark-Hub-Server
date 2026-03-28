import { Router } from 'express';
import {
  getAllIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  submitForReview,
  approveIdea,
  rejectIdea,
  getPurchaseStatus,
  getDashboardIdeas,
  getAdminStats,
  getMemberStats,
  getBookmarks,
  toggleBookmark
} from '../controllers/idea.controller';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Dashboard (Member specifically)
router.get('/dashboard', authenticate, getDashboardIdeas);
router.get('/member/stats', authenticate, getMemberStats);
router.get('/bookmarks', authenticate, getBookmarks);

// Admin stats
router.get('/stats', authenticate, requireAdmin, getAdminStats);

// Public / Semi-public ideas list & details
router.get('/', optionalAuth, getAllIdeas);
router.get('/:id', optionalAuth, getIdeaById);
router.get('/:id/purchase-status', authenticate, getPurchaseStatus);

// Private member actions
router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'images', maxCount: 5 }, { name: 'attachments', maxCount: 3 }]),
  createIdea
);

router.patch(
  '/:id',
  authenticate,
  upload.fields([{ name: 'images', maxCount: 5 }, { name: 'attachments', maxCount: 3 }]),
  updateIdea
);

router.delete('/:id', authenticate, deleteIdea);
router.post('/:id/submit', authenticate, submitForReview);
router.post('/:id/bookmark', authenticate, toggleBookmark);

// Admin moderation
router.post('/:id/approve', authenticate, requireAdmin, approveIdea);
router.post('/:id/reject', authenticate, requireAdmin, rejectIdea);

export default router;
