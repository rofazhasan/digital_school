import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'standalone',
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
