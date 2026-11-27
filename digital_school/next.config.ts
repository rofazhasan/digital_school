import type { NextConfig } from 'next';
// @ts-ignore
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/opencv\.js$/, /.*\.map$/, /workers\/.*\.js$/],
  publicExcludes: ['!workers/**/*', '!opencv.js'],
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Fix for navigation issues in production
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      'recharts',
      'lucide-react',
      'framer-motion',
      'date-fns'
    ],
  },
  // Ensure proper client-side navigation
  trailingSlash: false,
  // Disable image optimization for Netlify/Azure if needed
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
