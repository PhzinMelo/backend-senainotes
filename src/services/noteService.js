const mongoose = require('mongoose');
const Note     = require('../models/Note');
const ApiError = require('../utils/ApiError');

// ─── Internal helper ──────────────────────────────────────────────────────────

const _findNoteByOwner = async (noteId, userId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw new ApiError(404, 'Note not found', 'NOT_FOUND');
  return note;
};

// ─── Public operations ────────────────────────────────────────────────────────

/**
 * Lists notes with pagination, $regex search, tag filter and archive filter.
 */
const listNotes = async (userId, { page, limit, skip, search, tag, archived }) => {
  const filter = { userId };

  if (archived === 'true')  filter.archived = true;
  if (archived === 'false') filter.archived = false;

  if (tag && tag.trim()) filter.tags = tag.trim().toLowerCase();

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = { $regex: escaped, $options: 'i' };
    filter.$or    = [{ title: regex }, { content: regex }];
  }

  const [total, notes] = await Promise.all([
    Note.countDocuments(filter),
    Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { notes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getNoteById = async (noteId, userId) => _findNoteByOwner(noteId, userId);

/**
 * Creates a note.
 * Accepts imageUrl + crop — backend stores both, never transforms the image.
 */
const createNote = async ({ title, content, tags, imageUrl, crop }, userId) => {
  const data = { title, content, tags, userId };
  if (imageUrl)             data.imageUrl = imageUrl;
  if (imageUrl && crop)     data.crop     = crop;     // crop only meaningful with imageUrl
  return Note.create(data);
};

/**
 * Partial update — only fields explicitly passed are changed.
 * Passing imageUrl: null clears both imageUrl and crop.
 */
const updateNote = async (noteId, { title, content, tags, imageUrl, crop }, userId) => {
  const note = await _findNoteByOwner(noteId, userId);

  if (title    !== undefined) note.title    = title;
  if (content  !== undefined) note.content  = content;
  if (tags     !== undefined) note.tags     = tags;

  if (imageUrl !== undefined) {
    note.imageUrl = imageUrl || undefined;  // null/empty clears it
    note.crop     = (imageUrl && crop) ? crop : undefined;
  } else if (crop !== undefined && note.imageUrl) {
    // Allow updating just the crop on an existing image
    note.crop = crop;
  }

  return note.save();
};

const toggleArchive = async (noteId, userId) => {
  const note = await _findNoteByOwner(noteId, userId);
  note.archived = !note.archived;
  return note.save();
};

const deleteNote = async (noteId, userId) => {
  const note = await _findNoteByOwner(noteId, userId);
  await note.deleteOne();
};

const getNoteStats = async (userId) => {
  const [result] = await Note.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $facet: {
        counts: [{ $group: { _id: '$archived', count: { $sum: 1 } } }],
        byTag:  [
          { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { tag: '$_id', count: 1, _id: 0 } },
        ],
      },
    },
  ]);

  const counts   = result?.counts || [];
  const active   = counts.find(c => c._id === false)?.count || 0;
  const archived = counts.find(c => c._id === true)?.count  || 0;

  return { total: active + archived, active, archived, byTag: result?.byTag || [] };
};

module.exports = {
  listNotes, getNoteById, createNote, updateNote,
  toggleArchive, deleteNote, getNoteStats,
};