import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kernelon/core', '@kernelon/ui', '@kernelon/shell'],
};

export default nextConfig;
