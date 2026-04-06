const { Router } = require('express');
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

/**
 * All note routes require JWT authentication.
 * authMiddleware validates the token and injects req.user.id into every handler.
 */
router.use(authMiddleware);

// ─── Routes without :id param ─────────────────────────────────────────────────
// ⚠️ /stats must be registered BEFORE /:id — otherwise Express captures
//    'stats' as a dynamic param and routes it to getNote instead

/**
 * GET  /api/notes        → List notes (pagination, search, archive filter)
 *                          Query: ?page=1&limit=10&search=text&archived=false
 *
 * POST /api/notes        → Create a new note
 *                          Body: { title, content, tags? }
 *
 * GET  /api/notes/stats  → Aggregated statistics for the authenticated user
 */
router.get('/stats', noteController.getNoteStats);
router.get('/',      noteController.listNotes);
router.post('/',     noteController.createNote);

// ─── Routes with :id param ────────────────────────────────────────────────────

/**
 * GET    /api/notes/:id          → Fetch a note by ID
 * PUT    /api/notes/:id          → Update note fields (partial update supported)
 * DELETE /api/notes/:id          → Permanently delete a note
 * PATCH  /api/notes/:id/archive  → Toggle archived/active state (no body needed)
 */
router.get('/:id',             noteController.getNote);
router.put('/:id',             noteController.updateNote);
router.delete('/:id',          noteController.deleteNote);
router.patch('/:id/archive',   noteController.toggleArchive);

module.exports = router;