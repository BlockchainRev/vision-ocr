import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'vision-ocr': path.resolve(__dirname, '../dist/src/index.js'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      'vision-ocr': '../dist/src/index.js',
    },
  },
};

export default nextConfig;
