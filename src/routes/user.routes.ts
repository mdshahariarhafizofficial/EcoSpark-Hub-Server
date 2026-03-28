import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getUserPurchases,
  getDashboardStats
} from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// /api/users

// Protected (Any authenticated user)
router.use(authenticate);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id', getUserProfile);
router.patch('/:id', upload.single('avatar'), updateProfile);
router.post('/:id/password', changePassword);
router.get('/:id/purchases', getUserPurchases);

// Admin only
router.use(requireAdmin);
router.get('/', getAllUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', updateUserStatus);

export default router;
