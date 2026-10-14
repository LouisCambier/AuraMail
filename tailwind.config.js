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
          bg: "#0d0f12",
          surface: "#14171d",
          elevated: "#1a1e26",
          border: "#232833",
          hover: "#2b323f",
          accent: "#6366f1", // Indigo
          accentHover: "#4f46e5",
          text: "#f3f4f6",
          muted: "#9ca3af",
          subtle: "#6b7280",
        },
      },
      borderRadius: {
        zen: "12px",
      },
    },
  },
  plugins: [],
}
