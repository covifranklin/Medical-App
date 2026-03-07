import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm backgrounds
        cream: {
          50: "#FFFCF7",
          100: "#FFF8EE",
          200: "#FFF0DC",
        },
        // Sage green — primary accent
        sage: {
          50: "#F4F7F4",
          100: "#E4ECE4",
          200: "#C8D9C8",
          300: "#A3BFA3",
          400: "#7DA47D",
          500: "#5E8A5E",
          600: "#4A7050",
          700: "#3D5C42",
          800: "#334A37",
          900: "#2B3E2F",
        },
        // Dusty teal — secondary accent
        teal: {
          50: "#F0F7F7",
          100: "#DAEEED",
          200: "#B8DDD9",
          300: "#88C5BF",
          400: "#5FA9A2",
          500: "#468F88",
          600: "#39756F",
          700: "#325F5B",
          800: "#2C4E4B",
          900: "#284240",
        },
        // Warm neutrals (replacing cold grays)
        warm: {
          50: "#FDFCFA",
          100: "#F8F6F3",
          200: "#F0EDE8",
          300: "#E4DFD8",
          400: "#C5BDB2",
          500: "#A69D90",
          600: "#877D70",
          700: "#6B6258",
          800: "#504840",
          900: "#3A342E",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)",
        card: "0 2px 8px -2px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)",
        elevated: "0 4px 16px -4px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
