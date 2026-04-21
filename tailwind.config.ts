import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284c7',
          hover: '#0369a1',
          light: '#38bdf8',
          muted: 'rgba(2,132,199,0.12)',
        },
        success: { DEFAULT: '#10b981', muted: 'rgba(16,185,129,0.12)' },
        warning: { DEFAULT: '#f59e0b', muted: 'rgba(245,158,11,0.12)' },
        danger: { DEFAULT: '#ef4444', muted: 'rgba(239,68,68,0.12)' },
        vrd: {
          bg: 'var(--vrd-bg)',
          sidebar: 'var(--vrd-sidebar)',
          card: 'var(--vrd-card)',
          'card-hover': 'var(--vrd-card-hover)',
          border: 'var(--vrd-border)',
          'border-light': 'var(--vrd-border-light)',
          text: 'var(--vrd-text)',
          'text-muted': 'var(--vrd-text-muted)',
          'text-dim': 'var(--vrd-text-dim)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(2,132,199,0.5)' },
          '50%': { boxShadow: '0 0 0 5px rgba(2,132,199,0)' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.5)' },
          '50%': { boxShadow: '0 0 0 5px rgba(245,158,11,0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.3s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
