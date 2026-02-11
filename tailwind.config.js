
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",
        secondary: "#0F172A",
        emerald: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        "background-light": "#F8FAFC",
        "background-dark": "#020617",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Lexend", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
