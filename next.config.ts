import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const securityHeaders = (development: boolean) => {
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-XSS-Protection", value: "0" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "no-referrer" },
    {
      key: "Permissions-Policy",
      value:
        "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), xr-spatial-tracking=(), clipboard-read=(self), clipboard-write=(self)",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "Origin-Agent-Cluster", value: "?1" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ];
};

// Social URLs are public metadata. Tool input is never sent to this config or a server.
const nextConfig = (phase: string): NextConfig => {
  const development = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Keep dev and production artifacts separate. Running `next build` while the
    // dev server is open must not invalidate its active Webpack module graph.
    distDir: development ? ".next-dev" : ".next",
    reactStrictMode: true,
    poweredByHeader: false,
    async headers() {
      return [{ source: "/(.*)", headers: securityHeaders(development) }];
    },
    env: {
      NEXT_PUBLIC_LINKEDIN: process.env.Linkedin,
      NEXT_PUBLIC_FACEBOOK: process.env.Facebook,
      NEXT_PUBLIC_X: process.env.X,
      NEXT_PUBLIC_INSTAGRAM: process.env.Instagram,
      NEXT_PUBLIC_YOUTUBE: process.env.YouTube,
      NEXT_PUBLIC_WEBSITE: process.env.Website,
    },
  };
};

export default nextConfig;
