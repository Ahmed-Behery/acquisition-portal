import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Pin the trace root to this project; otherwise Next can pick up an unrelated
  // lockfile higher up the tree and warn on every build.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),

  // Keep the MUI/Emotion runtime out of the shared bundle where it isn't used and
  // let Next tree-shake per-component imports.
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
  },

  async headers() {
    return [
      {
        // The app renders shared, per-user state — never let a proxy cache a document.
        source: '/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
