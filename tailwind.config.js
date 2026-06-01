/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          ink: '#172033',
          navy: '#24415f',
          blue: '#2563eb',
          mist: '#eaf2ff',
          sky: '#dbeafe',
          slate: '#526171',
          line: '#d8e0ea',
          green: '#16815f',
          amber: '#b7791f',
          red: '#b42318'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(23, 32, 51, 0.08)'
      }
    }
  },
  plugins: []
};
