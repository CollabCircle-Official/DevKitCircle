import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DevKitCircle",
    short_name: "DevKitCircle",
    description:
      "Private browser-based utilities for developers and DevSecOps.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#4f46e5",
    icons: [
      { src: "/devkitcircle-logo.png", sizes: "500x500", type: "image/png" },
    ],
  };
}
