/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        travel: '#2563EB',
        'travel-dark': '#1D4ED8',
        'travel-light': '#3B82F6',
        mint: '#10B981',
        'mint-dark': '#059669',
        coral: '#F43F5E',
        'coral-dark': '#E11D48',
        ink: '#0F172A',
        muted: '#64748B',
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        line: '#E2E8F0',
        violet: '#7C3AED',
        'violet-light': '#8B5CF6',
        amber: '#F59E0B',
        'amber-dark': '#D97706'
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        lift: '0 8px 32px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.04)',
        glow: '0 0 24px rgba(37,99,235,0.15)',
        'glow-lg': '0 0 48px rgba(37,99,235,0.2)',
        modal: '0 24px 48px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
        glass: '0 8px 32px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
        'card-hover': '0 12px 40px rgba(37,99,235,0.15), 0 4px 12px rgba(0,0,0,0.06)',
        'stat': '0 2px 12px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-6px) rotate(1deg)' },
          '66%': { transform: 'translateY(-3px) rotate(-1deg)' }
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'width-grow': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--target-width, 100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        float: 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'spin-slow': 'spin-slow 12s linear infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite'
      },
      backgroundSize: {
        '200%': '200% 200%'
      }
    }
  },
  plugins: []
};
