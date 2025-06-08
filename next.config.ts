
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/sneedsfeedandseed', // Next.js matches without trailing slash too
        destination: 'https://api.spitespiral.com/trap/b4b37b21-31b5-47f8-81a7-7a9f8a867911',
        permanent: true, // 308 redirect
      },
      {
        source: '/sneedsfeedandseed/', // Explicitly match with trailing slash
        destination: 'https://api.spitespiral.com/trap/b4b37b21-31b5-47f8-81a7-7a9f8a867911',
        permanent: true, // 308 redirect
      },
    ];
  },
};

export default nextConfig;
