// ============================================================
// frontend/src/pages/Dashboard.jsx
// Main dashboard — shows all the user's short URLs and a form
// to create new ones. Features:
//   - Create short URL (with optional alias, expiry, title)
//   - List all URLs with copy, QR, analytics, delete actions
//   - Real-time search/filter across the URL list
//   - Loading, empty, and error states
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import URLCard from "../components/URLCard";

const Dashboard = () => {
  const { user } = useAuth();

  // ── URL list state ─────────────────────────────────────────
  const [urls, setUrls]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError]     = useState("");

  // ── Search state ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Create form state ──────────────────────────────────────
  const [formOpen, setFormOpen]   = useState(false);
  const [formData, setFormData]   = useState({
    originalUrl:  "",
    customAlias:  "",
    expiresAt:    "",
    title:        "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Success toast state ────────────────────────────────────
  const [toast, setToast] = useState({ show: false, message: "" });

  // ============================================================
  // FETCH ALL URLs for the logged-in user
  // ============================================================

  const fetchUrls = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await api.get("/api/urls/");
      setUrls(res.data.urls);
      setFiltered(res.data.urls);
    } catch (err) {
      setListError(
        err.response?.data?.message || "Failed to load your URLs. Please refresh."
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // ============================================================
  // SEARCH / FILTER
  // Filters the URL list by original URL, short code, or title
  // whenever the search query or URL list changes.
  // ============================================================

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(urls);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      urls.filter(
        (u) =>
          u.originalUrl.toLowerCase().includes(q) ||
          u.shortCode.toLowerCase().includes(q) ||
          (u.title && u.title.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, urls]);

  // ============================================================
  // SHOW TOAST NOTIFICATION
  // Auto-dismisses after 3 seconds.
  // ============================================================

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formError)   setFormError("");
    if (formSuccess) setFormSuccess("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.originalUrl.trim()) {
      errors.originalUrl = "Please enter a URL to shorten.";
    }
    if (formData.customAlias && !/^[a-zA-Z0-9_-]+$/.test(formData.customAlias)) {
      errors.customAlias =
        "Alias can only contain letters, numbers, hyphens, and underscores.";
    }
    if (formData.customAlias && (formData.customAlias.length < 3 || formData.customAlias.length > 30)) {
      errors.customAlias = "Alias must be between 3 and 30 characters.";
    }
    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      errors.expiresAt = "Expiry date must be in the future.";
    }
    return errors;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const payload = {
        originalUrl: formData.originalUrl.trim(),
        ...(formData.customAlias && { customAlias: formData.customAlias.trim() }),
        ...(formData.expiresAt   && { expiresAt: formData.expiresAt }),
        ...(formData.title       && { title: formData.title.trim() }),
      };

      await api.post("/api/urls/", payload);

      // Reset form
      setFormData({ originalUrl: "", customAlias: "", expiresAt: "", title: "" });
      setFormSuccess("Short URL created successfully!");
      setFormOpen(false);

      // Refresh the URL list
      await fetchUrls();
      showToast("🎉 Short URL created successfully!");
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to create short URL. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic UI update — remove from list immediately
    setUrls((prev) => prev.filter((u) => u._id !== id));
    try {
      await api.delete(`/api/urls/${id}`);
      showToast("URL deleted successfully.");
    } catch (err) {
      // Rollback on failure
      fetchUrls();
      showToast("Failed to delete URL. Please try again.");
    }
  };

  // ── Minimum expiry date for the date input (today) ─────────
  const minDate = new Date().toISOString().split("T")[0];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* ── Toast notification ─────────────────────────────── */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          toast.show
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-gray-800 border border-gray-700 text-white text-sm
          rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
          <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage and track all your shortened links in one place.
          </p>
        </div>

        {/* ── Stats bar ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Links",
              value: urls.length,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              ),
              color: "text-violet-400",
              bg: "bg-violet-500/10",
            },
            {
              label: "Total Clicks",
              value: urls.reduce((sum, u) => sum + (u.totalClicks || 0), 0),
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              ),
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Active Links",
              value: urls.filter(
                (u) => !u.expiresAt || new Date(u.expiresAt) > new Date()
              ).length,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
              color: "text-sky-400",
              bg: "bg-sky-500/10",
            },
          ].map((stat) => (
            <div key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-5 h-5 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {stat.icon}
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Create URL section ───────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl mb-8 overflow-hidden">

          {/* Accordion header */}
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4
              hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-white font-semibold">Shorten a new URL</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${formOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible form */}
          {formOpen && (
            <div className="px-6 pb-6 border-t border-gray-800">
              <form onSubmit={handleCreate} noValidate className="mt-5 space-y-4">

                {/* Error / success banners */}
                {formError && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30
                    text-red-400 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formError}
                  </div>
                )}

                {/* ── Original URL (required) ──────────── */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Destination URL <span className="text-violet-400">*</span>
                  </label>
                  <input
                    name="originalUrl"
                    type="url"
                    value={formData.originalUrl}
                    onChange={handleFormChange}
                    placeholder="https://example.com/very/long/url"
                    disabled={formLoading}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white
                      placeholder-gray-500 text-sm transition-all duration-200 outline-none
                      focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                      disabled:opacity-50
                      ${fieldErrors.originalUrl
                        ? "border-red-500"
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                  />
                  {fieldErrors.originalUrl && (
                    <p className="mt-1 text-xs text-red-400">{fieldErrors.originalUrl}</p>
                  )}
                </div>

                {/* ── Second row: alias + title ─────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Custom alias{" "}
                      <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-3 bg-gray-700 border border-r-0 border-gray-600
                        rounded-l-xl text-gray-400 text-xs whitespace-nowrap">
                        short.ly/
                      </span>
                      <input
                        name="customAlias"
                        type="text"
                        value={formData.customAlias}
                        onChange={handleFormChange}
                        placeholder="my-link"
                        disabled={formLoading}
                        className={`flex-1 px-3 py-3 rounded-r-xl bg-gray-800 border text-white
                          placeholder-gray-500 text-sm transition-all duration-200 outline-none
                          focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                          disabled:opacity-50
                          ${fieldErrors.customAlias
                            ? "border-red-500"
                            : "border-gray-700 hover:border-gray-600"
                          }`}
                      />
                    </div>
                    {fieldErrors.customAlias && (
                      <p className="mt-1 text-xs text-red-400">{fieldErrors.customAlias}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Title{" "}
                      <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <input
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="My awesome link"
                      disabled={formLoading}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700
                        hover:border-gray-600 text-white placeholder-gray-500 text-sm
                        transition-all duration-200 outline-none
                        focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                        disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* ── Expiry date ───────────────────────── */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Expiry date{" "}
                    <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    name="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={handleFormChange}
                    min={minDate}
                    disabled={formLoading}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white
                      text-sm transition-all duration-200 outline-none
                      focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                      disabled:opacity-50
                      ${fieldErrors.expiresAt
                        ? "border-red-500"
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                  />
                  {fieldErrors.expiresAt && (
                    <p className="mt-1 text-xs text-red-400">{fieldErrors.expiresAt}</p>
                  )}
                </div>

                {/* ── Submit ────────────────────────────── */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500
                      disabled:bg-violet-800 disabled:cursor-not-allowed
                      text-white font-semibold rounded-xl text-sm
                      transition-all duration-200 shadow-lg shadow-violet-500/20
                      flex items-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Create short URL
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setFormData({ originalUrl: "", customAlias: "", expiresAt: "", title: "" });
                      setFieldErrors({});
                      setFormError("");
                    }}
                    className="px-4 py-2.5 text-gray-400 hover:text-white text-sm
                      transition-colors rounded-xl hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── URL list section ─────────────────────────────── */}
        <div>
          {/* List header with search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-white">
              Your links{" "}
              {!listLoading && (
                <span className="text-gray-500 font-normal text-base">
                  ({filtered.length})
                </span>
              )}
            </h2>

            {/* Search input */}
            {urls.length > 0 && (
              <div className="relative w-full sm:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search links..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800
                    text-white placeholder-gray-500 text-sm transition-all duration-200 outline-none
                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                    hover:border-gray-700"
                />
              </div>
            )}
          </div>

          {/* Loading state */}
          {listLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                      <div className="h-3 bg-gray-800 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!listLoading && listError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{listError}</p>
              <button
                onClick={fetchUrls}
                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400
                  text-sm rounded-xl transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!listLoading && !listError && urls.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl
              p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center
                justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">No links yet</h3>
              <p className="text-gray-400 text-sm mb-6">
                Shorten your first URL to get started.
              </p>
              <button
                onClick={() => setFormOpen(true)}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white
                  font-medium text-sm rounded-xl transition-colors"
              >
                Create your first link
              </button>
            </div>
          )}

          {/* No search results */}
          {!listLoading && !listError && urls.length > 0 && filtered.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">
                No links match{" "}
                <span className="text-white font-medium">"{searchQuery}"</span>.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {/* URL cards list */}
          {!listLoading && !listError && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((url) => (
                <URLCard
                  key={url._id}
                  url={url}
                  onDelete={handleDelete}
                  onShowToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;