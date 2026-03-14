import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skillzy",
  applicationName: "Skillzy",
  description: "Interactive classroom engagement platform for live lessons, decks, and teacher-led sessions.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/branding/skillzy-mascot-mark.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/icon", sizes: "32x32", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
