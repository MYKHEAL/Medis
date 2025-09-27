import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper static file serving
  images: {
    domains: ['ipfs.io'],
  },
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
