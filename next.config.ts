
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
        destination: 'https://api.spitespiral.com/trap/38e19a7e-1a3f-4bf0-b83f-edd7efe6fceb',
        permanent: true, // 308 redirect
      },
      {
        source: '/sneedsfeedandseed/', // Explicitly match with trailing slash
        destination: 'https://api.spitespiral.com/trap/38e19a7e-1a3f-4bf0-b83f-edd7efe6fceb',
        permanent: true, // 308 redirect
      },
    ];
  },
};

export default nextConfig;
