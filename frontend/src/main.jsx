// ============================================================
// frontend/src/main.jsx
// The entry point for the React application.
// Vite looks for this file by default (configured in
// vite.config.js). It mounts the <App /> component into the
// #root div defined in index.html.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Global CSS — imports Tailwind's base, components, and
// utilities layers. This file must be imported here so that
// Tailwind styles are available throughout the entire app.
import "./index.css";

// Root application component (sets up routing + auth context)
import App from "./App";

// ============================================================
// Mount the React app
// document.getElementById("root") targets the <div id="root">
// in index.html. createRoot is the React 18 API for mounting.
// StrictMode enables extra development-time warnings and
// double-invokes certain lifecycle methods to surface bugs.
// It has NO effect in production builds.
// ============================================================

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);