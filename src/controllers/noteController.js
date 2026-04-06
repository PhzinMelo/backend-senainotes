const noteService = require('../services/noteService');
const ApiError    = require('../utils/ApiError');
const { successResponse }  = require('../utils/responseHelper');
const { validateObjectId, validatePagination } = require('../utils/validators');
const { createNoteSchema, updateNoteSchema, formatZodErrors } = require('../utils/schemas');

const listNotes = async (req, res) => {
  const { page, limit, skip } = validatePagination(req.query);
  const { search, tag, archived } = req.query;
  const { notes, total, totalPages } = await noteService.listNotes(req.user.id, {
    page, limit, skip, search, tag, archived,
  });
  return successResponse(res, 200, 'Notes fetched successfully',
    notes, { total, page, limit, totalPages });
};

const getNoteStats = async (req, res) => {
  const stats = await noteService.getNoteStats(req.user.id);
  return successResponse(res, 200, 'Stats retrieved successfully', stats);
};

const getNote = async (req, res) => {
  validateObjectId(req.params.id, 'note ID');
  const note = await noteService.getNoteById(req.params.id, req.user.id);
  return successResponse(res, 200, 'Note retrieved successfully', note);
};

/**
 * POST /api/notes
 * Body: { title, content, tags?, imageUrl?, crop? }
 *
 * Accepts crop data alongside imageUrl.
 * Backend stores both; frontend uses them to render the cropped image via CSS.
 * The server NEVER processes or modifies the image file itself.
 */
const createNote = async (req, res) => {
  const result = createNoteSchema.safeParse(req.body);
  if (!result.success) throw new ApiError(400, formatZodErrors(result.error), 'VALIDATION_ERROR');

  const { title, content, tags, imageUrl, crop } = result.data;
  const note = await noteService.createNote({ title, content, tags, imageUrl, crop }, req.user.id);
  return successResponse(res, 201, 'Note created successfully', note);
};

/**
 * PUT /api/notes/:id
 * Body: { title?, content?, tags?, imageUrl?, crop? }
 */
const updateNote = async (req, res) => {
  validateObjectId(req.params.id, 'note ID');
  const result = updateNoteSchema.safeParse(req.body);
  if (!result.success) throw new ApiError(400, formatZodErrors(result.error), 'VALIDATION_ERROR');

  const { title, content, tags, imageUrl, crop } = result.data;
  const note = await noteService.updateNote(req.params.id, { title, content, tags, imageUrl, crop }, req.user.id);
  return successResponse(res, 200, 'Note updated successfully', note);
};

const toggleArchive = async (req, res) => {
  validateObjectId(req.params.id, 'note ID');
  const note    = await noteService.toggleArchive(req.params.id, req.user.id);
  const message = note.archived ? 'Note archived successfully' : 'Note restored successfully';
  return successResponse(res, 200, message, note);
};

const deleteNote = async (req, res) => {
  validateObjectId(req.params.id, 'note ID');
  await noteService.deleteNote(req.params.id, req.user.id);
  return successResponse(res, 200, 'Note deleted successfully', null);
};

module.exports = { listNotes, getNoteStats, getNote, createNote, updateNote, toggleArchive, deleteNote };