import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B4F6C',
          foreground: '#F8FAFC',
        },
        accent: {
          DEFAULT: '#C58A17',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#4CAF50',
          foreground: '#FFFFFF',
        },
        brand: {
          blue: '#0B4F6C',
          gold: '#C58A17',
          green: '#4CAF50',
          navy: '#0B4F6C',
          slate: '#0F172A',
          ghost: '#F8FAFC',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'brand': '0 4px 20px -2px rgba(10, 31, 68, 0.05)',
        'accent': '0 4px 20px -2px rgba(249, 115, 22, 0.15)',
      }
    },
  },
  plugins: [],
}
export default config