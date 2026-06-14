// Colores = paleta de marca (vixxer-docs/brand/colors.md). No inventes colores aquí.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0f1720',
        surface: '#16212b',
        'surface-strong': '#1d2a36',
        text: '#f6f8fb',
        muted: '#aab6c3',
        green: '#35d487',
        blue: '#65a7ff',
        amber: '#ffd166',
      },
    },
  },
  plugins: [],
};
