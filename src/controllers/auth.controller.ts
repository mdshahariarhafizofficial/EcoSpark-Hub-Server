import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { sendEmail } from '../utils/email';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const signToken = (id: string, email: string, role: string) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

const setCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use.', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = signToken(user.id, user.email, user.role);
    setCookie(res, token);

    // Welcome Email
    await sendEmail(
      user.email,
      'Welcome to EcoSpark Hub! 🌍',
      `<h1>Welcome, ${user.name}!</h1><p>We're thrilled to have you join our sustainable community. Explore green ideas, share your own, and help us build a better future.</p><p><a href="${process.env.CLIENT_URL}/dashboard">Get started here</a></p>`
    );

    res.status(201).json({ success: true, message: 'Registration successful!', data: { user, token } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: (err as any).errors });
    }
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid email or password.', 401);

    if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password.', 401);

    const token = signToken(user.id, user.email, user.role);
    setCookie(res, token);

    const { password: _, ...safeUser } = user;
    res.json({ success: true, message: 'Login successful!', data: { user: safeUser, token } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: (err as any).errors });
    }
    next(err);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });
  res.json({ success: true, message: 'Logged out successfully.' });
};

export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, bio: true,
        avatar: true, isActive: true, createdAt: true,
        _count: { select: { ideas: true, purchases: true } },
      },
    });
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
