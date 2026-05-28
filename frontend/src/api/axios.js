// ============================================================
// frontend/src/api/axios.js
// Creates and exports a pre-configured Axios instance.
// Every API call in the app uses this instance so that:
//   1. The base URL is set once (from the .env file)
//   2. The JWT token is automatically attached to every request
//   3. 401 responses (expired/invalid token) auto-logout the user
// ============================================================

import axios from "axios";

// ============================================================
// CREATE THE AXIOS INSTANCE
// baseURL is read from the Vite environment variable.
// All relative paths like "/api/auth/login" will automatically
// be prefixed with this base URL.
// ============================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout — prevents requests hanging forever
});

// ============================================================
// REQUEST INTERCEPTOR
// Runs before every outgoing request.
// Reads the JWT from localStorage and attaches it to the
// Authorization header in the "Bearer <token>" format.
// This means we never have to manually add the token in
// individual API calls — it happens automatically here.
// ============================================================

api.interceptors.request.use(
  (config) => {
    // Read the token that was stored during login/signup
    const token = localStorage.getItem("token");

    if (token) {
      // Attach JWT to every request that goes out
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // must return config to proceed with the request
  },
  (error) => {
    // If building the request itself failed for some reason
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// Runs after every incoming response.
// Handles the case where the server returns 401 Unauthorized —
// this means the JWT has expired or is invalid.
// We clear localStorage and redirect to /login automatically
// so the user is not stuck in a broken authenticated state.
// ============================================================

api.interceptors.response.use(
  (response) => {
    // 2xx responses — just pass them through unchanged
    return response;
  },
  (error) => {
    // Check if we got a 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      // Clear all auth data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page.
      // We use window.location.href instead of React Router's navigate()
      // because this interceptor lives outside of React component tree
      // and does not have access to the router context.
      // Only redirect if we're not already on the login or signup page
      // to avoid an infinite redirect loop.
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/signup") {
        window.location.href = "/login";
      }
    }

    // Always reject the promise so the calling code can handle
    // the error in its own try/catch or .catch() block
    return Promise.reject(error);
  }
);

// ============================================================
// EXPORT
// Import this `api` instance anywhere you need to make
// an HTTP request, e.g.:
//   import api from "../api/axios";
//   const res = await api.get("/api/urls/");
// ============================================================

export default api;