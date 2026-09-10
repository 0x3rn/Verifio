import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The Documents directory also contains unrelated lockfiles. Pinning the
  // Turbopack root keeps resolution and file watching inside this application.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // OpenNext's file tracer can otherwise copy pg-cloudflare's package.json
  // without the Worker-specific entry files required by pg at bundle time.
  outputFileTracingIncludes: {
    '**/*': [
      './node_modules/pg-cloudflare/dist/**',
      './node_modules/pg-cloudflare/esm/**',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
