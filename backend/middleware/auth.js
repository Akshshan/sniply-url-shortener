// ============================================================
// backend/middleware/auth.js
// Express middleware that protects private API routes.
// It reads the JWT from the Authorization header, verifies it,
// and attaches the decoded user payload to req.user so that
// downstream route handlers know WHO is making the request.
//
// Usage in a route file:
//   const protect = require("../middleware/auth");
//   router.get("/protected", protect, (req, res) => { ... });
// ============================================================

const jwt = require("jsonwebtoken");

// ── The middleware function ──────────────────────────────────
const protect = (req, res, next) => {
  try {
    // ── STEP 1: Read the Authorization header ──────────────
    // Expected format:  "Bearer <token>"
    // Example:          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided at all — reject immediately
      return res.status(401).json({
        message: "Access denied. No token provided. Please log in.",
      });
    }

    // ── STEP 2: Extract the token string ───────────────────
    // Split "Bearer <token>" on the space and take the second part
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Malformed token. Please log in again.",
      });
    }

    // ── STEP 3: Verify the token ───────────────────────────
    // jwt.verify() will:
    //   a) Check the signature using our JWT_SECRET
    //   b) Check the expiry date (exp claim)
    //   c) Return the decoded payload if everything is valid
    //   d) Throw an error if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── STEP 4: Attach the decoded payload to the request ──
    // `decoded` contains whatever we put in the payload when
    // we signed the token in routes/auth.js, e.g.:
    //   { id: "64abc...", name: "Alice", email: "alice@..." }
    //
    // Downstream handlers can now do:  req.user.id
    req.user = decoded;

    // ── STEP 5: Pass control to the next handler ───────────
    next();
  } catch (error) {
    // jwt.verify() threw — token is invalid, expired, or tampered
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token. Please log in again.",
      });
    }

    // Catch-all for any other unexpected errors
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({
      message: "Authentication error. Please try again.",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = protect;