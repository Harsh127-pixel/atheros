/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#6d28d9", // Purple
          light: "#a78bfa",
          dark: "#4c1d95"
        },
        accent: {
          DEFAULT: "hsl(210 100% 50%)", // Blue
          light: "hsl(210 100% 70%)",
          dark: "hsl(210 100% 30%)"
        }
      },
      backgroundImage: {
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass': 'rgba(255, 255, 255, 0.05)'
      },
      boxShadow: {
        'premium': '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }
    },
  },
  plugins: [],
};
