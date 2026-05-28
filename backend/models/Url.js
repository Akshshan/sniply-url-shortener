// ============================================================
// backend/models/Url.js
// Mongoose schema & model for a shortened URL document.
// Stores the original URL, generated short code, metadata,
// expiry date, and a running click counter.
// ============================================================

const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

// ── Define the shape of a Url document in MongoDB ───────────
const urlSchema = new mongoose.Schema(
  {
    // The full original URL that the short code redirects to
    originalUrl: {
      type:     String,
      required: [true, "Original URL is required."],
      trim:     true,
    },

    // The unique short code — e.g. "abc123" in http://localhost:5000/abc123
    // Either auto-generated with nanoid or provided by the user (custom alias)
    shortCode: {
      type:     String,
      required: true,
      unique:   true,   // MongoDB enforces no two URLs share the same short code
      trim:     true,
    },

    // Reference to the User who created this short URL
    // This lets us fetch only the URLs belonging to the logged-in user
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",           // links to the User model
      required: true,
    },

    // Optional human-readable title (we auto-derive it from the hostname
    // on the backend, but the field is here if we want to extend it)
    title: {
      type:    String,
      default: "",
      trim:    true,
    },

    // Optional expiry date — if set and in the past, redirect returns 410 Gone
    expiresAt: {
      type:    Date,
      default: null,    // null means "never expires"
    },

    // Denormalised click counter — incremented on every redirect
    // Storing it here avoids a COUNT query on the Click collection
    // for the dashboard list view (performance optimisation)
    totalClicks: {
      type:    Number,
      default: 0,
    },

    // Timestamp of the most recent click — updated on every redirect
    lastClickedAt: {
      type:    Date,
      default: null,
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

// ============================================================
// PRE-VALIDATE HOOK
// If the user did NOT provide a custom shortCode, generate
// one automatically using nanoid (8 URL-safe characters).
// This runs before Mongoose validates the document, so the
// shortCode required validator will always be satisfied.
// ============================================================

urlSchema.pre("validate", function (next) {
  if (!this.shortCode) {
    // nanoid(8) generates strings like "V1StGXR8"
    // URL-safe alphabet by default (no special chars)
    this.shortCode = nanoid(8);
  }
  next();
});

// ============================================================
// INDEXES
// shortCode is queried on every redirect, so we index it.
// The `unique: true` above already creates a unique index,
// but we add an explicit index here for clarity.
// We also index `user` to speed up "fetch all URLs for user".
// ============================================================


urlSchema.index({ user: 1 });        // fast dashboard queries

// ============================================================
// VIRTUAL — shortUrl
// A computed property that assembles the full short URL string.
// It is NOT stored in MongoDB; it's derived on demand.
// Usage: urlDoc.shortUrl  →  "http://localhost:5000/abc123"
// ============================================================

urlSchema.virtual("shortUrl").get(function () {
  const base = process.env.BASE_URL || "http://localhost:5000";
  return `${base}/${this.shortCode}`;
});

// Make virtuals appear when converting the document to JSON
// (needed so the frontend receives the `shortUrl` field)
urlSchema.set("toJSON",   { virtuals: true });
urlSchema.set("toObject", { virtuals: true });

// ============================================================
// EXPORT the model
// Creates the "urls" collection in MongoDB automatically.
// ============================================================

module.exports = mongoose.model("Url", urlSchema);