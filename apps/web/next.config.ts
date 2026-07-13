import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['NeteaseCloudMusicApi'],
  transpilePackages: [
    '@kernelon/catalog',
    '@kernelon/core',
    '@kernelon/modules',
    '@kernelon/ui',
    '@kernelon/shell',
  ],
};

export default nextConfig;
