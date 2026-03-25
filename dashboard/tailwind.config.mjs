/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        predy: {
          bg: "#050814",
          surface: "#0c1222",
          card: "#111827",
          border: "#1e293b",
          muted: "#94a3b8",
          accent: "#6366f1",
          glow: "#22d3ee"
        }
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(99, 102, 241, 0.35)",
        card: "0 4px 24px rgba(0, 0, 0, 0.45)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
