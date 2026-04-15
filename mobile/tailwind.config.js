/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        sala: {
          aula: '#3B82F6',
          inovacao: '#8B5CF6',
          lab: '#10B981',
        },
      },
    },
  },
  plugins: [],
};
