import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// When STUDIO_STATIC_EXPORT=true (set by the Maven `with-frontend` build) produce a
// fully static export served by the Java backend under the `/studio` base path, so a
// single `java -jar` serves both the API and the UI. Otherwise keep the standard
// standalone output used by `pnpm dev:studio` (root path, separate :3000 dev server).
const staticExport = process.env.STUDIO_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nubase/ui', '@nubase/config'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    optimizePackageImports: ['lucide-react'],
  },
  ...(staticExport
    ? {
        output: 'export',
        basePath: '/studio',
        trailingSlash: true,
      }
    : {
        output: 'standalone',
      }),
};

export default nextConfig;
