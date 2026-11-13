/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          dark: '#0a0e17',
          card: '#111827',
          panel: '#1a2234',
          accent: '#00d2ff',
          neon: '#39ff14',
          crimson: '#ff3366',
          amber: '#ffb703',
        },
        brand: {
          prussian: '#0b132b',
          space: '#1c2541',
          dusk: '#3a506b',
          teal: '#5bc0be',
          aqua: '#6fffe9',
        }
      }
    },
  },
  plugins: [],
}

