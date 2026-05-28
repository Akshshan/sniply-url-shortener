// ============================================================
// backend/models/User.js
// Mongoose schema & model for a registered user.
// Handles password hashing automatically via a pre-save hook.
// ============================================================

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ── Define the shape of a User document in MongoDB ──────────
const userSchema = new mongoose.Schema(
  {
    // Full name displayed in the UI
    name: {
      type:     String,
      required: [true, "Name is required."],
      trim:     true,             // removes accidental leading/trailing spaces
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [50, "Name cannot exceed 50 characters."],
    },

    // Email is used as the login identifier — must be unique
    email: {
      type:     String,
      required: [true, "Email is required."],
      unique:   true,             // MongoDB will enforce uniqueness at DB level
      lowercase: true,            // always stored in lowercase for consistency
      trim:     true,
      match: [
        /^\S+@\S+\.\S+$/,         // basic email format validation
        "Please provide a valid email address.",
      ],
    },

    // Password is stored as a bcrypt hash — NEVER in plain text
    password: {
      type:      String,
      required:  [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters."],
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamp fields
    timestamps: true,
  }
);

// ============================================================
// PRE-SAVE HOOK — Hash the password before saving to MongoDB
// This runs automatically every time .save() is called.
// We skip hashing if the password field hasn't been changed
// (e.g. when updating only the name/email).
// ============================================================

userSchema.pre("save", async function (next) {
  // `this` refers to the current User document being saved
  if (!this.isModified("password")) {
    return next(); // password unchanged — skip hashing
  }

  try {
    // Generate a salt with cost factor 12 (good balance of speed vs security)
    const salt = await bcrypt.genSalt(12);

    // Replace the plain-text password with its hash
    this.password = await bcrypt.hash(this.password, salt);

    next(); // proceed with saving
  } catch (error) {
    next(error); // pass error to Express error handler
  }
});

// ============================================================
// INSTANCE METHOD — comparePassword
// Called during login to check if the submitted password
// matches the stored bcrypt hash.
// Usage: const isMatch = await user.comparePassword(plainText);
// ============================================================

userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare handles the hashing internally and returns true/false
  return bcrypt.compare(candidatePassword, this.password);
};

// ============================================================
// EXPORT the model
// mongoose.model("User", userSchema) creates the "users"
// collection in MongoDB automatically.
// ============================================================

module.exports = mongoose.model("User", userSchema);