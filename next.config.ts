import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Social URLs are public metadata. Tool input is never sent to this config or a server.
const nextConfig = (phase: string): NextConfig => ({
  // Keep dev and production artifacts separate. Running `next build` while the
  // dev server is open must not invalidate its active Webpack module graph.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_LINKEDIN: process.env.Linkedin,
    NEXT_PUBLIC_FACEBOOK: process.env.Facebook,
    NEXT_PUBLIC_X: process.env.X,
    NEXT_PUBLIC_INSTAGRAM: process.env.Instagram,
    NEXT_PUBLIC_YOUTUBE: process.env.YouTube,
    NEXT_PUBLIC_WEBSITE: process.env.Website,
  },
});

export default nextConfig;
