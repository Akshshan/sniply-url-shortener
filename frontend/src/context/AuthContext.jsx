// ============================================================
// frontend/src/context/AuthContext.jsx
// Global authentication state manager using React Context API.
// Wraps the entire app so any component can:
//   - Read the current user:        const { user } = useAuth();
//   - Log in:                       const { login } = useAuth();
//   - Log out:                       const { logout } = useAuth();
//   - Check loading state:          const { loading } = useAuth();
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

// ── Create the context object ────────────────────────────────
// This is what components will subscribe to via useAuth()
const AuthContext = createContext(null);

// ============================================================
// AuthProvider
// Wrap your entire app with this component in main.jsx so all
// child components can access auth state via useAuth().
// ============================================================

export const AuthProvider = ({ children }) => {
  // ── State ──────────────────────────────────────────────────
  // user    — the logged-in user object { id, name, email }
  //           or null if not logged in
  const [user, setUser]       = useState(null);

  // loading — true while we are checking if a stored token
  //           is still valid (on initial page load / refresh)
  const [loading, setLoading] = useState(true);

  // ============================================================
  // REHYDRATE SESSION ON PAGE LOAD
  // When the user refreshes the page, React state is wiped.
  // We check localStorage for a saved token, then verify it
  // with the backend. If valid, we restore the user session.
  // This runs once when the AuthProvider first mounts.
  // ============================================================

  useEffect(() => {
    const rehydrateSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // No token saved — user is definitely not logged in
        setLoading(false);
        return;
      }

      try {
        // Ask the backend to validate the token and return user data.
        // The axios interceptor in api/axios.js automatically attaches
        // the token from localStorage to this request's headers.
        const res = await api.get("/api/auth/me");
        setUser(res.data.user);
      } catch (error) {
        // Token was invalid or expired — clear stale data
        // The axios interceptor handles the redirect to /login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        // Whether it succeeded or failed, we are done loading
        setLoading(false);
      }
    };

    rehydrateSession();
  }, []); // empty dependency array = run only once on mount

  // ============================================================
  // LOGIN
  // Called after a successful POST /api/auth/login response.
  // Saves the token to localStorage and sets the user in state.
  // ============================================================

  const login = useCallback((token, userData) => {
    // Persist the token so it survives page refreshes
    localStorage.setItem("token", token);
    // Optionally cache user data (not strictly necessary since
    // we fetch fresh data from /api/auth/me on reload)
    localStorage.setItem("user", JSON.stringify(userData));
    // Update React state — triggers re-render across the app
    setUser(userData);
  }, []);

  // ============================================================
  // LOGOUT
  // Clears all auth data and resets user state to null.
  // The ProtectedRoute component will then redirect to /login.
  // ============================================================

  const logout = useCallback(() => {
    // Remove token and user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Reset user state — all protected routes will redirect to /login
    setUser(null);
    // Redirect to login page
    window.location.href = "/login";
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // Everything we expose to child components via useAuth()
  // ============================================================

  const value = {
    user,         // { id, name, email } or null
    loading,      // true while checking token on page load
    login,        // fn(token, userData) — call after successful login
    logout,       // fn() — clears session and redirects
    isLoggedIn: !!user, // boolean convenience flag
  };

  // ============================================================
  // RENDER
  // While loading, render nothing (or a spinner).
  // This prevents a flash of the login page before we know
  // whether the user is actually authenticated.
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          {/* Spinning loader */}
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            Loading your session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// useAuth — Custom Hook
// Provides a clean, readable way to consume the AuthContext.
// Usage in any component:
//   import { useAuth } from "../context/AuthContext";
//   const { user, login, logout, isLoggedIn } = useAuth();
// Throws an error if used outside of AuthProvider so we catch
// incorrect usage early during development.
// ============================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
      "Wrap your app with <AuthProvider> in main.jsx."
    );
  }

  return context;
};

export default AuthContext;