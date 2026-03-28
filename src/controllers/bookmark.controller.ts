import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const toggleBookmark = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea) throw new AppError('Idea not found.', 404);

    const existing = await prisma.bookmark.findUnique({
      where: { userId_ideaId: { userId: req.user!.id, ideaId: id } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res.json({ success: true, message: 'Bookmark removed.', data: { bookmarked: false } });
    }

    await prisma.bookmark.create({ data: { userId: req.user!.id, ideaId: id } });
    res.json({ success: true, message: 'Idea bookmarked!', data: { bookmarked: true } });
  } catch (err) { next(err); }
};

export const getMyBookmarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      include: {
        idea: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            category: { select: { id: true, name: true, color: true } },
            _count: { select: { comments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: bookmarks.map((b: { idea: any }) => b.idea) });
  } catch (err) { next(err); }
};

export const getBookmarkStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_ideaId: { userId: req.user!.id, ideaId: id } },
    });
    res.json({ success: true, data: { bookmarked: !!bookmark } });
  } catch (err) { next(err); }
};
