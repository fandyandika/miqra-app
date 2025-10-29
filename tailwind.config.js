/** @type {import('tailwindcss').Config} */
module.exports = {
  // Required by NativeWind v4
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: '#10b981',
        secondary: '#FF8A65',
        accent: '#FFB627',

        // Neutrals
        background: '#FAFAFA',
        surface: '#FFFFFF',
        sand: '#FFF8F0',

        // Text
        charcoal: '#1A1A1A',
        'text-secondary': '#666666',

        // Semantic
        border: '#E5E5E5',
        error: '#EF4444',
        success: '#10B981',

        // Additional
        forest: '#1B5E4F',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        16: '64px',
      },
    },
  },
  plugins: [],
};
