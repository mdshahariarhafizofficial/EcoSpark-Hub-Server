import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmail } from '../utils/email';

const ideaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  problemStatement: z.string().min(20, 'Problem statement must be at least 20 characters'),
  solution: z.string().min(20, 'Solution must be at least 20 characters'),
  description: z.string().min(10, 'Description must be at least 10 words'),
  categoryId: z.string().min(1, 'Category is required'),
  isPaid: z.boolean().optional(),
  price: z.number().positive('Price must be a positive number').optional().nullable(),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

// Helper to determine if current user can see full content of a paid idea
async function canViewFullContent(userId: string | undefined, idea: any): Promise<boolean> {
  if (!idea.isPaid) return true;
  if (!userId) return false;
  if (idea.authorId === userId) return true;
  const purchase = await prisma.purchase.findUnique({ where: { userId_ideaId: { userId, ideaId: idea.id } } });
  return !!purchase;
}

export const getAllIdeas = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const isPaid = req.query.isPaid as string;
    const sortBy = req.query.sortBy as string || 'recent';
    const authorId = req.query.authorId as string;
    const minVotes = req.query.minVotes ? parseInt(req.query.minVotes as string) : undefined;
    const status = req.query.status as string; // admin filter

    const filters: any[] = [];

    // Access control
    if (req.user?.role === 'ADMIN' && status) {
      filters.push({ status });
    } else if (req.user?.role === 'ADMIN') {
      // Admin sees all
    } else if (req.user) {
      // Authenticated member: see approved + own ideas
      filters.push({
        OR: [
          { status: 'APPROVED' },
          { authorId: req.user.id },
        ]
      });
    } else {
      filters.push({ status: 'APPROVED' });
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { problemStatement: { contains: search, mode: 'insensitive' } },
          { solution: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (categoryId) filters.push({ categoryId });
    if (isPaid === 'true') filters.push({ isPaid: true });
    if (isPaid === 'false') filters.push({ isPaid: false });
    if (authorId) filters.push({ authorId });
    if (minVotes !== undefined) filters.push({ voteCount: { gte: minVotes } });

    const where = filters.length > 0 ? { AND: filters } : {};

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'votes') orderBy = { voteCount: 'desc' };
    if (sortBy === 'comments') orderBy = { comments: { _count: 'desc' } };

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, color: true } },
          _count: { select: { comments: true, votes: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.idea.count({ where }),
    ]);

    // Sanitize paid idea content for list view
    const sanitized = ideas.map((idea: any) => {
      const isAuthor = req.user?.id === idea.authorId;
      const isAdmin = req.user?.role === 'ADMIN';
      if (idea.isPaid && !isAuthor && !isAdmin) {
        return { ...idea, description: idea.description.slice(0, 200) + '...', solution: '' };
      }
      return idea;
    });

    res.json({ success: true, data: sanitized, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getIdeaById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, color: true } },
        votes: req.user ? { where: { userId: req.user.id } } : false,
        bookmarks: req.user ? { where: { userId: req.user.id } } : false,
        _count: { select: { comments: true, purchases: true } },
      },
    });

    if (!idea) throw new AppError('Idea not found.', 404);

    const isAdmin = req.user?.role === 'ADMIN';
    const isAuthor = req.user?.id === idea.authorId;

    // Non-approved ideas only visible to author/admin
    if (idea.status !== 'APPROVED' && !isAdmin && !isAuthor) {
      throw new AppError('Idea not found.', 404);
    }

    // Increment view count
    await prisma.idea.update({ where: { id: idea.id }, data: { viewCount: { increment: 1 } } });

    // Check paid access
    const hasAccess = await canViewFullContent(req.user?.id, idea);

    if (!hasAccess) {
      return res.json({
        success: true,
        data: {
          ...idea,
          description: idea.description.slice(0, 300) + '...',
          solution: '',
          isLocked: true,
          hasPurchased: false,
          userVote: (idea as any).votes && (idea as any).votes.length > 0 ? (idea as any).votes[0].type : null,
          isBookmarked: (idea as any).bookmarks && (idea as any).bookmarks.length > 0,
        },
      });
    }

    const userVote = (idea as any).votes && (idea as any).votes.length > 0 ? (idea as any).votes[0].type : null;
    const isBookmarked = (idea as any).bookmarks && (idea as any).bookmarks.length > 0;
    
    res.json({
      success: true,
      data: { ...idea, votes: undefined, bookmarks: undefined, userVote, isBookmarked, isLocked: false, hasPurchased: true },
    });
  } catch (err) { next(err); }
};

