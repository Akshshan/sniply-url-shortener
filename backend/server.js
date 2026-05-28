// ============================================================
// backend/server.js
// Entry point for the Express server.
// Sets up middleware, connects to MongoDB, and mounts routes.
// ============================================================

// Load environment variables from .env file FIRST
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ── Import route handlers ────────────────────────────────────
const authRoutes      = require("./routes/auth");
const urlRoutes       = require("./routes/url");
const analyticsRoutes = require("./routes/analytics");

// ── Import the Url model (needed for the redirect endpoint) ──
const Url   = require("./models/Url");
const Click = require("./models/Click");

// ── Create Express app ───────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

// Allow requests from the React frontend (CORS)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// ============================================================
// DATABASE CONNECTION
// ============================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅  MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails — app cannot work without it
  });

// ============================================================
// API ROUTES
// All API routes are prefixed with /api/
// ============================================================

app.use("/api/auth",      authRoutes);       // /api/auth/signup, /api/auth/login
app.use("/api/urls",      urlRoutes);        // /api/urls/  (create, list, delete)
app.use("/api/analytics", analyticsRoutes);  // /api/analytics/:shortCode

// ============================================================
// REDIRECT ROUTE  (must come AFTER /api routes)
// When someone visits  http://localhost:5000/:shortCode
// the server looks up the original URL and redirects them.
// ============================================================

app.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    // 1. Find the URL document in MongoDB
    const urlDoc = await Url.findOne({ shortCode });

    // 2. If not found → 404
    if (!urlDoc) {
      return res.status(404).json({ message: "Short URL not found." });
    }

    // 3. If an expiry date was set and it has passed → 410 Gone
    if (urlDoc.expiresAt && new Date() > new Date(urlDoc.expiresAt)) {
      return res
        .status(410)
        .json({ message: "This link has expired and is no longer active." });
    }

    // 4. Record a click event in the Click collection
    //    We store IP address and user-agent for analytics.
    await Click.create({
      url:       urlDoc._id,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // 5. Increment the totalClicks counter on the URL document
    urlDoc.totalClicks += 1;
    await urlDoc.save();

    // 6. Perform the actual HTTP redirect to the original long URL
    return res.redirect(urlDoc.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error.message);
    return res.status(500).json({ message: "Server error during redirect." });
  }
});

// ============================================================
// GLOBAL ERROR HANDLER (catch-all)
// ============================================================

app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
});