import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
});

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = contactSchema.parse(req.body);
    const message = await prisma.contactMessage.create({
      data
    });
    res.status(201).json({ success: true, message: 'Message sent successfully!', data: message });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    next(err);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

export const updateMessageStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['NEW', 'READ', 'REPLIED'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) { next(err); }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.delete({ where: { id } });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};
