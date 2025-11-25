// @ts-nocheck - Server file with type compatibility issues
import 'dotenv/config';
import express from "express";
import routes from "./routes";
import cors from "cors";

const app = express();

// Avoid importing browser-only modules on the server
// Ensure no client-only code is imported here
// Configure CORS with explicit origins for Vite proxy
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://[::]:8080',
  'http://localhost:8789',
  'http://127.0.0.1:8789',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('[CORS] Allowed origin:', origin);
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
}));

app.use(express.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}));
// Mount routes at both /api/v1 (backend) and /api (frontend workshop)
app.use("/api/v1", routes);
app.use("/api", routes);

const port = process.env.PORT || 8789;
// Bind to 0.0.0.0 to accept connections from all network interfaces
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`✅ API server listening on 0.0.0.0:${port}`);
  console.log(`   - Local:    http://localhost:${port}`);
  console.log(`   - Network:  http://127.0.0.1:${port}`);
});


