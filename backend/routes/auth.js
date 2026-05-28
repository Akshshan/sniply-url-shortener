// ============================================================
// backend/routes/auth.js
// Handles user registration (signup) and login.
// POST /api/auth/signup  — create a new account
// POST /api/auth/login   — authenticate and receive a JWT
// GET  /api/auth/me      — get the logged-in user's profile
// ============================================================

const express = require("express");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

// ============================================================
// HELPER — signToken
// Centralises JWT creation so both signup and login use
// the exact same token structure and expiry.
// ============================================================

const signToken = (user) => {
  return jwt.sign(
    {
      // Payload — data encoded inside the token
      // Keep it minimal: only what we need in req.user
      id:    user._id,
      name:  user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,       // secret key from .env
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d", // token valid for 7 days
    }
  );
};

// ============================================================
// POST /api/auth/signup
// Creates a new user account.
// Body: { name, email, password }
// ============================================================

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Input validation ────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required: name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    // ── Check for duplicate email ───────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    // ── Create the user ─────────────────────────────────────
    // The pre-save hook in User.js will hash the password
    // automatically before it reaches MongoDB.
    const user = await User.create({ name, email, password });

    // ── Issue a JWT ─────────────────────────────────────────
    const token = signToken(user);

    // ── Respond with token + safe user data ─────────────────
    // We never send the password field back to the client
    return res.status(201).json({
      message: "Account created successfully. Welcome!",
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Mongoose validation errors (e.g. invalid email format)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(" ") });
    }

    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Server error during signup. Please try again." });
  }
});

// ============================================================
// POST /api/auth/login
// Authenticates an existing user and returns a JWT.
// Body: { email, password }
// ============================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Input validation ────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        message: "Both email and password are required.",
      });
    }

    // ── Find the user by email ──────────────────────────────
    // We use .select("+password") because in production schemas
    // you'd often set `select: false` on password — this is
    // defensive practice even though we haven't done so here.
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Use a generic message — don't reveal whether the email exists
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // ── Compare submitted password against the stored hash ──
    // comparePassword is the instance method defined in User.js
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // ── Issue a JWT ─────────────────────────────────────────
    const token = signToken(user);

    // ── Respond ─────────────────────────────────────────────
    return res.status(200).json({
      message: "Logged in successfully. Welcome back!",
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login. Please try again." });
  }
});

// ============================================================
// GET /api/auth/me
// Returns the profile of the currently logged-in user.
// Requires a valid JWT in the Authorization header.
// Used by the frontend AuthContext on page refresh to
// re-hydrate the logged-in user state.
// ============================================================

router.get("/me", protect, async (req, res) => {
  try {
    // req.user is set by the protect middleware
    // We fetch fresh data from DB in case name/email was updated
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ message: "Server error fetching profile." });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;