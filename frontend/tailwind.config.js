/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // The 5 Core Night-Pass Radar Colors
        black: '#000000',
        prussian: '#14213d',
        orange: '#fca311',
        alabaster: '#e5e5e5',
        white: '#ffffff',

        // Tints & Functional Mappings
        'night-bg': '#000000',
        'night-panel': '#14213d',
        'night-panel-fade': 'rgba(20, 33, 61, 0.85)',
        'night-signal': '#fca311',
        'night-text': '#e5e5e5',
        'night-heading': '#ffffff',
        'night-border': 'rgba(229, 229, 229, 0.12)',
        'night-border-hover': 'rgba(252, 163, 17, 0.6)',

        // Scientific Map Semantic Colors (Aligned with palette)
        map: {
          persistent: '#14213d',
          inundated: '#fca311',
          land: '#333333',
          receded: '#a3a3a3',
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
    },
  },
  plugins: [],
}
