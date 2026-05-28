// ============================================================
// backend/models/Click.js
// Mongoose schema & model for recording every click/visit
// on a short URL. Each document represents ONE click event.
// Used to power the Analytics page (charts, history, etc.)
// ============================================================

const mongoose = require("mongoose");

// ── Define the shape of a Click document in MongoDB ─────────
const clickSchema = new mongoose.Schema(
  {
    // Reference to the Url document this click belongs to
    // Allows us to query: "give me all clicks for URL X"
    url: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Url",      // links to the Url model
      required: true,
    },

    // IP address of the visitor — stored for basic geo/unique tracking
    // In production you'd want to anonymise this for GDPR compliance
    ipAddress: {
      type:    String,
      default: "unknown",
      trim:    true,
    },

    // User-Agent string from the browser/client
    // Can be parsed later to show browser/OS breakdown
    userAgent: {
      type:    String,
      default: "unknown",
      trim:    true,
    },

    // The exact timestamp of this click.
    // We use `createdAt` from the timestamps option below for this,
    // but having it as an explicit indexed field lets us do fast
    // date-range queries (e.g. "clicks in the last 7 days").
    clickedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields.
    // `createdAt` doubles as the precise click timestamp.
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// We query clicks by:
//   1. url        — to fetch all clicks for a specific short URL
//   2. clickedAt  — to filter by date range (last 7 days chart)
// Compound index on (url + clickedAt) covers both use-cases
// with a single index and keeps analytics queries fast.
// ============================================================

clickSchema.index({ url: 1, clickedAt: -1 }); // -1 = descending (newest first)

// ============================================================
// EXPORT the model
// Creates the "clicks" collection in MongoDB automatically.
// ============================================================

module.exports = mongoose.model("Click", clickSchema);