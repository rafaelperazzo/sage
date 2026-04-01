/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sala: {
          aula: '#3B82F6',       // blue-500
          inovacao: '#8B5CF6',   // violet-500
          lab: '#10B981',        // emerald-500
        }
      }
    },
  },
  plugins: [],
}
