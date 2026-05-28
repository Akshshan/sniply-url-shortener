// ============================================================
// frontend/src/pages/Analytics.jsx
// Detailed analytics page for a single short URL.
// Accessed via /analytics/:shortCode
// Shows: summary stats, 7-day line chart, recent click history
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import ClickChart from "../components/ClickChart";

// ============================================================
// HELPER — formatDate
// Formats a Date string into a human-readable form.
// e.g. "2024-01-15T10:30:00.000Z" → "Jan 15, 2024, 10:30 AM"
// ============================================================

const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ============================================================
// HELPER — formatDateShort
// Compact date for the click history table rows.
// e.g. "Jan 15, 2024"
// ============================================================

const formatDateShort = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ============================================================
// HELPER — parseUserAgent
// Extracts a readable browser/OS label from a User-Agent string.
// Very lightweight — covers the most common cases.
// ============================================================

const parseUserAgent = (ua) => {
  if (!ua || ua === "unknown") return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg"))  return "Chrome";
  if (ua.includes("Firefox"))                         return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg"))                             return "Edge";
  if (ua.includes("curl"))                            return "cURL";
  if (ua.includes("Postman"))                         return "Postman";
  return "Other";
};

// ============================================================
// STAT CARD — reusable mini component for the 4 summary cards
// ============================================================

const StatCard = ({ label, value, icon, color, bg, sub }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
    </div>
    <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const Analytics = () => {
  const { shortCode } = useParams();   // from /analytics/:shortCode
  const navigate      = useNavigate();

  // ── Data state ─────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // ── Copy state ─────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ============================================================
  // FETCH ANALYTICS DATA
  // ============================================================

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/analytics/${shortCode}`);
        setAnalytics(res.data.analytics);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Short URL not found.");
        } else if (err.response?.status === 403) {
          setError("You do not have permission to view this URL's analytics.");
        } else {
          setError(
            err.response?.data?.message ||
            "Failed to load analytics. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (shortCode) fetchAnalytics();
  }, [shortCode]);

  // ============================================================
  // COPY SHORT URL TO CLIPBOARD
  // ============================================================

  const handleCopy = async () => {
    if (!analytics?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(analytics.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = analytics.shortUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Is the URL expired? ────────────────────────────────────
  const isExpired = analytics?.expiresAt &&
    new Date(analytics.expiresAt) < new Date();

  // ============================================================
  // RENDER — Loading skeleton
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button skeleton */}
          <div className="w-24 h-8 bg-gray-900 rounded-xl animate-pulse mb-6" />
          {/* Header skeleton */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-800 rounded w-1/4" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-800 rounded-xl mb-3" />
                <div className="h-8 bg-gray-800 rounded w-16 mb-1" />
                <div className="h-4 bg-gray-800 rounded w-24" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
            <div className="h-5 bg-gray-800 rounded w-40 mb-6" />
            <div className="h-64 bg-gray-800 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // RENDER — Error state
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-10 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-white font-semibold text-lg mb-2">Oops!</h2>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800
                hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // RENDER — Main analytics view
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Back button ──────────────────────────────────── */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white
            text-sm transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        {/* ── URL header card ───────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title + status badge */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-xl font-bold text-white truncate">
                  {analytics.title || analytics.shortCode}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isExpired
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isExpired ? "bg-red-400" : "bg-emerald-400"
                  }`} />
                  {isExpired ? "Expired" : "Active"}
                </span>
              </div>

              {/* Short URL */}
              <div className="flex items-center gap-2 mb-3">
                <a
                  href={analytics.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 font-mono text-sm
                    transition-colors truncate"
                >
                  {analytics.shortUrl}
                </a>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-800
                    text-gray-500 hover:text-gray-300 transition-all"
                  title="Copy short URL"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Original URL */}
              <p className="text-gray-500 text-sm truncate" title={analytics.originalUrl}>
                <span className="text-gray-600">→ </span>
                {analytics.originalUrl}
              </p>
            </div>

            {/* Meta info */}
            <div className="flex-shrink-0 text-right space-y-1">
              <p className="text-xs text-gray-500">
                Created{" "}
                <span className="text-gray-400">
                  {formatDate(analytics.createdAt)}
                </span>
              </p>
              {analytics.expiresAt && (
                <p className="text-xs text-gray-500">
                  {isExpired ? "Expired" : "Expires"}{" "}
                  <span className={isExpired ? "text-red-400" : "text-gray-400"}>
                    {formatDate(analytics.expiresAt)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Clicks"
            value={analytics.totalClicks.toLocaleString()}
            bg="bg-violet-500/10"
            color="text-violet-400"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            }
          />
          <StatCard
            label="Clicks (Last 7 Days)"
            value={analytics.dailyClicks
              .reduce((sum, d) => sum + d.clicks, 0)
              .toLocaleString()}
            bg="bg-sky-500/10"
            color="text-sky-400"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            }
          />
          <StatCard
            label="Last Clicked"
            value={analytics.lastClickedAt
              ? new Date(analytics.lastClickedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                })
              : "Never"}
            sub={analytics.lastClickedAt
              ? new Date(analytics.lastClickedAt).toLocaleTimeString("en-US", {
                  hour: "numeric", minute: "2-digit", hour12: true,
                })
              : undefined}
            bg="bg-emerald-500/10"
            color="text-emerald-400"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          />
          <StatCard
            label="Avg. Clicks / Day"
            value={
              analytics.dailyClicks.length > 0
                ? (
                    analytics.dailyClicks.reduce((s, d) => s + d.clicks, 0) /
                    analytics.dailyClicks.length
                  ).toFixed(1)
                : "0"
            }
            bg="bg-orange-500/10"
            color="text-orange-400"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            }
          />
        </div>

        {/* ── Line chart — daily clicks ─────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold">Click Activity</h2>
              <p className="text-gray-500 text-xs mt-0.5">Clicks per day over the last 7 days</p>
            </div>
            <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1.5 rounded-lg">
              Last 7 days
            </span>
          </div>
          {/* ClickChart component renders the Recharts line chart */}
          <ClickChart data={analytics.dailyClicks} />
        </div>

        {/* ── Recent click history table ────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">Recent Visits</h2>
              <p className="text-gray-500 text-xs mt-0.5">Last 10 click events</p>
            </div>
            <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1.5 rounded-lg">
              {analytics.recentClicks.length} records
            </span>
          </div>

          {analytics.recentClicks.length === 0 ? (
            /* Empty state */
            <div className="px-6 py-12 text-center">
              <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              <p className="text-gray-500 text-sm">No visits recorded yet.</p>
              <p className="text-gray-600 text-xs mt-1">
                Share your link to start seeing click data here.
              </p>
            </div>
          ) : (
            /* Click history table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Browser
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {analytics.recentClicks.map((click, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Row number */}
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-xs">
                          {formatDateShort(click.clickedAt)}
                        </span>
                      </td>

                      {/* Browser derived from user-agent */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1
                          bg-gray-800 text-gray-300 text-xs rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          {parseUserAgent(click.userAgent)}
                        </span>
                      </td>

                      {/* IP address — masked for privacy */}
                      <td className="px-6 py-4">
                        <span className="text-gray-500 font-mono text-xs">
                          {click.ipAddress === "unknown"
                            ? "—"
                            : click.ipAddress.split(".").length === 4
                              /* Mask last octet of IPv4 for privacy */
                              ? click.ipAddress.replace(/\.\d+$/, ".***")
                              : click.ipAddress.substring(0, 8) + "..."
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;