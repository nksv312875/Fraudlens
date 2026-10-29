/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#060B19',
          800: '#0B132B',
          700: '#111D42',
        },
        slate: {
          950: '#090D16',
          900: '#0F172A',
          850: '#162032',
          800: '#1E293B',
          700: '#334155',
          600: '#475569'
        },
        brand: {
          cyan: '#06B6D4',
          teal: '#14B8A6',
          blue: '#3B82F6',
          amber: '#F59E0B',
          red: '#EF4444',
          emerald: '#10B981'
        }
      }
    },
  },
  plugins: [],
}
