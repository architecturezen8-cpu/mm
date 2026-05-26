import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:",
  "script-src-elem 'self' 'unsafe-inline' blob: data:",
  "script-src-attr 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com https://player.vimeo.com https://www.facebook.com https://web.facebook.com https://m.facebook.com https://www.dailymotion.com https://www.tiktok.com https://www.instagram.com https://*.google.com https://*.tiktokv.com https://*.fbcdn.net https://*.instagram.com",
  "frame-ancestors 'self'",
  "connect-src 'self' https: blob: wss: https://script.google.com https://api.open-meteo.com https://cdn.jsdelivr.net https://raw.githubusercontent.com https://api.cloudflare.com",
  "media-src 'self' blob: data: https:",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
].join('; ');

const nextConfig: NextConfig = {
  output: "standalone",

  // Set Turbopack root to fix workspace root inference error
  turbopack: {
    root: process.cwd(),
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  // External packages that use Node.js native modules or are too heavy for Edge
  // These won't be bundled in the Cloudflare Worker
  serverExternalPackages: [
    'better-sqlite3',
    'sharp',
    '@prisma/client',
    '@libsql/client',
    '@libsql/core',
    '@libsql/hrana-client',
    '@libsql/isomorphic-ws',
    'prisma',
    '@supabase/supabase-js',
  ],

  images: {
    remotePatterns: [
      // GitHub CDN (jsDelivr)
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      // Facebook / Instagram CDN
      {
        protocol: "https",
        hostname: "scontent.fcmb1-2.fna.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      // General fallback — allow all external images
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
