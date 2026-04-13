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
        background: '#0a0a0a',
        foreground: '#ededed',
        border: '#222222',
        'border-strong': '#333333',
        card: '#111111',
        'card-hover': '#171717',
        muted: '#a1a1a1',
        'muted-foreground': '#666666',
        accent: '#0070f3',
        success: '#00c853',
        warning: '#f5a623',
        destructive: '#ee0000',
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
