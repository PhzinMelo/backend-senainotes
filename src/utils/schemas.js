const { z } = require('zod');

/**
 * Zod v4 validation schemas.
 *
 * Zod v4 notes:
 *  - Error details in `error.issues` (not `.errors`)
 *  - `.url()` accepts any protocol — we use HTTP_URL_REGEX for http/https
 *  - Tags for update have no `.default()` so undefined = "not provided"
 */

// ─── URL validator (http/https only) ─────────────────────────────────────────
const HTTP_URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

const imageUrlField = z
  .string().trim()
  .refine(v => HTTP_URL_REGEX.test(v), { message: 'imageUrl must be a valid URL (http or https)' })
  .optional();

// ─── Crop (percentages 0–100) ─────────────────────────────────────────────────
const cropField = z
  .object({
    x:      z.number().min(0).max(100),
    y:      z.number().min(0).max(100),
    width:  z.number().min(1).max(100),
    height: z.number().min(1).max(100),
  })
  .optional();

// ─── Shared fields ────────────────────────────────────────────────────────────
const titleField = z.string().trim()
  .min(2,   'title must be at least 2 characters')
  .max(200, 'title must be at most 200 characters');

const contentField = z.string().trim()
  .min(1,    'content cannot be empty')
  .max(10000,'content must be at most 10,000 characters');

const tagsItemField = z.string().trim().min(1).max(30, 'each tag must be at most 30 characters');
const normalizeTags = tags => [...new Set(tags.map(t => t.toLowerCase()))];

const tagsCreateField = z
  .array(tagsItemField).max(10, 'maximum of 10 tags per note')
  .optional().default([]).transform(normalizeTags);

const tagsUpdateField = z
  .array(tagsItemField).max(10, 'maximum of 10 tags per note')
  .transform(normalizeTags).optional();

// ─── Auth schemas ─────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().trim().min(2, 'name must be at least 2 characters').max(100),
  email:    z.string().trim().toLowerCase().email('invalid email format'),
  password: z.string().min(6, 'password must be at least 6 characters').max(72),
});

const loginSchema = z.object({
  email:    z.string().trim().toLowerCase().email('invalid email format'),
  password: z.string().min(1, 'password is required'),
});

// ─── Note schemas ─────────────────────────────────────────────────────────────
const createNoteSchema = z.object({
  title:    titleField,
  content:  contentField,
  tags:     tagsCreateField,
  imageUrl: imageUrlField,
  crop:     cropField,       // optional crop coords
});

const updateNoteSchema = z
  .object({
    title:    titleField.optional(),
    content:  contentField.optional(),
    tags:     tagsUpdateField,
    imageUrl: imageUrlField,
    crop:     cropField,
  })
  .refine(
    data =>
      data.title !== undefined || data.content !== undefined ||
      data.tags  !== undefined || data.imageUrl !== undefined ||
      data.crop  !== undefined,
    { message: 'Provide at least one field to update' }
  );

// ─── Error formatter ──────────────────────────────────────────────────────────
const formatZodErrors = zodError => {
  const issues = zodError.issues ?? zodError.errors ?? [];
  return issues.map(i => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
};

module.exports = {
  registerSchema,
  loginSchema,
  createNoteSchema,
  updateNoteSchema,
  cropField,
  formatZodErrors,
};