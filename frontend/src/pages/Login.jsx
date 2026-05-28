// ============================================================
// frontend/src/pages/Login.jsx
// Login page — email + password form.
// On success: stores JWT via AuthContext.login() and redirects
// to the Dashboard. Shows validation errors and loading state.
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Login = () => {
  const navigate    = useNavigate();
  const { login }   = useAuth();

  // ── Form state ─────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: "", password: "" });

  // ── UI state ───────────────────────────────────────────────
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");           // server/network error
  const [fieldErrors, setFieldErrors] = useState({});          // per-field validation
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // HANDLE INPUT CHANGE
  // Updates formData and clears the error for that field
  // as soon as the user starts typing again.
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field-level error for this input
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear general error on any change
    if (error) setError("");
  };

  // ============================================================
  // CLIENT-SIDE VALIDATION
  // Runs before we hit the network — catches obvious mistakes
  // immediately without a round-trip to the server.
  // ============================================================

  const validate = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    return errors;
  };

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent default browser form submission

    // Run client-side validation first
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const res = await api.post("/api/auth/login", {
        email:    formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Store token and user in context + localStorage
      login(res.data.token, res.data.user);

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Show the error message returned by the server
      const message =
        err.response?.data?.message ||
        "Unable to connect to server. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Logo / Heading ─────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to manage your short links</p>
        </div>

        {/* ── Card ───────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

          {/* General error banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* ── Email field ──────────────────────────── */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500
                  text-sm transition-all duration-200 outline-none
                  focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${fieldErrors.email
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-700 hover:border-gray-600"
                  }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* ── Password field ───────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border text-white placeholder-gray-500
                    text-sm transition-all duration-200 outline-none
                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${fieldErrors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-700 hover:border-gray-600"
                    }`}
                />
                {/* Show / hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* ── Submit button ────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800
                disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm
                transition-all duration-200 shadow-lg shadow-violet-500/20
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                focus:ring-offset-gray-900 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* ── Divider ──────────────────────────────────── */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;