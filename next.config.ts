import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable dev indicators (Next.js logo)
  devIndicators: false,
  // Enable experimental features
  experimental: {
    // Enable server actions for forms
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'Mutabaqah.ai',
  },
};

export default nextConfig;
