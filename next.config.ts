import type { NextConfig } from "next";

// Social URLs are public metadata. Tool input is never sent to this config or a server.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_LINKEDIN: process.env.Linkedin,
    NEXT_PUBLIC_FACEBOOK: process.env.Facebook,
    NEXT_PUBLIC_X: process.env.X,
    NEXT_PUBLIC_INSTAGRAM: process.env.Instagram,
    NEXT_PUBLIC_YOUTUBE: process.env.YouTube,
    NEXT_PUBLIC_WEBSITE: process.env.Website,
  },
};

export default nextConfig;
