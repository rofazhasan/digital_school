const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  turbopack: {},
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Fix for navigation issues in production
  experimental: {
    scrollRestoration: true,
  },
  // Ensure proper client-side navigation
  trailingSlash: false,
  // Netlify specific optimizations
  output: 'standalone',
  // Disable image optimization for Netlify (handled by Netlify's image optimization)
  images: {
    unoptimized: true,
  },
});

module.exports = nextConfig;
