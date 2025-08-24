/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./popup/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        'eventconnect-blue': '#3B82F6',
        'eventconnect-green': '#10B981',
        'eventconnect-orange': '#F59E0B'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      }
    }
  },
  plugins: []
};
