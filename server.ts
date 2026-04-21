import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import expressWinston from 'express-winston';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Routes } from './src/backend/routes';
import { setupWebSocket } from './src/backend/websocket';
import { requireAuth, AuthRequest } from './src/backend/auth.middleware';
import { generateTicket } from './src/backend/ticketCache';

// Extend Express Request type to include id
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: 'Too many requests from this IP, please try again later. (Rate Limit Exceeded)' },
  standardHeaders: true,
  legacyHeaders: false,
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'subsurface-api' },
  transports: [
    new winston.transports.Console()
  ],
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Add UUID to request for tracing
  app.use((req, res, next) => {
    req.id = uuidv4();
    next();
  });

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for dev / Vite HMR compatibility. Re-enable carefully in prod.
    crossOriginEmbedderPolicy: false
  }));

  app.use(express.json({ limit: '50mb' }));

  // Telemetry Logging
  app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true, 
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
    dynamicMeta: (req: express.Request, res) => {
      return { reqId: req.id };
    }
  }));

  // API Routes with Rate Limiting and Auth Wall
  app.post('/api/analyze', apiLimiter, requireAuth, Routes.analyze);
  app.post('/api/chat', apiLimiter, requireAuth, Routes.chat);
  
  // Endpoint to dispense secure, short-lived WS tickets
  app.post('/api/live/ticket', apiLimiter, requireAuth, (req: AuthRequest, res) => {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const ticket = generateTicket(req.user.uid);
    return res.json({ ticket });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Exception Filter
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled Exception caught by Global Filter', { 
      error: err.message, 
      stack: err.stack,
      reqId: req.id
    });
    res.status(500).json({ error: 'Internal Server Error', referenceId: req.id });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://0.0.0.0:${PORT}`);
  });

  // WebSocket for Live API
  setupWebSocket(server);
}

startServer();
