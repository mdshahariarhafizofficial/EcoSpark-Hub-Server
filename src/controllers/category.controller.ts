import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      include: { 
        _count: { 
          select: { 
            ideas: { where: { status: 'APPROVED' } } 
          } 
        } 
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const id = req.params.id as string;
    const category = await prisma.category.update({ where: { id }, data });
    res.json({ success: true, message: 'Category updated.', data: category });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const count = await prisma.idea.count({ where: { categoryId: id } });
    if (count > 0) throw new AppError(`Cannot delete: ${count} idea(s) use this category.`, 400);
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { next(err); }
};
