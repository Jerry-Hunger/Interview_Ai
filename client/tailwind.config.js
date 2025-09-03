/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          light: "#ffffff",
          dark: "#0f172a",
        },
        foreground: {
          light: "#0f172a",
          dark: "#f8fafc",
        },
        card: {
          light: "#f8fafc",
          dark: "#1e293b",
        },
        border: {
          light: "#e2e8f0",
          dark: "#334155",
        },
      },
    },
  },
  plugins: [],
};
