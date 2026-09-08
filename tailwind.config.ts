import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07152F", // azul-marinho
          900: "#0D2145", // azul secundário
          800: "#152552",
          700: "#1c3268",
          600: "#1E5EFF", // azul DMS
          500: "#3B82F6", // azul claro
        },
        gold: {
          500: "#D4AF37", // dourado
          400: "#dbba4f",
          300: "#F1D77A", // dourado claro
          100: "#f8ecc4",
        },
        neutral: {
          50: "#F4F7FB", // cinza claro
          100: "#eef1f6",
          200: "#e2e4ea",
          400: "#94A3B8", // cinza secundário
          600: "#4b5563",
          800: "#1f2430",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["Georgia", "Cambria", '"Times New Roman"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
