// ============================================================
// frontend/src/components/Navbar.jsx
// Top navigation bar — shown on Dashboard and Analytics pages.
// Displays the app logo, current user name, and a logout button.
// Collapses gracefully on mobile with a hamburger menu.
// ============================================================

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout }    = useAuth();
  const location            = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Active link helper ─────────────────────────────────────
  const isActive = (path) => location.pathname.startsWith(path);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ───────────────────────────────────────── */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center
              justify-center shadow-lg shadow-violet-500/30
              group-hover:bg-violet-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Snip<span className="text-violet-400">ly</span>
            </span>
          </Link>

          {/* ── Desktop nav links + user ────────────────────── */}
          <div className="hidden sm:flex items-center gap-1">

            {/* Dashboard link */}
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              Dashboard
            </Link>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-700 mx-2" />

            {/* User avatar + name */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl
              bg-gray-800 border border-gray-700">
              {/* Avatar circle with initials */}
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center
                justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?"}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-white text-sm font-medium leading-tight">
                  {user?.name?.split(" ")[0] || "User"}
                </p>
                <p className="text-gray-500 text-xs leading-tight truncate max-w-[140px]">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="ml-1 flex items-center gap-2 px-3 py-2 rounded-xl
                text-gray-400 hover:text-white hover:bg-red-500/10
                hover:border-red-500/20 border border-transparent
                text-sm font-medium transition-all duration-200"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>

          {/* ── Mobile hamburger button ─────────────────────── */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 rounded-xl text-gray-400 hover:text-white
              hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              /* X icon — close */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon — open */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ──────────────────────────────── */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-800 bg-gray-900 px-4 pb-4 pt-3 space-y-2">

          {/* User info block */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center
              justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-gray-500 text-xs truncate">{user?.email || ""}</p>
            </div>
          </div>

          {/* Dashboard link */}
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          {/* Sign out button */}
          <button
            onClick={() => { setMenuOpen(false); logout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-red-400 hover:text-red-300 hover:bg-red-500/10
              text-sm font-medium transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;