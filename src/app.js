import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

// Routes import
import authRoutes from './routes/authRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Middlewares
import errorHandler from './middleware/error.js';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows displaying uploaded images on frontend
}));

// CORS setup: Support credentials and custom origins (local client development and deployment client)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting to protect APIs from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP. Please try again after 15 minutes.'
});
app.use('/api', limiter);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser for JWT HttpOnly validation
app.use(cookieParser());

// Create public directory for local file uploads
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded avatars/images statically
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
app.all("/api/better-auth/*", toNodeHandler(auth));

// Fallback 404 handler for invalid routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource API path '${req.originalUrl}' not found on this server.`
  });
});

// Global Centralized Error Handler
app.use(errorHandler);

export default app;
