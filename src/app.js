require('express-async-errors'); // Must be imported BEFORE routes
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const swaggerUi  = require('swagger-ui-express');
const swaggerDoc = require('../swagger.json');

const authRoutes      = require('./routes/authRoutes');
const noteRoutes      = require('./routes/noteRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// ─── CORS: allow requests from the Angular frontend ──────────────────────────
app.use(
  cors({
    origin:         process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Swagger UI — must be registered BEFORE helmet ───────────────────────────
// swagger-ui-express loads inline scripts and styles that a strict CSP blocks.
// We apply a relaxed helmet only to the /api-docs route, and the full strict
// helmet to all other routes. This keeps security tight everywhere else.
app.use(
  '/api-docs',
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, {
    customSiteTitle:    'Senai Notes — API Docs',
    swaggerOptions: {
      persistAuthorization: true,         // keeps the token between page reloads
      displayRequestDuration: true,        // shows response time per request
      filter:            true,             // enables the search/filter bar
      defaultModelsExpandDepth: -1,        // collapses schemas section by default
    },
  })
);

// ─── Security: strict Helmet for all other routes ────────────────────────────
app.use(helmet());

// ─── JSON body parser ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:      'ok',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/notes', noteRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', error: { code: 'NOT_FOUND' } });
});

// ─── Global error middleware (must be last) ───────────────────────────────────
app.use(errorMiddleware);

module.exports = app;