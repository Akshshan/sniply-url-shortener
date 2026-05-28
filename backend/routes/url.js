// ============================================================
// backend/routes/url.js
// All URL shortening CRUD operations (protected routes).
// POST   /api/urls/        — create a new short URL
// GET    /api/urls/        — get all URLs for logged-in user
// DELETE /api/urls/:id     — delete a URL by its MongoDB _id
// GET    /api/urls/:id/qr  — generate a QR code for a short URL
// ============================================================

const express  = require("express");
const QRCode   = require("qrcode");
const { nanoid } = require("nanoid");
const Url      = require("../models/Url");
const Click    = require("../models/Click");
const protect  = require("../middleware/auth");

const router = express.Router();

// All routes in this file require a valid JWT
router.use(protect);

// ============================================================
// HELPER — isValidUrl
// A simple URL validator using the built-in URL constructor.
// Returns true if the string is a well-formed http/https URL.
// ============================================================

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    // Only allow http and https — no javascript:, ftp:, etc.
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// ============================================================
// POST /api/urls/
// Creates a new short URL for the logged-in user.
// Body: {
//   originalUrl  : string  (required)
//   customAlias  : string  (optional — user-defined short code)
//   expiresAt    : string  (optional — ISO date string)
//   title        : string  (optional — friendly label)
// }
// ============================================================

router.post("/", async (req, res) => {
  try {
    let { originalUrl, customAlias, expiresAt, title } = req.body;

    // ── Validate originalUrl ────────────────────────────────
    if (!originalUrl) {
      return res.status(400).json({ message: "Original URL is required." });
    }

    // Automatically prepend https:// if the user forgot the protocol
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = "https://" + originalUrl;
    }

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({
        message: "Please provide a valid URL (must start with http:// or https://).",
      });
    }

    // ── Validate customAlias if provided ────────────────────
    if (customAlias) {
      // Trim whitespace
      customAlias = customAlias.trim();

      // Only allow alphanumeric characters, hyphens, and underscores
      const aliasRegex = /^[a-zA-Z0-9_-]+$/;
      if (!aliasRegex.test(customAlias)) {
        return res.status(400).json({
          message:
            "Custom alias can only contain letters, numbers, hyphens, and underscores.",
        });
      }

      if (customAlias.length < 3 || customAlias.length > 30) {
        return res.status(400).json({
          message: "Custom alias must be between 3 and 30 characters.",
        });
      }

      // Check if the alias is already taken
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(409).json({
          message: `The alias "${customAlias}" is already taken. Please choose another.`,
        });
      }
    }

    // ── Validate expiresAt if provided ──────────────────────
    if (expiresAt) {
      const expiry = new Date(expiresAt);

      // Check it's a real date
      if (isNaN(expiry.getTime())) {
        return res.status(400).json({
          message: "Invalid expiry date format.",
        });
      }

      // Expiry must be in the future
      if (expiry <= new Date()) {
        return res.status(400).json({
          message: "Expiry date must be in the future.",
        });
      }
    }

    // ── Auto-generate title from hostname if not provided ───
    if (!title) {
      try {
        title = new URL(originalUrl).hostname.replace("www.", "");
      } catch {
        title = originalUrl;
      }
    }

    // ── Create the URL document ─────────────────────────────
    // If customAlias is provided it becomes the shortCode.
    // If not, the pre-validate hook in Url.js generates one via nanoid.
    const urlDoc = await Url.create({
      originalUrl,
      shortCode: customAlias || undefined, // undefined triggers nanoid fallback
      user:      req.user.id,
      title,
      expiresAt: expiresAt || null,
    });

    return res.status(201).json({
      message: "Short URL created successfully!",
      url:     urlDoc,
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (race condition on shortCode)
    if (error.code === 11000) {
      return res.status(409).json({
        message: "That short code is already in use. Please try a different alias.",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(" ") });
    }

    console.error("Create URL error:", error.message);
    return res.status(500).json({ message: "Server error creating short URL." });
  }
});

// ============================================================
// GET /api/urls/
// Returns all short URLs created by the logged-in user,
// sorted by newest first.
// ============================================================

router.get("/", async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // newest URLs appear first
      .lean();                  // .lean() returns plain JS objects (faster)

    // Manually attach the shortUrl virtual since .lean() skips virtuals
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
    const urlsWithShortUrl = urls.map((u) => ({
      ...u,
      shortUrl: `${BASE_URL}/${u.shortCode}`,
    }));

    return res.status(200).json({ urls: urlsWithShortUrl });
  } catch (error) {
    console.error("Fetch URLs error:", error.message);
    return res.status(500).json({ message: "Server error fetching your URLs." });
  }
});

// ============================================================
// DELETE /api/urls/:id
// Deletes a short URL and all its associated Click records.
// Only the owner of the URL can delete it.
// ============================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the URL and make sure it belongs to the logged-in user
    const urlDoc = await Url.findOne({ _id: id, user: req.user.id });

    if (!urlDoc) {
      return res.status(404).json({
        message: "URL not found or you do not have permission to delete it.",
      });
    }

    // Delete all Click records associated with this URL
    await Click.deleteMany({ url: id });

    // Delete the URL document itself
    await Url.findByIdAndDelete(id);

    return res.status(200).json({ message: "Short URL deleted successfully." });
  } catch (error) {
    console.error("Delete URL error:", error.message);
    return res.status(500).json({ message: "Server error deleting URL." });
  }
});

// ============================================================
// GET /api/urls/:id/qr
// Generates a QR code PNG (as a base64 data URL) for the
// short URL identified by its MongoDB _id.
// Returns: { qrCode: "data:image/png;base64,..." }
// ============================================================

router.get("/:id/qr", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the URL — must belong to the logged-in user
    const urlDoc = await Url.findOne({ _id: id, user: req.user.id });

    if (!urlDoc) {
      return res.status(404).json({
        message: "URL not found or you do not have permission to access it.",
      });
    }

    // Build the full short URL string
    const BASE_URL  = process.env.BASE_URL || "http://localhost:5000";
    const shortUrl  = `${BASE_URL}/${urlDoc.shortCode}`;

    // Generate QR code as a base64-encoded PNG data URL
    // Options: high error correction, 300x300px, white background
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
      errorCorrectionLevel: "H",   // High — survives up to 30% damage
      width:                300,
      margin:               2,
      color: {
        dark:  "#000000",           // black modules
        light: "#ffffff",           // white background
      },
    });

    return res.status(200).json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error("QR code generation error:", error.message);
    return res.status(500).json({ message: "Server error generating QR code." });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;