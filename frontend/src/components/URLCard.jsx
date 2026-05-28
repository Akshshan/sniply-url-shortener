// ============================================================
// frontend/src/components/URLCard.jsx
// A single card representing one shortened URL in the dashboard.
// Features:
//   - Display original URL, short URL, title, date, click count
//   - Copy short URL to clipboard
//   - View analytics (navigates to /analytics/:shortCode)
//   - Generate & display QR code in a modal
//   - Delete with confirmation prompt
//   - Expired link badge
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// ============================================================
// HELPER — truncateUrl
// Shortens a long URL for display purposes only.
// e.g. "https://example.com/very/long/path" → "example.com/very/lon..."
// ============================================================

const truncateUrl = (url, maxLength = 55) => {
  try {
    // Remove the protocol for cleaner display
    const clean = url.replace(/^https?:\/\//, "");
    return clean.length > maxLength
      ? clean.substring(0, maxLength) + "..."
      : clean;
  } catch {
    return url;
  }
};

// ============================================================
// HELPER — formatDate
// Converts ISO date string to readable format.
// e.g. "2024-01-15T10:30:00.000Z" → "Jan 15, 2024"
// ============================================================

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
};

// ============================================================
// QR CODE MODAL
// Shown when the user clicks the QR button on a URLCard.
// Fetches the QR code from the backend and displays it.
// ============================================================

