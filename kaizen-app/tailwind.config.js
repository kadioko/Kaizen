/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
  plugins: []
};
