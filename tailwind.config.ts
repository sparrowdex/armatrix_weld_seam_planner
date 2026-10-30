import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        armatrix: {
          black: "#0A0D0A",
          dark: "#121612",
          surface: "#1A201A",
          surfaceHighlight: "#242C24",
          border: "#2C362C",
          olive: {
            DEFAULT: "#263220",
            light: "#394A31",
            dark: "#1B2317",
          },
          bone: {
            DEFAULT: "#F6F5EE",
            dim: "#E6E4D8",
            dark: "#C8C5B3",
          },
          orange: {
            DEFAULT: "#FF5B00",
            hover: "#E04F00",
            glow: "rgba(255, 91, 0, 0.25)",
          },
          yellow: "#EAB308",
          red: "#EF4444",
          arc: "#38BDF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(255, 91, 0, 0.3)",
        "glow-arc": "0 0 25px 2px rgba(56, 189, 248, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;

