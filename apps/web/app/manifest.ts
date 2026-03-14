import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skillzy",
    short_name: "Skillzy",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ff",
    theme_color: "#ece5ff",
    icons: [
      {
        src: "/brand-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/brand-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/branding/skillzy-mascot-full.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
