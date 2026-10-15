/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          bg: "var(--zen-bg, #000000)",
          surface: "var(--zen-surface, #0a0a0a)",
          elevated: "var(--zen-elevated, #141414)",
          border: "var(--zen-border, #262626)",
          hover: "var(--zen-hover, #1f1f1f)",
          accent: "var(--zen-accent, #ffffff)",
          accentHover: "var(--zen-accent-hover, #e5e5e5)",
          text: "var(--zen-text, #ffffff)",
          muted: "var(--zen-muted, #a3a3a3)",
          subtle: "var(--zen-subtle, #737373)",
        },
      },
      borderRadius: {
        zen: "var(--zen-radius, 12px)",
      },
    },
  },
  plugins: [],
}
