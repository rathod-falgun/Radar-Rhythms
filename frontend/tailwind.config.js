/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Midnight Atlas Brand Identity
        midnight: '#0B132B',
        indigo: '#1C2541',
        dusk: '#3A506B',
        teal: '#5BC0BE',
        aqua: '#6FFFE9',
        cloud: '#F4F6F8',
        surface: '#FFFFFF',

        // Neutrals
        primary: '#0B132B',
        body: '#475569',
        muted: '#64748B',
        border: '#E2E8F0',
        subtle: '#F8FAFC',
        disabled: '#CBD5E1',

        // Scientific Map Semantic Colors (PRESERVED)
        map: {
          persistent: '#06B6D4',
          inundated: '#E11D48',
          land: '#64748B',
          receded: '#D97706',
        },

        // Backward compatibility
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

