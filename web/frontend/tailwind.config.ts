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
        // Main colors
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
        error: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        // Brand Specific Colors
        brand: {
          blue: '#0B4F6C',
          gold: '#C58A17',
          green: '#4CAF50',
        },
        // Background colors
        background: {
          light: '#F8FAFC',
          dark: '#020617',
        },
        // Text colors
        text: {
          primary: '#0F172A',
          muted: '#64748B',
        },
        // Border colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // Add custom background images or other utilities if needed
    },
  },
  plugins: [],
}
export default config
