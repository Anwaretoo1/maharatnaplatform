import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure Prisma Client works correctly in serverless
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
