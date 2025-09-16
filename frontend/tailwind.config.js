/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // enable dark mode via class
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"], // Inter as default
      },
      colors: {
        brand: {
          light: "#A78BFA",
          DEFAULT: "#7C3AED",
          dark: "#4C1D95",
        },
        accent: "#10B981",
      },
    },
  },
  plugins: [],
}
