/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        navy: {
          50: '#E8EEF5',
          100: '#C5D3E8',
          200: '#9FB5D8',
          300: '#7997C8',
          400: '#5C80BC',
          500: '#3F69B0',
          600: '#2D5494',
          700: '#1E4278',
          800: '#0F3A6B',
          900: '#0A2A4E',
          950: '#061B33'
        },
        gold: {
          50: '#FBF6E8',
          100: '#F5E9C4',
          200: '#EDDA9B',
          300: '#E5CB72',
          400: '#D4AF37',
          500: '#C49B2A',
          600: '#A88324',
          700: '#8B6B1E',
          800: '#6E5418',
          900: '#513D12'
        },
        offwhite: '#F5F5F5'
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
