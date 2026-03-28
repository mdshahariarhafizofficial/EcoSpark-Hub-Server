import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  parentId: z.string().optional().nullable(),
});

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ideaId = req.params.id as string;
    const comments = await prisma.comment.findMany({
      where: { ideaId, parentId: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            replies: {
              include: { author: { select: { id: true, name: true, avatar: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: comments });
  } catch (err) { next(err); }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, parentId } = commentSchema.parse(req.body);

    const ideaId = req.params.id as string;
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) throw new AppError('Idea not found.', 404);
    if (idea.status !== 'APPROVED') throw new AppError('Cannot comment on non-approved ideas.', 400);

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) throw new AppError('Parent comment not found.', 404);
      if (parent.ideaId !== ideaId) throw new AppError('Parent comment belongs to a different idea.', 400);
    }

    const comment = await prisma.comment.create({
      data: { content, ideaId, authorId: req.user!.id, parentId: parentId || null },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(201).json({ success: true, message: 'Comment added.', data: comment });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const commentId = (req.params.commentId || req.params.id) as string;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comment not found.', 404);

    const isAdmin = req.user!.role === 'ADMIN';
    const isAuthor = comment.authorId === req.user!.id;
    if (!isAdmin && !isAuthor) throw new AppError('Unauthorized to delete this comment.', 403);

    await prisma.comment.delete({ where: { id: comment.id } });
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) { next(err); }
};

export const getAllComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        include: {
          author: { select: { id: true, name: true } },
          idea: { select: { id: true, title: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count(),
    ]);
    res.json({ success: true, data: comments, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};
