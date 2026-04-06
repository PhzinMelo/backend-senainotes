const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 * User schema.
 *
 * Security:
 *  - `password` has select:false — never returned in queries by default
 *  - Password is hashed by a pre-save hook before touching the database
 *  - comparePassword() uses bcrypt.compare — constant-time, safe against timing attacks
 *  - toJSON() strips `password` as a second line of defense
 *
 * ─── Pre-save hook: async vs next() — Bug Analysis & Fix ──────────────────────
 *
 * THE PROBLEM with the previous code:
 *
 *   userSchema.pre('save', async function (next) {  // ← declares next callback
 *     if (!this.isModified('password')) return next(); // ← calls next() to skip
 *     this.password = await bcrypt.hash(this.password, 12);
 *     next();  // ← calls next() AGAIN at the end
 *   });
 *
 * Why this is wrong:
 *
 *  1. DOUBLE-SIGNALLING: When Mongoose receives an async hook function, it awaits
 *     the returned Promise AND listens to the next() callback simultaneously.
 *     This means both channels fire — the Promise resolves AND next() is called.
 *     In Mongoose v7+ this triggers an internal "callback called multiple times"
 *     warning and can cause unpredictable execution order.
 *
 *  2. SILENT ERROR SWALLOWING: If bcrypt.hash() throws inside an async function
 *     that also uses next(), the Promise rejects but next() may never be called
 *     with the error — or the error propagates through an unexpected path.
 *     Either way the error handling becomes non-deterministic.
 *
 *  3. MIXED PARADIGMS: Using async + next() mixes two completion signalling
 *     mechanisms. Mongoose docs explicitly state: use ONE or the other, never both.
 *
 * THE FIX — async without next():
 *
 *   When the hook function is async, Mongoose awaits the returned Promise.
 *   Resolving = success, rejecting (throw) = error forwarded to the save() caller.
 *   No next() needed. The code is cleaner and the behaviour is deterministic.
 *
 *   The alternative (next() without async) is valid but more verbose and requires
 *   manual .catch(next) to forward errors — async/await handles this automatically.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6,   'Password must be at least 6 characters'],
      select:    false, // Never returned in queries unless explicitly requested
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Pre-save hook: hash password (FIXED — async only, no next()) ─────────────
//
// Choosing async without next() because:
//  - Mongoose awaits the Promise — no second signalling channel needed
//  - throw inside async automatically becomes a save() rejection (clean error flow)
//  - Eliminates the double-signalling bug from the previous implementation
//
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Password unchanged — skip hashing
  this.password = await bcrypt.hash(this.password, 12); // 12 rounds = ~250ms, good balance
  // No next() — Mongoose awaits this Promise automatically
});

// ─── Instance method: compare plain text against stored hash ──────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// ─── Strip password from JSON output (second line of defense) ────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);