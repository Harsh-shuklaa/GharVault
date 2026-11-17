/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Supabase Emerald Green Palette
        supabase: {
          DEFAULT: "#3ECF8E",
          emerald: "#3ECF8E",
          dark: "#24B47E",
          light: "#10B981",
          50: "#EDFCF6",
          100: "#D3F8E9",
          200: "#A8F1D3",
          300: "#71E6B8",
          400: "#3ECF8E",
          500: "#24B47E",
          600: "#10B981",
          700: "#059669",
          800: "#047857",
          900: "#065F46",
          950: "#022C22",
        },

        // Dark Canvas Tokens (Supabase Studio exact)
        dark: {
          canvas: "#121212",
          surface: "#171717",
          sidebar: "#141414",
          card: "#1C1C1C",
          border: "#262626",
          subtle: "#1F1F1F",
          muted: "#9CA3AF",
        },

        // GharVault Heritage Colors
        "ghar-sapphire": "#0F172A",
        "ghar-sapphire-card": "#1E293B",
        "ghar-sapphire-border": "#334155",
        "ghar-blue": "#2563EB",
        "ghar-emerald": "#059669",
        "ghar-amber": "#D97706",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        headline: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"]
      }
    },
  },
  plugins: [],
}
