// ============================================================
// frontend/tailwind.config.js
// Tailwind CSS configuration file.
// Tells Tailwind which files to scan for class names so it
// can purge unused styles in production builds, keeping the
// final CSS bundle as small as possible.
// ============================================================

/** @type {import('tailwindcss').Config} */
export default {
  // ── Content paths ─────────────────────────────────────────
  // Tailwind scans these files for class names.
  // Any Tailwind class used in these files will be included
  // in the final CSS bundle; everything else is removed.
  content: [
    "./index.html",               // the root HTML file (Vite entry)
    "./src/**/*.{js,ts,jsx,tsx}", // all JS/JSX files inside src/
  ],

  // ── Theme ─────────────────────────────────────────────────
  // Extend the default Tailwind theme here.
  // We keep the defaults and add a few custom values.
  theme: {
    extend: {
      // Custom color palette — extends Tailwind's built-in colors
      // so we can use classes like bg-brand-600, text-brand-400
      colors: {
        brand: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
      },

      // Custom font family — add "Inter" as the default sans font.
      // This is already included via the browser's system stack,
      // but listing it explicitly makes it easy to swap later.
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      // Custom border radius values
      borderRadius: {
        "2xl": "1rem",    // 16px
        "3xl": "1.5rem",  // 24px
      },

      // Custom box shadow — a soft violet glow used on primary buttons
      boxShadow: {
        "violet-glow": "0 0 20px rgba(124, 58, 237, 0.35)",
        "card":        "0 4px 24px rgba(0, 0, 0, 0.4)",
      },

      // Custom animation keyframes for the loading spinner
      // (the default Tailwind spinner uses border tricks;
      //  this is here in case you want a custom fade-in)
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },

      // Named animations that use the keyframes above
      // Usage: className="animate-fade-in-up"
      animation: {
        "fade-in-up": "fadeInUp 0.3s ease-out forwards",
        "fade-in":    "fadeIn 0.2s ease-out forwards",
      },
    },
  },

  // ── Plugins ───────────────────────────────────────────────
  // Add official or community Tailwind plugins here.
  // Currently none required — add @tailwindcss/forms if you
  // want better default form element styles in the future.
  plugins: [],
};