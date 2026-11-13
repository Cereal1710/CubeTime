/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#10151F',
        surface: {
          DEFAULT: '#192333',
          elevated: '#223149',
        },
        primary: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        border: '#344155',
        text: {
          DEFAULT: '#F1F5F9',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}

