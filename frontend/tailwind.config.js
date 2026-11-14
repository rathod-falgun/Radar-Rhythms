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
        // Astro Color Theme (Port Gore, Chambray, Steel Blue, Cornflower, Link Water)
        portgore: '#1a1f3d',
        chambray: '#3b4a8c',
        steelblue: '#587ebb',
        cornflower: '#87b8e8',
        linkwater: '#c6e9f1',

        astro: {
          base: '#1a1f3d',
          gradient: '#3b4a8c',
          box: '#222950',
          border: '#587ebb',
          highlight: '#87b8e8',
          accent: '#c6e9f1',
        },

        // Theme compatibility tokens mapped to Astro palette
        midnight: '#1a1f3d',
        indigo: '#222950',
        panel: '#283262',
        dusk: '#3b4a8c',
        teal: '#587ebb',
        aqua: '#87b8e8',
        cloud: '#c6e9f1',

        // Semantic Role Tokens
        space: {
          bg: '#1a1f3d',
          card: '#222950',
          panel: '#283262',
          border: 'rgba(88, 126, 187, 0.45)',
          borderStrong: '#587ebb',
          text: '#c6e9f1',
          muted: '#87b8e8',
          dim: '#587ebb',
        },

        // Scientific Map Semantic Colors (ABSOLUTELY PRESERVED)
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

