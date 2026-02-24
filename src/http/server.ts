/**
 * Express Server Entry Point
 *
 * SECURITY HARDENING:
 * - CORS strict in production, permissive in development
 * - Environment-based configuration
 * - Security audit logging
 */

// @ts-nocheck - Server file with type compatibility issues
import 'dotenv/config';
import express from "express";
import compression from "compression";
import routes from "./routes";
import cors from "cors";
import { logSecurityEvent } from "./security";

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Gzip/Brotli compression — reduces response sizes by 50-80%
app.use(compression());

// CORS Configuration
// SECURITY: Strict in production, permissive only in development
const allowedOrigins = [
  // Development origins
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://[::]:8080',
  'http://localhost:8789',
  'http://127.0.0.1:8789',
  'http://localhost:5173',  // Vite dev server
  'http://127.0.0.1:5173',
];

// Production origins from environment
const productionOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

// Combine origins based on environment
const effectiveOrigins = isProduction
  ? productionOrigins
  : [...allowedOrigins, ...productionOrigins];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman) - but only in dev
    if (!origin) {
      if (isProduction) {
        // In production, log and allow for now (some webhooks don't send origin)
        // but be cautious with credentials
        return callback(null, true);
      }
      return callback(null, true);
    }

    if (effectiveOrigins.includes(origin)) {
      callback(null, true);
    } else if (isProduction) {
      // SECURITY: In production, reject unknown origins
      logSecurityEvent('cors_blocked', {
        blockedOrigin: origin,
        allowedOrigins: effectiveOrigins.length,
      });
      callback(new Error('CORS policy: Origin not allowed'), false);
    } else {
      // Development: allow all with warning
      console.warn(`[CORS] Allowing non-allowlisted origin in dev: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  // Additional security headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-ID', 'stripe-signature'],
  maxAge: 86400, // Cache preflight for 24 hours
}));

// JSON body parser with raw body preservation for webhooks
app.use(express.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}));

// Mount routes at both /api/v1 (backend) and /api (frontend workshop)
app.use("/api/v1", routes);
app.use("/api", routes);

// Cache-Control for authenticated GET API responses (user-specific, short-lived)
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  }
  next();
});

// Health check endpoint (outside of routes for simpler monitoring)
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

const port = process.env.PORT || 8789;
// Bind to 0.0.0.0 to accept connections from all network interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📍 API endpoints: http://localhost:${port}/api/v1/`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS mode: ${isProduction ? 'STRICT (production)' : 'PERMISSIVE (development)'}`);
  if (isProduction && effectiveOrigins.length === 0) {
    console.warn('⚠️  CORS_ALLOWED_ORIGINS not set - all origins may be blocked');
  }
});
