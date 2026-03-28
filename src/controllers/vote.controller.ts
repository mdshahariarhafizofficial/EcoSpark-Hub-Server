import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const vote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body;
    if (!['UP', 'DOWN'].includes(type)) throw new AppError('Vote type must be UP or DOWN.', 400);

    const id = req.params.id as string;
    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea) throw new AppError('Idea not found.', 404);
    if (idea.status !== 'APPROVED') throw new AppError('Cannot vote on non-approved ideas.', 400);

    const existing = await prisma.vote.findUnique({
      where: { userId_ideaId: { userId: req.user!.id, ideaId: id } },
    });

    let voteCountDelta = 0;

    if (existing) {
      if (existing.type === type) {
        // Same vote – do nothing
        return res.json({ success: true, message: 'Already voted.', data: { voteCount: idea.voteCount, userVote: type } });
      } else {
        // Change vote: remove old, add new
        await prisma.vote.update({ where: { id: existing.id }, data: { type } });
        voteCountDelta = type === 'UP' ? 2 : -2;
      }
    } else {
      await prisma.vote.create({ data: { type, userId: req.user!.id, ideaId: id } });
      voteCountDelta = type === 'UP' ? 1 : -1;
    }

    const updated = await prisma.idea.update({
      where: { id },
      data: { voteCount: { increment: voteCountDelta } },
      select: { voteCount: true },
    });

    res.json({ success: true, message: 'Vote recorded.', data: { voteCount: updated.voteCount, userVote: type } });
  } catch (err) { next(err); }
};

export const removeVote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.vote.findUnique({
      where: { userId_ideaId: { userId: req.user!.id, ideaId: id } },
    });
    if (!existing) throw new AppError('No vote to remove.', 400);

    await prisma.vote.delete({ where: { id: existing.id } });
    const delta = existing.type === 'UP' ? -1 : 1;
    const updated = await prisma.idea.update({
      where: { id },
      data: { voteCount: { increment: delta } },
      select: { voteCount: true },
    });

    res.json({ success: true, message: 'Vote removed.', data: { voteCount: updated.voteCount, userVote: null } });
  } catch (err) { next(err); }
};
