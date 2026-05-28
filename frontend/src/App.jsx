// ============================================================
// frontend/src/App.jsx
// Root application component.
// Sets up React Router with public and protected routes.
// AuthProvider wraps everything so any component can access
// the logged-in user via the useAuth() hook.
// ============================================================

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context — must wrap everything that uses useAuth()
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login     from "./pages/Login";
import Signup    from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";

// ============================================================
// ProtectedRoute
// Wraps any route that requires the user to be logged in.
// If no valid user exists in AuthContext, redirects to /login.
// Shows a spinner while the session is being rehydrated from
// localStorage on page refresh.
// ============================================================

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2
          border-b-2 border-violet-500" />
      </div>
    );
  }

  // Not logged in — send to login page
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// ============================================================
// PublicRoute
// Wraps routes that should NOT be accessible when logged in
// (login and signup). If the user is already authenticated,
// redirect them straight to the dashboard.
// ============================================================

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2
          border-b-2 border-violet-500" />
      </div>
    );
  }

  // Already logged in — redirect away from login/signup
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

// ============================================================
// AppRoutes
// Defines all the routes. Must live INSIDE <Router> so that
// useAuth() (which is used by ProtectedRoute / PublicRoute)
// has access to the router context when it calls useNavigate
// internally.
// ============================================================

const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Routes>

        {/* ── Public routes — redirect to /dashboard if logged in ── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* ── Protected routes — redirect to /login if not logged in ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/:shortCode"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* ── Root redirect ── */}
        {/* Visiting "/" sends users to /dashboard.
            ProtectedRoute there will redirect to /login if needed. */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ── 404 catch-all ── */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center
              gap-4 bg-gray-950">
              <h1 className="text-7xl font-bold text-violet-500">404</h1>
              <p className="text-gray-400 text-lg">Page not found.</p>
              <a
                href="/dashboard"
                className="mt-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500
                  text-white text-sm font-medium rounded-xl transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

// ============================================================
// App — Root export
// Nesting order matters:
//   Router  →  AuthProvider  →  AppRoutes
// AuthProvider must be inside Router so that the logout()
// function (which calls window.location.href) works and so
// that any future use of useNavigate inside context is valid.
// ============================================================

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;