const QRModal = ({ urlDoc, onClose }) => {
  const [qrCode,  setQrCode]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Fetch QR code on mount
  useState(() => {
    const fetchQR = async () => {
      try {
        const res = await api.get(`/api/urls/${urlDoc._id}/qr`);
        setQrCode(res.data.qrCode);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to generate QR code."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [urlDoc._id]);

  // ── Download QR code as PNG ─────────────────────────────────
  const handleDownload = () => {
    if (!qrCode) return;
    const link    = document.createElement("a");
    link.href     = qrCode;
    link.download = `qr-${urlDoc.shortCode}.png`;
    link.click();
  };

  const BASE_URL  = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const shortUrl  = `${BASE_URL}/${urlDoc.shortCode}`;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
        bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full
          max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">QR Code</h3>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{shortUrl}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-white
              hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR code display area */}
        <div className="flex items-center justify-center bg-white rounded-xl
          p-4 mb-5 min-h-[220px]">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent
                rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Generating QR code...</p>
            </div>
          )}
          {error && (
            <div className="text-center">
              <svg className="w-10 h-10 text-red-400 mx-auto mb-2" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {qrCode && !loading && (
            <img
              src={qrCode}
              alt={`QR code for ${shortUrl}`}
              className="w-48 h-48 object-contain"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!qrCode || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5
              bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700
              disabled:cursor-not-allowed text-white text-sm font-medium
              rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300
              text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DELETE CONFIRMATION MODAL
// Shown when user clicks the delete button.
// Requires explicit confirmation before deleting.
// ============================================================

const DeleteModal = ({ urlDoc, onConfirm, onClose, deleting }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/70 backdrop-blur-sm px-4"
    onClick={onClose}
  >
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full
        max-w-sm shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Warning icon */}
      <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center
        justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>

      <h3 className="text-white font-semibold text-center mb-1">Delete this link?</h3>
      <p className="text-gray-400 text-sm text-center mb-1">
        This will permanently delete:
      </p>
      <p className="text-violet-400 font-mono text-sm text-center mb-1 truncate px-2">
        /{urlDoc.shortCode}
      </p>
      <p className="text-gray-500 text-xs text-center mb-6">
        All click analytics will also be deleted. This cannot be undone.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={deleting}
          className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700
            disabled:opacity-50 text-gray-300 text-sm font-medium
            rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-500
            disabled:bg-red-800 disabled:cursor-not-allowed
            text-white text-sm font-medium rounded-xl transition-colors
            flex items-center justify-center gap-2"
        >
          {deleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent
                rounded-full animate-spin" />
              Deleting...
            </>
          ) : (
            "Yes, delete"
          )}
        </button>
      </div>
    </div>
  </div>
);

// ============================================================
// URLCard — Main exported component
// Props:
//   url         — the URL document from MongoDB
//   onDelete    — callback fn(id) called after deletion
//   onShowToast — callback fn(message) to show a toast
// ============================================================

const URLCard = ({ url, onDelete, onShowToast }) => {
  const navigate = useNavigate();

  // ── Local UI state ─────────────────────────────────────────
  const [copied,      setCopied]      = useState(false);
  const [showQR,      setShowQR]      = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // ── Is this URL expired? ───────────────────────────────────
  const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();

  // ── Construct the full short URL ───────────────────────────
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const shortUrl = url.shortUrl || `${BASE_URL}/${url.shortCode}`;

  // ============================================================
  // COPY SHORT URL TO CLIPBOARD
  // ============================================================

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      onShowToast?.("Short URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support Clipboard API
      const el      = document.createElement("textarea");
      el.value      = shortUrl;
      el.style.position = "fixed";
      el.style.opacity  = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      onShowToast?.("Short URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ============================================================
  // DELETE URL
  // ============================================================

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(url._id);
      setShowDelete(false);
    } catch {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ── QR Code Modal ──────────────────────────────────── */}
      {showQR && (
        <QRModal urlDoc={url} onClose={() => setShowQR(false)} />
      )}

      {/* ── Delete Confirmation Modal ───────────────────────── */}
      {showDelete && (
        <DeleteModal
          urlDoc={url}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          deleting={deleting}
        />
      )}

      {/* ── Card ───────────────────────────────────────────── */}
      <div className={`bg-gray-900 border rounded-2xl p-5 transition-all duration-200
        hover:border-gray-700 group ${
          isExpired
            ? "border-gray-800 opacity-75"
            : "border-gray-800"
        }`}>

        <div className="flex items-start gap-4">

          {/* ── Favicon / icon ─────────────────────────────── */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            flex-shrink-0 ${isExpired ? "bg-gray-800" : "bg-violet-500/10"}`}>
            {isExpired ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>

          {/* ── Main content ───────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-medium text-sm truncate">
                {url.title || url.shortCode}
              </h3>

              {/* Expired badge */}
              {isExpired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5
                  bg-red-500/10 text-red-400 text-xs rounded-full border
                  border-red-500/20 flex-shrink-0">
                  <span className="w-1 h-1 rounded-full bg-red-400" />
                  Expired
                </span>
              )}

              {/* Expiry warning — expires within 7 days */}
              {!isExpired && url.expiresAt && (
                (() => {
                  const daysLeft = Math.ceil(
                    (new Date(url.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  return daysLeft <= 7 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5
                      bg-orange-500/10 text-orange-400 text-xs rounded-full border
                      border-orange-500/20 flex-shrink-0">
                      Expires in {daysLeft}d
                    </span>
                  ) : null;
                })()
              )}
            </div>

            {/* Short URL */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <a
                href={isExpired ? undefined : shortUrl}
                target={isExpired ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={`font-mono text-sm font-medium transition-colors ${
                  isExpired
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-violet-400 hover:text-violet-300"
                }`}
                onClick={isExpired ? (e) => e.preventDefault() : undefined}
              >
                {shortUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>

            {/* Original URL */}
            <p className="text-gray-500 text-xs truncate mb-3"
              title={url.originalUrl}>
              {truncateUrl(url.originalUrl)}
            </p>

            {/* Meta row — clicks + date + expiry */}
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              {/* Click count */}
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <span className="text-gray-300 font-medium">
                  {url.totalClicks.toLocaleString()}
                </span>{" "}
                {url.totalClicks === 1 ? "click" : "clicks"}
              </span>

              {/* Dot separator */}
              <span className="text-gray-700">·</span>

              {/* Created date */}
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(url.createdAt)}
              </span>

              {/* Expiry date if set */}
              {url.expiresAt && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className={`flex items-center gap-1.5 ${
                    isExpired ? "text-red-500" : "text-gray-500"
                  }`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isExpired ? "Expired " : "Expires "}
                    {formatDate(url.expiresAt)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Action buttons ──────────────────────────────── */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">

            {/* Copy button */}
            <button
              onClick={handleCopy}
              title="Copy short URL"
              className="p-2 rounded-xl text-gray-500 hover:text-white
                hover:bg-gray-800 transition-all duration-200"
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

            {/* QR code button */}
            <button
              onClick={() => setShowQR(true)}
              title="Show QR code"
              className="p-2 rounded-xl text-gray-500 hover:text-white
                hover:bg-gray-800 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>

            {/* Analytics button */}
            <button
              onClick={() => navigate(`/analytics/${url.shortCode}`)}
              title="View analytics"
              className="p-2 rounded-xl text-gray-500 hover:text-white
                hover:bg-gray-800 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            {/* Delete button */}
            <button
              onClick={() => setShowDelete(true)}
              title="Delete this link"
              className="p-2 rounded-xl text-gray-500 hover:text-red-400
                hover:bg-red-500/10 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default URLCard;