/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { base: '#0a0a0f', surface: '#13131a', elevated: '#1a1a24', hover: '#20202c' },
        border: { DEFAULT: '#26262f', strong: '#34343f' },
        text: { primary: '#f2f2f5', secondary: '#9c9ca8', muted: '#65656f' },
        accent: { DEFAULT: '#1d9e75', hover: '#25b989', muted: '#0f6e56' },
        risk: {
          low: '#4a90d9', lowBg: '#132030',
          medium: '#e0a530', mediumBg: '#2b2210',
          high: '#e0713a', highBg: '#2b1810',
          critical: '#e0453f', criticalBg: '#2b1212'
        }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    },
  },
  plugins: [],
}
