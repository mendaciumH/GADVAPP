/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBM Carbon Design System - B2B Travel Management
        primary: {
          DEFAULT: '#0F62FE', // Blue 60 - Core action color
          dark: '#002D9C',    // Blue 80 - Dark variant
          light: '#4589FF',   // Blue 50 - Light variant
          hover: '#0050E6',   // Blue 70 - Hover state
        },
        secondary: {
          DEFAULT: '#08BDBA', // Teal 40 - Travel freshness
          dark: '#005D5D',    // Teal 60 - Dark variant
          light: '#20D5D2',   // Teal 30 - Light variant
        },
        accent: {
          DEFAULT: '#FF7EB6', // Warm Coral - Travel inspiration
          dark: '#FF50A0',    // Darker coral
          light: '#FFA6C9',   // Lighter coral
        },
        // Gray Scale (IBM Carbon)
        gray: {
          10: '#F4F4F4',  // Background UI
          20: '#E5E5E5',  // Subtle background
          30: '#E0E0E0',  // Border/Divider
          40: '#C6C6C6',  // Disabled elements
          50: '#A8A8A8',  // Placeholder text
          60: '#8D8D8D',  // Secondary icons
          70: '#525252',  // Text Secondary
          80: '#393939',  // Text Tertiary
          90: '#161616',  // Text Primary
          100: '#262626', // Dark mode surface
        },
        // Semantic Colors
        success: {
          DEFAULT: '#24A148', // Green 50
          dark: '#198038',
          light: '#42BE65',
        },
        warning: {
          DEFAULT: '#F1C21B', // Yellow 30
          dark: '#D2A106',
          light: '#FDD13A',
        },
        error: {
          DEFAULT: '#DA1E28', // Red 60
          dark: '#A2191F',
          light: '#FA4D56',
        },
        info: {
          DEFAULT: '#4589FF', // Blue 50
          dark: '#0043CE',
          light: '#6EA6FF',
        },
        // Legacy support
        background: '#F4F4F4', // Gray 10
        surface: '#FFFFFF',     // White
        text: {
          primary: '#161616',   // Gray 90
          secondary: '#525252', // Gray 70
          disabled: '#A8A8A8',  // Gray 50
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

