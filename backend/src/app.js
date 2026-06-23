import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import logger from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Centralized HTTP request logging (skipped during tests via logger.stream).
app.use(morgan(env.isProduction ? 'combined' : 'dev', { stream: logger.stream }));

// CORS with credentials so the httpOnly cookie is accepted cross-origin.
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no origin) and whitelisted client origins.
      if (!origin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check (useful for Render / uptime monitors).
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/opportunities', opportunityRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