export const createIdea = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = { ...req.body, isPaid: req.body.isPaid === 'true' || req.body.isPaid === true };
    if (body.price) body.price = parseFloat(body.price);

    const data = ideaSchema.parse(body);
    if (data.isPaid && !data.price) throw new AppError('Price is required for paid ideas.', 400);
    if (!data.isPaid) data.price = null;

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageUrls = files?.images?.map((f) => `/uploads/images/${f.filename}`) || data.images || [];
    const attachmentUrls = files?.attachments?.map((f) => `/uploads/attachments/${f.filename}`) || data.attachments || [];

    const idea = await prisma.idea.create({
      data: {
        ...data,
        images: imageUrls,
        attachments: attachmentUrls,
        price: data.price ?? null,
        authorId: req.user!.id,
        status: 'DRAFT',
      },
      include: { category: { select: { id: true, name: true } } },
    });

    res.status(201).json({ success: true, message: 'Idea created as draft.', data: idea });
  } catch (err) {
    next(err);
  }
};

export const updateIdea = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea) throw new AppError('Idea not found.', 404);

    const isAdmin = req.user!.role === 'ADMIN';
    const isAuthor = idea.authorId === req.user!.id;

    if (!isAdmin && !isAuthor) throw new AppError('Unauthorized to edit this idea.', 403);
    if (!isAdmin && idea.status === 'APPROVED') throw new AppError('Cannot edit an approved idea.', 400);

    const body = { ...req.body };
    if (body.isPaid !== undefined) body.isPaid = body.isPaid === 'true' || body.isPaid === true;
    if (body.price) body.price = parseFloat(body.price);

    const data = ideaSchema.partial().parse(body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Handle images: Merge existing (from JSON) with new (from Multer)
    let finalImages = Array.isArray(body.images) ? body.images : (typeof body.images === 'string' ? [body.images] : []);
    if (files?.images?.length) {
      const newImages = files.images.map((f) => `/uploads/images/${f.filename}`);
      finalImages = [...finalImages, ...newImages];
    }
    if (finalImages.length > 0) data.images = finalImages;

    // Handle attachments
    let finalAttachments = Array.isArray(body.attachments) ? body.attachments : (typeof body.attachments === 'string' ? [body.attachments] : []);
    if (files?.attachments?.length) {
      const newAttachments = files.attachments.map((f) => `/uploads/attachments/${f.filename}`);
      finalAttachments = [...finalAttachments, ...newAttachments];
    }
    if (finalAttachments.length > 0) data.attachments = finalAttachments;

    const updated = await prisma.idea.update({
      where: { id: req.params.id as string },
      data: { ...data, price: data.price ?? undefined },
      include: { category: { select: { id: true, name: true } } },
    });

    res.json({ success: true, message: 'Idea updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteIdea = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea) throw new AppError('Idea not found.', 404);
    const isAdmin = req.user!.role === 'ADMIN';
    const isAuthor = idea.authorId === req.user!.id;
    if (!isAdmin && !isAuthor) throw new AppError('Unauthorized.', 403);
    await prisma.idea.delete({ where: { id: id } });
    res.json({ success: true, message: 'Idea deleted.' });
  } catch (err) { next(err); }
};

export const submitForReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id as string } });
    if (!idea) throw new AppError('Idea not found.', 404);
    if (idea.authorId !== req.user!.id) throw new AppError('Unauthorized.', 403);
    if (idea.status !== 'DRAFT' && idea.status !== 'REJECTED')
      throw new AppError('Only draft or rejected ideas can be submitted for review.', 400);
    const updated = await prisma.idea.update({
      where: { id: req.params.id as string },
      data: { status: 'UNDER_REVIEW', feedback: null },
    });
    res.json({ success: true, message: 'Idea submitted for review!', data: updated });
  } catch (err) { next(err); }
};

