/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050507',
          900: '#0a0a0c',
          850: '#0d0d10',
          800: '#101015',
          700: '#16161c',
          600: '#1c1c24',
          500: '#26262f',
          400: '#3a3a45',
          300: '#5c5c68',
          200: '#9a9aa6',
          100: '#d4d4dc',
          50: '#f4f4f6',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          soft: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.14)',
          accent: 'rgba(255,255,255,0.32)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        ox: '10px',
        'ox-sm': '6px',
        'ox-lg': '14px',
      },
      boxShadow: {
        glass: '0 8px 28px -8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glass-lg': '0 24px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        ring: '0 0 0 1px rgba(255,255,255,0.18), 0 0 0 4px rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'pulse-soft': {
          '0%,100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.8s linear infinite',
      },
    },
  },
  plugins: [],
};
