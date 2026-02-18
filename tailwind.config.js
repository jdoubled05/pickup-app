/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media', // Uses system preference for dark mode
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors (same in both modes)
        'brand': '#960000',
        'brand-light': '#B71C1C',
        'brand-dark': '#7A0000',

        'accent': '#D32F2F',
        'accent-light': '#EF5350',
        'accent-dark': '#C62828',

        'secondary': '#00BCD4',
        'secondary-light': '#26C6DA',
        'secondary-dark': '#0097A7',

        'court': '#43A047',
        'court-light': '#66BB6A',
        'court-dark': '#2E7D32',

        'vibrant-cyan': '#00E5FF',
        'vibrant-gold': '#FFD700',
        'vibrant-orange': '#FF6F00',

        'status-active': '#43A047',
        'status-inactive': '#757575',
        'status-warning': '#FFD700',
        'status-error': '#D32F2F',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'DEFAULT': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
