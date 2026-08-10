/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FFFFFF',
          dim: '#d9dadd',
          bright: '#f8f9fc',
          'container-lowest': '#ffffff',
          'container-low': '#f2f3f6',
          container: '#edeef1',
          'container-high': '#e7e8eb',
          'container-highest': '#e1e2e5',
          variant: '#e1e2e5',
          tint: '#006a65'
        },
        'on-surface': {
          DEFAULT: '#191c1e',
          variant: '#3e4948'
        },
        inverse: {
          surface: '#2e3133',
          'on-surface': '#f0f1f4',
          primary: '#7ed5cf'
        },
        outline: {
          DEFAULT: '#6e7978',
          variant: '#bdc9c7'
        },
        primary: {
          DEFAULT: '#006763',
          container: '#1f827c',
          fixed: '#9af2eb',
          'fixed-dim': '#7ed5cf'
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#f3fffd',
          fixed: '#00201e',
          'fixed-variant': '#00504c'
        },
        secondary: {
          DEFAULT: '#006b5e',
          container: '#9befdf',
          fixed: '#9ef2e2',
          'fixed-dim': '#82d6c6'
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#066f62',
          fixed: '#00201b',
          'fixed-variant': '#005047'
        },
        tertiary: {
          DEFAULT: '#8c4a2d',
          container: '#aa6243',
          fixed: '#ffdbcd',
          'fixed-dim': '#ffb597'
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#fffbff',
          fixed: '#360f00',
          'fixed-variant': '#72361a'
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          red: '#EF4444'
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a'
        },
        background: '#f8f9fc',
        'on-background': '#191c1e',
        text: {
          primary: '#0F172A',
          secondary: '#6B7280',
          muted: '#9CA3AF'
        },
        border: {
          light: '#EEF0F2'
        },
        gradient: {
          mint: { start: '#D6F3EA', end: '#B9E8DA' },
          blue: { start: '#DCEBFB', end: '#C7DFF8' },
          rose: { start: '#FBE0EA', end: '#F6D2E1' }
        },
        success: { green: '#16A34A' },
        warning: { orange: '#F59E0B' },
        info: { blue: '#3B82F6' },
        // Legacy colors mapped to avoid immediate catastrophic breakage
        bg: { base: '#f8f9fc', surface: '#ffffff', elevated: '#edeef1', hover: '#e7e8eb' },
        risk: {
          low: '#16A34A', lowBg: '#D6F3EA',
          medium: '#F59E0B', mediumBg: '#fef3c7',
          high: '#e0713a', highBg: '#ffedd5',
          critical: '#EF4444', criticalBg: '#fee2e2'
        },
        accent: { DEFAULT: '#006763', hover: '#00504c', muted: '#82d6c6' },
        landing: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: {
            primary: '#0F172A',
            secondary: '#475569',
          },
          mint: {
            100: '#D1FAE5',
            200: '#A7F3D0',
            500: '#10B981',
            700: '#047857',
          },
          teal: {
            500: '#14B8A6',
            700: '#0F766E',
          },
          blue: {
            100: '#DBEAFE',
            200: '#BFDBFE',
          },
          pink: {
            100: '#FCE7F3',
            200: '#FBCFE8',
          }
        },
      },
      fontFamily: { 
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-page': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-section': ['17px', { lineHeight: '24px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-base': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-card': ['13px', { lineHeight: '18px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-pill': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'sidebar-group': ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '700' }]
      },
      spacing: {
        'sidebar-width': '240px',
        'card-padding': '1.5rem',
        'grid-gap': '1.25rem',
        'canvas-margin': '1rem',
        'touch-target': '44px'
      }
    },
  },
  plugins: [],
}