export const approveIdea = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id as string } });
    if (!idea) throw new AppError('Idea not found.', 404);
    if (idea.status !== 'UNDER_REVIEW') throw new AppError('Only ideas under review can be approved.', 400);
    const updated = await prisma.idea.update({
      where: { id: req.params.id as string },
      data: { status: 'APPROVED', feedback: null },
      include: { author: { select: { email: true, name: true } } },
    });

    // Notify user
    await sendEmail(
      updated.author.email,
      'Your idea has been approved! 🎉',
      `<p>Hi ${updated.author.name},</p><p>Great news! Your idea "<strong>${updated.title}</strong>" has been approved and is now live on EcoSpark Hub.</p><p><a href="${process.env.CLIENT_URL}/ideas/${updated.id}">View your idea here</a></p>`
    );

    res.json({ success: true, message: 'Idea approved!', data: updated });
  } catch (err) { next(err); }
};

export const rejectIdea = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feedback } = req.body;
    if (!feedback || feedback.trim().length < 10)
      throw new AppError('Rejection feedback must be at least 10 characters.', 400);
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id as string } });
    if (!idea) throw new AppError('Idea not found.', 404);
    if (idea.status !== 'UNDER_REVIEW') throw new AppError('Only ideas under review can be rejected.', 400);
    const updated = await prisma.idea.update({
      where: { id: req.params.id as string },
      data: { status: 'REJECTED', feedback },
      include: { author: { select: { email: true, name: true } } },
    });

    // Notify user
    await sendEmail(
      updated.author.email,
      'Update on your idea submission',
      `<p>Hi ${updated.author.name},</p><p>Thank you for submitting "<strong>${updated.title}</strong>". After review, our team has some feedback: </p><blockquote>${feedback}</blockquote><p>You can update your idea and resubmit it for review at any time.</p>`
    );

    res.json({ success: true, message: 'Idea rejected.', data: updated });
  } catch (err) { next(err); }
};

export const getPurchaseStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.json({ success: true, data: { hasPurchased: false } });
    const purchase = await prisma.purchase.findUnique({
      where: { userId_ideaId: { userId: req.user.id, ideaId: req.params.id as string } },
    });
    res.json({ success: true, data: { hasPurchased: !!purchase } });
  } catch (err) { next(err); }
};

export const getDashboardIdeas = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { authorId: req.user!.id },
      include: {
        category: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true, votes: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: ideas });
  } catch (err) { next(err); }
};

export const getMemberStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const [totalIdeas, votesReceived, commentsMade, totalPurchases] = await Promise.all([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { idea: { authorId: userId } } }),
      prisma.comment.count({ where: { authorId: userId } }),
      prisma.purchase.count({ where: { userId } }),
    ]);
    res.json({
      success: true,
      data: { totalIdeas, votesReceived, commentsMade, totalPurchases }
    });
  } catch (err) { next(err); }
};

export const getBookmarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      include: {
        idea: {
          include: {
            author: { select: { name: true, avatar: true } },
            category: { select: { name: true, color: true } },
            _count: { select: { votes: true, comments: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookmarks.map(b => b.idea) });
  } catch (err) { next(err); }
};

export const toggleBookmark = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ideaId = req.params.id as string;
    const userId = req.user!.id;
    const existing = await prisma.bookmark.findUnique({
      where: { userId_ideaId: { userId, ideaId } }
    });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      res.json({ success: true, message: 'Bookmark removed.', isBookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { userId, ideaId } });
      res.json({ success: true, message: 'Idea bookmarked!', isBookmarked: true });
    }
  } catch (err) { next(err); }
};

export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalIdeas, pendingIdeas, totalUsers, totalRevenue, recentIdeas] = await Promise.all([
      prisma.idea.count(),
      prisma.idea.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.user.count(),
      prisma.purchase.aggregate({ _sum: { amount: true } }),
      prisma.idea.findMany({
        where: { status: 'UNDER_REVIEW' },
        include: { author: { select: { name: true } }, category: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 5,
      }),
    ]);

    // Monthly Activity - Last 12 months
    const now = new Date();
    const monthlyStats = await Promise.all(
      Array.from({ length: 12 }).map(async (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const count = await prisma.idea.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          count,
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalIdeas, pendingIdeas, totalUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        recentPending: recentIdeas,
        monthlyActivity: monthlyStats.reverse(),
      },
    });

  } catch (err) { next(err); }
};
