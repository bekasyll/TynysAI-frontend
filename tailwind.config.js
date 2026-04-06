/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#4664E0',
          teal: '#1CBEAF',
          navy: '#0C1A2E',
          'navy-light': '#122236',
          'navy-mid': '#1A3050',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4664E0',
          700: '#3a54c8',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#1CBEAF',
          700: '#0d9488',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4664E0 0%, #1CBEAF 100%)',
        'brand-gradient-dark': 'linear-gradient(135deg, #0C1A2E 0%, #122A40 100%)',
      },
      boxShadow: {
        'brand': '0 4px 24px rgba(70, 100, 224, 0.25)',
        'teal': '0 4px 24px rgba(28, 190, 175, 0.20)',
      },
    },
  },
  plugins: [],
}
