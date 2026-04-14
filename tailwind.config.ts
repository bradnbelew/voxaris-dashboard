import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        border: '#e2e8f0',
        'border-strong': '#cbd5e1',
        card: '#ffffff',
        'card-hover': '#f1f5f9',
        muted: '#64748b',
        'muted-foreground': '#94a3b8',
        accent: '#2563eb',
        success: '#16a34a',
        warning: '#d97706',
        destructive: '#dc2626',
        'success-bg': '#f0fdf4',
        'warning-bg': '#fffbeb',
        'destructive-bg': '#fef2f2',
        'accent-bg': '#eff6ff',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
