// ============================================================
// backend/routes/analytics.js
// Provides analytics data for a specific short URL.
// All routes are protected — only the URL owner can view data.
//
// GET /api/analytics/:shortCode        — full analytics summary
// GET /api/analytics/:shortCode/clicks — paginated click history
// ============================================================

const express = require("express");
const Url     = require("../models/Url");
const Click   = require("../models/Click");
const protect = require("../middleware/auth");

const router = express.Router();

// All analytics routes require a valid JWT
router.use(protect);

// ============================================================
// HELPER — getLast7Days
// Returns an array of the last 7 date strings in "YYYY-MM-DD"
// format, starting from 6 days ago up to today (inclusive).
// Used to build the labels for the daily clicks line chart.
// Example output: ["2024-01-01", "2024-01-02", ..., "2024-01-07"]
// ============================================================

const getLast7Days = () => {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    // Go back i days from today
    date.setDate(date.getDate() - i);
    // Format as YYYY-MM-DD using local date parts
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const dd   = String(date.getDate()).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
  }

  return days; // ["2024-01-01", ..., "2024-01-07"]
};

// ============================================================
// GET /api/analytics/:shortCode
// Returns a complete analytics summary for one short URL:
//  - URL metadata (originalUrl, shortCode, createdAt, expiresAt)
//  - totalClicks (all time)
//  - lastClickedAt
//  - dailyClicks: array of { date, clicks } for last 7 days
//  - recentClicks: last 10 individual click events
// ============================================================

router.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    // ── Find the URL and verify ownership ──────────────────
    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ message: "Short URL not found." });
    }

    // Make sure the logged-in user owns this URL
    if (urlDoc.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You do not own this short URL.",
      });
    }

    // ── Build date range for the last 7 days ───────────────
    const last7Days  = getLast7Days(); // ["2024-01-01", ..., "2024-01-07"]

    // Start of the first day (midnight) — for our DB query filter
    const rangeStart = new Date(last7Days[0]);
    rangeStart.setHours(0, 0, 0, 0);

    // End of today (just before midnight tomorrow)
    const rangeEnd = new Date();
    rangeEnd.setHours(23, 59, 59, 999);

    // ── Aggregate daily click counts for last 7 days ───────
    // MongoDB aggregation pipeline:
    //  1. $match   — only clicks for this URL within date range
    //  2. $group   — group by date string, count documents per group
    //  3. $sort    — sort by date ascending
    const dailyAggregation = await Click.aggregate([
      {
        $match: {
          url:       urlDoc._id,
          clickedAt: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          // _id becomes the date string "YYYY-MM-DD"
          // We use $dateToString to convert the Date object to a string
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date:   "$clickedAt",
            },
          },
          clicks: { $sum: 1 }, // count of clicks on that date
        },
      },
      {
        $sort: { _id: 1 }, // ascending date order for the chart
      },
    ]);

    // Convert aggregation result into a lookup map { "2024-01-03": 5, ... }
    const clicksByDate = {};
    dailyAggregation.forEach((entry) => {
      clicksByDate[entry._id] = entry.clicks;
    });

    // Build the final dailyClicks array, filling in 0 for days with no clicks
    // This ensures the chart always has exactly 7 data points
    const dailyClicks = last7Days.map((date) => ({
      date,
      clicks: clicksByDate[date] || 0,
    }));

    // ── Fetch the 10 most recent individual click events ───
    const recentClicks = await Click.find({ url: urlDoc._id })
      .sort({ clickedAt: -1 })  // newest first
      .limit(10)
      .select("clickedAt ipAddress userAgent -_id") // only return needed fields
      .lean();

    // ── Build and return the analytics response ────────────
    return res.status(200).json({
      analytics: {
        // URL metadata
        shortCode:    urlDoc.shortCode,
        originalUrl:  urlDoc.originalUrl,
        title:        urlDoc.title,
        createdAt:    urlDoc.createdAt,
        expiresAt:    urlDoc.expiresAt,
        shortUrl:     `${process.env.BASE_URL || "http://localhost:5000"}/${urlDoc.shortCode}`,

        // Aggregate stats
        totalClicks:   urlDoc.totalClicks,
        lastClickedAt: urlDoc.lastClickedAt,

        // Chart data — array of 7 objects [{ date, clicks }, ...]
        dailyClicks,

        // Recent visit history — array of up to 10 click objects
        recentClicks,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error.message);
    return res.status(500).json({ message: "Server error fetching analytics." });
  }
});

// ============================================================
// GET /api/analytics/:shortCode/clicks
// Returns a paginated list of ALL click events for a URL.
// Query params:
//   page  — page number (default: 1)
//   limit — items per page (default: 20, max: 100)
// ============================================================

router.get("/:shortCode/clicks", async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Parse and clamp pagination parameters
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    // ── Find the URL and verify ownership ──────────────────
    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ message: "Short URL not found." });
    }

    if (urlDoc.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You do not own this short URL.",
      });
    }

    // ── Fetch paginated clicks ──────────────────────────────
    const [clicks, totalCount] = await Promise.all([
      Click.find({ url: urlDoc._id })
        .sort({ clickedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("clickedAt ipAddress userAgent -_id")
        .lean(),
      Click.countDocuments({ url: urlDoc._id }),
    ]);

    return res.status(200).json({
      clicks,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Paginated clicks error:", error.message);
    return res.status(500).json({ message: "Server error fetching click history." });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;