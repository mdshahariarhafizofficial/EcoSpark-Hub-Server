import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const updateProfileSchema = z.object({
  name: z.string().min(5, 'Name must be at least 5 characters').optional(),
  bio: z.string().max(500).optional().refine(val => !val || val.trim().split(/\s+/).length >= 10, {
    message: 'Bio must be at least 10 words'
  }),
  avatar: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, bio: true, avatar: true,
        role: true, isActive: true, createdAt: true,
        _count: { select: { ideas: true } },
        ideas: {
          where: { status: 'APPROVED' },
          select: { id: true, title: true, voteCount: true, createdAt: true, isPaid: true },
          orderBy: { voteCount: 'desc' },
          take: 5,
        },
      },
    });
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (id !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized to update this profile.', 403);
    }
    const data = updateProfileSchema.parse(req.body);
    if (req.file) {
      data.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, bio: true, avatar: true, role: true },
    });
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (id !== req.user!.id) throw new AppError('Unauthorized.', 403);
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found.', 404);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect.', 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, isActive: true,
          createdAt: true, _count: { select: { ideas: true, purchases: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: users, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    if (!['MEMBER', 'ADMIN'].includes(role)) throw new AppError('Invalid role.', 400);
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ success: true, message: 'Role updated.', data: user });
  } catch (err) { next(err); }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') throw new AppError('isActive must be a boolean.', 400);
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}.`, data: user });
  } catch (err) { next(err); }
};

export const getUserPurchases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (id !== req.user!.id && req.user!.role !== 'ADMIN') throw new AppError('Unauthorized.', 403);
    const purchases = await prisma.purchase.findMany({
      where: { userId: id },
      include: { idea: { select: { id: true, title: true, price: true, category: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
};

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [ideasCount, purchasesCount, bookmarksCount, totalInvested, recentIdeas, recentPurchases, votesCount] = await Promise.all([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.purchase.count({ where: { userId } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.purchase.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.idea.findMany({
        where: { authorId: userId },
        select: { id: true, title: true, status: true, voteCount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.purchase.findMany({
        where: { userId },
        include: { idea: { select: { id: true, title: true, price: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.vote.count({ where: { idea: { authorId: userId } } }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          ideasCount,
          purchasesCount,
          bookmarksCount,
          totalInvested: totalInvested._sum.amount || 0,
          votesReceived: votesCount,
        },
        recentIdeas,
        recentPurchases,
      },
    });
  } catch (err) { next(err); }
};
