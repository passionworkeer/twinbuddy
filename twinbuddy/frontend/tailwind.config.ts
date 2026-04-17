import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          bg:               '#11131e',
          surface:          '#1a1b2e',
          elevated:         '#22243a',
          primary:           '#ffb3b6',
          'primary-light':   '#ffd4d7',
          'primary-dark':    '#e8888e',
          secondary:         '#affffb',
          'secondary-light': '#d4fffc',
          'secondary-dark':  '#7eeee7',
          tertiary:          '#eec224',
          'tertiary-light':  '#f5d04a',
          'tertiary-dark':   '#c9a01e',
          text:              '#f0f0f5',
          'text-secondary':  '#a0a0b8',
          'text-disabled':   '#5a5a70',
          border:            'rgba(255,255,255,0.08)',
          'border-subtle':   'rgba(255,255,255,0.04)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        orbitron: ['Orbitron', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary':   '0 0 20px rgba(255,179,182,0.4), 0 0 40px rgba(255,179,182,0.15)',
        'glow-secondary': '0 0 20px rgba(175,255,251,0.4), 0 0 40px rgba(175,255,251,0.15)',
        'glow-tertiary':  '0 0 20px rgba(238,194,36,0.4), 0 0 40px rgba(238,194,36,0.15)',
        'glow-card':      '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'neon-pulse':     'neonPulse 2s ease-in-out infinite',
        'heart-burst':    'heartBurst 400ms ease-out forwards',
        'page-enter':     'pageEnter 500ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':       'slideUp 300ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':        'fadeIn 300ms ease-out both',
        'spin-slow':      'spin 3s linear infinite',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,179,182,0.4)' },
          '50%':       { boxShadow: '0 0 32px rgba(255,179,182,0.7)' },
        },
        heartBurst: {
          '0%':   { transform: 'scale(1)' },
          '30%':  { transform: 'scale(1.4)' },
          '60%':  { transform: 'scale(0.9)' },
          '80%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        pageEnter: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
