import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const subscribeNewsletter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = newsletterSchema.parse(req.body);
    
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already subscribed.' });
    }
    
    await prisma.newsletterSubscription.create({
      data: { email }
    });
    
    res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const getSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await prisma.newsletterSubscription.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: subs });
  } catch (err) { next(err); }
};
