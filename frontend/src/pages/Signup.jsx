// ============================================================
// frontend/src/pages/Signup.jsx
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ============================================================
// EyeToggle — defined OUTSIDE Signup to prevent focus loss
// ============================================================
const EyeToggle = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-gray-500 hover:text-gray-300 transition-colors"
    tabIndex={-1}
  >
    {show ? (
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
);

// ============================================================
// InputField — defined OUTSIDE Signup to prevent focus loss
// ============================================================
const InputField = ({
  id, name, type = "text", label, placeholder,
  value, autoComplete, error: fieldError,
  rightElement, onChange, disabled,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500
          text-sm transition-all duration-200 outline-none
          focus:ring-2 focus:ring-violet-500 focus:border-violet-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${rightElement ? "pr-12" : ""}
          ${fieldError
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-700 hover:border-gray-600"
          }`}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {fieldError && (
      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd" />
        </svg>
        {fieldError}
      </p>
    )}
  </div>
);

// ============================================================
// Signup — main component
// ============================================================
const Signup = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
  });

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [fieldErrors, setFieldErrors]   = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Full name is required.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    } else if (formData.name.trim().length > 50) {
      errors.name = "Name cannot exceed 50 characters.";
    }
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
      errors.password = "Password must contain at least one letter and one number.";
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6)                              score++;
    if (password.length >= 10)                             score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password))                            score++;
    if (/[^a-zA-Z0-9]/.test(password))                    score++;
    const levels = [
      { score: 0, label: "",           color: "" },
      { score: 1, label: "Weak",       color: "bg-red-500" },
      { score: 2, label: "Fair",       color: "bg-orange-500" },
      { score: 3, label: "Good",       color: "bg-yellow-500" },
      { score: 4, label: "Strong",     color: "bg-green-500" },
      { score: 5, label: "Very Strong",color: "bg-emerald-500" },
    ];
    return levels[Math.min(score, 5)];
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await api.post("/api/auth/signup", {
        name:     formData.name.trim(),
        email:    formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      login(res.data.token, res.data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to connect to server. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-gray-400 mt-2 text-sm">Start shortening URLs for free</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30
              text-red-400 rounded-xl px-4 py-3 text-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name */}
            <InputField
              id="name" name="name" label="Full name"
              placeholder="Jane Doe"
              value={formData.name}
              autoComplete="name"
              error={fieldErrors.name}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Email */}
            <InputField
              id="email" name="email" type="email" label="Email address"
              placeholder="you@example.com"
              value={formData.email}
              autoComplete="email"
              error={fieldErrors.email}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border text-white
                    placeholder-gray-500 text-sm transition-all duration-200 outline-none
                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${fieldErrors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-700 hover:border-gray-600"
                    }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
              </div>

              {/* Strength bar */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    strength.score <= 1 ? "text-red-400" :
                    strength.score <= 2 ? "text-orange-400" :
                    strength.score <= 3 ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {strength.label && `Password strength: ${strength.label}`}
                  </p>
                </div>
              )}

              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border text-white
                    placeholder-gray-500 text-sm transition-all duration-200 outline-none
                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${fieldErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
                </div>
              </div>

              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}

              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
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
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;