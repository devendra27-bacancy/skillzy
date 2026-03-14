export const skillzyTheme = {
  colors: {
    background: "#2b241d",
    backgroundSoft: "#43362a",
    surface: "#f7edd2",
    surfaceMuted: "#efe2bf",
    accent: "#ffcd57",
    accentWarm: "#ff7a59",
    ink: "#171411",
    inkSoft: "#4d4337",
    white: "#fffdf7"
  },
  shadows: {
    card: "0 24px 60px rgba(18, 12, 8, 0.18)",
    floating: "0 18px 36px rgba(18, 12, 8, 0.24)"
  },
  radius: {
    xl: "2rem",
    pill: "999px"
  }
} as const;

export const gradientOptions = [
  "linear-gradient(135deg, #f3e9cf 0%, #fff6df 60%, #f7d87a 100%)",
  "linear-gradient(135deg, #2b241d 0%, #564739 100%)",
  "linear-gradient(135deg, #ffdf98 0%, #ff9f73 100%)"
] as const;
