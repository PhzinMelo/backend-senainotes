require('express-async-errors'); // Must be imported BEFORE routes
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

const authRoutes  = require('./routes/authRoutes');
const noteRoutes  = require('./routes/noteRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// ─── Security: Helmet sets safe HTTP response headers ────────────────────────
app.use(helmet());

// ─── CORS: allow requests from the Angular frontend ──────────────────────────
app.use(
  cors({
    origin:         process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── JSON body parser ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:      'ok',
    environment: process.env.NODE_ENV,   // FIX: was 'ambiente' (PT)
    timestamp:   new Date().toISOString(),
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/notes', noteRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// ─── Global error middleware (must be last) ───────────────────────────────────
app.use(errorMiddleware);

module.exports = app;