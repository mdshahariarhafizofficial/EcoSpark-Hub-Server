import { Response, NextFunction } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
});

export const initiatePayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });
    if (!idea) throw new AppError('Idea not found.', 404);
    if (!idea.isPaid || !idea.price) throw new AppError('This idea is free.', 400);
    if (idea.status !== 'APPROVED') throw new AppError('This idea is not available for purchase.', 400);
    if (idea.authorId === req.user!.id) throw new AppError('You cannot purchase your own idea.', 400);

    // Check if already purchased
    const existing = await prisma.purchase.findUnique({
      where: { userId_ideaId: { userId: req.user!.id, ideaId: idea.id } },
    });
    if (existing) throw new AppError('You have already purchased this idea.', 400);

    const { currency = 'usd' } = req.body;
    const isBDT = currency.toLowerCase() === 'bdt';
    const amount = isBDT ? Math.round(idea.price * 120) : idea.price; // Approx rate

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: isBDT ? 'bdt' : 'usd',
          product_data: {
            name: idea.title,
            description: `Access to "${idea.title}" by ${(idea as any).author.name}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/ideas/${idea.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/ideas/${idea.id}`,
      metadata: { 
        ideaId: idea.id, 
        userId: req.user!.id
      },
    });

    res.json({ success: true, data: { sessionUrl: session.url, sessionId: session.id } });
  } catch (err) { next(err); }
};

const createPurchaseRecord = async (session: Stripe.Checkout.Session) => {
  logger.info(`📦 Processing purchase for session: ${session.id}`);
  
  const metadata = session.metadata;
  logger.info(`   Metadata received: ${JSON.stringify(metadata)}`);

  if (!metadata || !metadata.ideaId || !metadata.userId) {
    logger.error(`❌ Missing or invalid metadata in session ${session.id}.`);
    return null;
  }

  const { ideaId, userId } = metadata;
  const amount = (session.amount_total || 0) / 100;
  const currency = session.currency?.toUpperCase() || 'USD';

  try {
    // Idempotent: check if already exists
    const existing = await prisma.purchase.findUnique({ where: { stripeSessionId: session.id } });
    if (existing) {
      logger.info(`ℹ️ Purchase record for session ${session.id} already exists in DB.`);
      return existing;
    }

    // Verify relations actually exist (Prisma constraint safety)
    const [userExists, ideaExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.idea.findUnique({ where: { id: ideaId } })
    ]);

    if (!userExists) logger.error(`❌ User ${userId} not found in database.`);
    if (!ideaExists) logger.error(`❌ Idea ${ideaId} not found in database.`);
    if (!userExists || !ideaExists) return null;

    logger.info(`💾 Attempting to create purchase record in DB: user=${userId}, idea=${ideaId}, amount=${amount}`);

    const purchase = await prisma.purchase.create({
      data: {
        ideaId,
        userId,
        amount: amount,
        currency,
        status: 'COMPLETED',
        stripeSessionId: session.id,
      } as any,
    });

    logger.info(`✅ Successfully saved purchase record to DB. ID: ${purchase.id}`);
    return purchase;
  } catch (err: any) {
    // Handle potential race condition where webhook and success handler run simultaneously
    if (err.code === 'P2002') {
      logger.info(`ℹ️ Race condition handled: Purchase record already exists (P2002).`);
      return await prisma.purchase.findUnique({ where: { stripeSessionId: session.id } });
    }
    logger.error('❌ Critical error saving purchase to database:', err);
    throw err;
  }
};

export const handleWebhook = async (req: any, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  logger.info(`🔔 Incoming Webhook Event from path: ${req.path}`);

  try {
    const payload = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    logger.info(`✅ Webhook signature verified. Event type: ${event.type}`);
  } catch (err: any) {
    logger.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Safety check: ensure payment is actually paid
    if (session.payment_status === 'paid') {
      try {
        logger.info(`💰 Session completed & paid: ${session.id}`);
        await createPurchaseRecord(session);
      } catch (err) {
        logger.error(`❌ Error in createPurchaseRecord from webhook:`, err);
      }
    } else {
      logger.info(`⏳ Session ${session.id} not paid yet (status: ${session.payment_status})`);
    }
  }

  res.json({ received: true });
};

export const handlePaymentSuccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session_id = req.query.session_id as string;
    if (!session_id || !req.user) {
      return res.json({ success: false, message: 'Invalid request.' });
    }

    // 1. Check database first — webhook may have already processed it
    let purchase = await prisma.purchase.findUnique({ where: { stripeSessionId: session_id } });

    if (purchase) {
      logger.info(`✅ Purchase found in DB for session ${session_id}`);
      return res.json({ success: true, data: { hasPurchased: true, status: 'VERIFIED', ideaId: purchase.ideaId } });
    }

    // 2. Fallback: Webhook may be delayed. Verify directly via Stripe API.
    logger.info(`🔍 No DB record for ${session_id}. Attempting Stripe API fallback verification...`);
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === 'paid') {
        logger.info(`💰 Stripe confirmed payment for ${session_id}. Creating purchase record now.`);
        purchase = await createPurchaseRecord(session) as any;

        if (purchase) {
          logger.info(`✅ Fallback purchase record created for session ${session_id}`);
          return res.json({ success: true, data: { hasPurchased: true, status: 'VERIFIED', ideaId: purchase.ideaId } });
        }
      } else {
        logger.warn(`⏳ Stripe session ${session_id} has payment_status: ${session.payment_status}`);
      }
    } catch (stripeErr: any) {
      logger.error(`❌ Stripe API fallback failed for session ${session_id}: ${stripeErr.message}`);
    }

    // 3. Return PENDING — frontend can poll once more
    return res.json({ success: true, data: { hasPurchased: false, status: 'PENDING' } });
  } catch (err) { next(err); }
};

export const getAllPurchases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          idea: { select: { id: true, title: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count(),
    ]);
    res.json({ success: true, data: purchases, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getMyPurchases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user!.id },
      include: {
        idea: { select: { id: true, title: true, price: true, author: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
};
