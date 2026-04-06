const mongoose = require('mongoose');

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

/**
 * Crop subdocument schema.
 * Stores crop as percentages (0–100) of the image's displayed dimensions.
 * Percentage storage makes the crop resolution-independent:
 * the frontend can apply it at any display size via CSS math.
 */
const cropSchema = new mongoose.Schema(
  {
    x:      { type: Number, required: true, min: 0,   max: 100 },
    y:      { type: Number, required: true, min: 0,   max: 100 },
    width:  { type: Number, required: true, min: 1,   max: 100 },
    height: { type: Number, required: true, min: 1,   max: 100 },
  },
  { _id: false, versionKey: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      minlength: [2,   'Title must be at least 2 characters'],
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    content: {
      type:      String,
      required:  [true, 'Content is required'],
      trim:      true,
      maxlength: [10000, 'Content must be at most 10,000 characters'],
    },
    tags: {
      type:    [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10,
        message:   'Maximum of 10 tags per note',
      },
    },
    imageUrl: {
      type:    String,
      trim:    true,
      default: undefined,
      validate: {
        validator: (v) => !v || URL_REGEX.test(v),
        message:   'imageUrl must be a valid http/https URL',
      },
    },
    /**
     * Crop coordinates for the cover image.
     * Stored as percentages (0–100) — resolution-independent.
     * Only valid when imageUrl is also set.
     * Frontend uses these values to display a visually-cropped image via CSS.
     * The backend never processes or transforms the image itself.
     */
    crop: {
      type:    cropSchema,
      default: undefined,
    },
    archived: {
      type:    Boolean,
      default: false,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, archived: 1, createdAt: -1 });
noteSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model('Note', noteSchema);