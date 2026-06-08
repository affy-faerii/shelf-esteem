import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        sans: ["var(--font-instrument)", "sans-serif"],
      },
      colors: {
        gold: "#c9a84c",
        rust: "#b84e24",
        ink: "#0c0c0e",
        cream: "#f5f1ea",
      },
    },
  },
  plugins: [],
};
export default config;
