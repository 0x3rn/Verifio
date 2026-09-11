import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import path from "node:path";

export default function nextConfig(phase: string): NextConfig {
  const isProductionBuild = phase === PHASE_PRODUCTION_BUILD;

  return {
    // The Documents directory also contains unrelated lockfiles. Pinning the
    // Turbopack root keeps resolution and file watching inside this application.
    turbopack: {
      root: path.resolve(__dirname),
      // Postgres.js has a dedicated Cloudflare implementation. Next's normal
      // server compilation selects its Node entry before OpenNext bundles the
      // result, which makes Worker requests call Node TLS with unsupported
      // options such as `rejectUnauthorized`. Resolve it here only for the
      // production Worker build; local `next dev` keeps the normal Node driver.
      ...(isProductionBuild
        ? {
            resolveAlias: {
              postgres: './node_modules/postgres/cf/src/index.js',
            },
          }
        : {}),
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
}
