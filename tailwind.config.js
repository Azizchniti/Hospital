/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef7f1',
          100: '#d5ecde',
          200: '#aed9bf',
          400: '#4dab74',
          600: '#1a6b3c',
          700: '#155730',
          800: '#103f23',
          900: '#0a2917',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
