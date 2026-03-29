import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import ideaRoutes from './routes/idea.routes';
import categoryRoutes from './routes/category.routes';
import commentRoutes from './routes/comment.routes';
import voteRoutes from './routes/vote.routes';
import paymentRoutes from './routes/payment.routes';
import newsletterRoutes from './routes/newsletter.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import chatRoutes from './routes/chat.routes';
import contactRoutes from './routes/contact.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
// Basic Security with adjusted CSP for the landing page inline styles
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https://raw.githubusercontent.com"],
      },
    },
  })
);

// --- WELCOME PAGE HTML TEMPLATE ---
const WELCOME_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoSpark Hub API | Server Online</title>
    <style>
        :root {
            --primary: #10b981;
            --primary-dark: #059669;
            --bg: #0a0a0a;
            --card-bg: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.08);
            --text-main: #ffffff;
            --text-dim: #9ca3af;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background: radial-gradient(circle at center, #111827 0%, #000000 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-main);
            overflow: hidden;
        }

        .container {
            text-align: center;
            padding: 2.5rem;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 450px;
            width: 90%;
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .logo-container {
            margin-bottom: 2rem;
            position: relative;
            display: inline-block;
        }

        .logo-img {
            width: 80px;
            height: 80px;
            object-fit: contain;
            filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.3));
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.1);
            color: var(--primary);
            padding: 0.5rem 1rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: var(--primary);
            border-radius: 50%;
            position: relative;
        }

        .status-dot::after {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--primary);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(3); opacity: 0; }
        }

        h1 {
            font-size: 2.25rem;
            font-weight: 900;
            letter-spacing: -0.025em;
            margin-bottom: 0.75rem;
            background: linear-gradient(to bottom right, #fff, #9ca3af);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p {
            color: var(--text-dim);
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 2.5rem;
            font-weight: 500;
        }

        .info-grid {
            display: grid;
            grid-cols: 1;
            gap: 1rem;
            margin-bottom: 2.5rem;
            text-align: left;
            background: rgba(255, 255, 255, 0.02);
            padding: 1.25rem;
            border-radius: 1.25rem;
            border: 1px solid var(--border);
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
        }

        .info-label { color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;}
        .info-value { color: var(--text-main); font-weight: 700; font-family: monospace;}

        .btn {
            display: block;
            width: 100%;
            background: var(--primary);
            color: #000;
            text-decoration: none;
            padding: 1.15rem;
            border-radius: 1.15rem;
            font-weight: 800;
            font-size: 0.9rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }

        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.5);
        }

        .btn:active {
            transform: translateY(0);
        }

        footer {
            margin-top: 2.5rem;
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.2);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img src="https://raw.githubusercontent.com/mdshahariarhafizofficial/EcoSpark-Hub/main/public/favicon.png" alt="Logo" class="logo-img">
        </div>
        
        <div>
            <div class="status-badge">
                <div class="status-dot"></div>
                Status: Online
            </div>
        </div>

        <h1>EcoSpark Hub API</h1>
        <p>Your secure gateway to sustainable innovation and community-driven ecological action.</p>

        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Environment</span>
                <span class="info-value">${process.env.NODE_ENV || 'production'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Version</span>
                <span class="info-value">1.0.0</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Node Node</span>
                <span class="info-value">Verified</span>
            </div>
        </div>

        <a href="/api" class="btn">View API Registry</a>

        <footer>Developed by Shahriar Hafiz</footer>
    </div>
</body>
</html>
`;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Stripe webhook needs raw body — MUST come before express.json()
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Static files for uploads
// Static files for uploads - ensuring correct path mapping
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// Root Route - Professional Welcome Page
app.get('/', (req: express.Request, res: express.Response) => {
  res.send(WELCOME_PAGE);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'EcoSpark Hub API - VERIFIED' });
});

// 404 handler - catch-all for undefined routes
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 EcoSpark Hub API running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV}`);
  logger.info(`   Client URL: ${process.env.CLIENT_URL}`);
});

export default app;
