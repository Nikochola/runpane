/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-1955)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0a0a0c",
        panel: "#111114",
        line: "#1f1f24",
        accent: "#f4f4f5",
        ok: "#10b981",
        warn: "#f59e0b",
        err: "#ef4444",
      },
    },
  },
  plugins: [],
};
