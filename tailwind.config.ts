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
        background: '#f5f3ff',
        foreground: '#1e1b4b',
        border: '#e8e3f5',
        'border-strong': '#c4b5fd',
        card: '#ffffff',
        'card-hover': '#faf8ff',
        muted: '#7c6fa0',
        'muted-foreground': '#a59dc8',
        accent: '#7c3aed',
        success: '#16a34a',
        warning: '#d97706',
        destructive: '#dc2626',
        'success-bg': '#f0fdf4',
        'warning-bg': '#fffbeb',
        'destructive-bg': '#fef2f2',
        'accent-bg': '#ede9fe',
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
