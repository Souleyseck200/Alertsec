/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        primary: {
          DEFAULT: '#2563EB', // Bleu Gendarmerie
          dark: '#1D4ED8',
        },
        danger: '#DC2626', // Rouge Alerte
        warning: '#F59E0B',
      }
    },
  },
  plugins: [],
}
