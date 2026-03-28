import { Router } from 'express';
import {
  toggleBookmark,
  getMyBookmarks,
  getBookmarkStatus
} from '../controllers/bookmark.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/my-bookmarks', authenticate, getMyBookmarks);
router.post('/idea/:id', authenticate, toggleBookmark);
router.get('/idea/:id/status', authenticate, getBookmarkStatus);

export default router;
