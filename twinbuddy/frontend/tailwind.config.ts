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
          danger:            '#f87171',
          success:           '#34d399',
          purple:            '#a78bfa',
          pink:              '#fb7185',
        },
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-card':        'linear-gradient(135deg, rgba(255,179,182,0.08) 0%, rgba(175,255,251,0.05) 100%)',
        'neon-card-active': 'linear-gradient(135deg, rgba(255,179,182,0.18) 0%, rgba(175,255,251,0.12) 100%)',
        'hero-glow':        'radial-gradient(ellipse at 50% 0%, rgba(255,179,182,0.15) 0%, transparent 70%)',
        'shimmer':          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
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
        'glow-primary-lg':'0 0 30px rgba(255,179,182,0.5), 0 0 60px rgba(255,179,182,0.2)',
        'glow-secondary-lg':'0 0 30px rgba(175,255,251,0.5), 0 0 60px rgba(175,255,251,0.2)',
        'inner-glow':     'inset 0 0 20px rgba(255,179,182,0.08)',
        'card-3d':        '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      animation: {
        'neon-pulse':     'neonPulse 2s ease-in-out infinite',
        'heart-burst':    'heartBurst 400ms ease-out forwards',
        'page-enter':     'pageEnter 500ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':       'slideUp 300ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':        'fadeIn 300ms ease-out both',
        'spin-slow':      'spin 3s linear infinite',
        'bounce-in':      'bounceIn 500ms cubic-bezier(0.34,1.56,0.64,1) both',
        'glow-pulse':     'glowPulse 2.5s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
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
        bounceIn: {
          from: { opacity: '0', transform: 'scale(0.8) translateY(16px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%':       { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '200% center' },
          to:   { backgroundPosition: '-200% center' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
