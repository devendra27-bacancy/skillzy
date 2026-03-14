import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skillzy: {
          bg: "#2b241d",
          bgSoft: "#43362a",
          surface: "#f7edd2",
          surfaceMuted: "#efe2bf",
          accent: "#ffcd57",
          warm: "#ff7a59",
          ink: "#171411",
          soft: "#4d4337"
        }
      },
      fontFamily: {
        display: ["Trebuchet MS", "Avenir Next", "sans-serif"],
        body: ["Trebuchet MS", "Avenir Next", "sans-serif"]
      },
      boxShadow: {
        card: "0 24px 60px rgba(18, 12, 8, 0.18)",
        floating: "0 18px 36px rgba(18, 12, 8, 0.24)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
