
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
        destination: 'https://api.spitespiral.com/trap/17bff108-d97e-42d7-b151-7a2378c56d12',
        permanent: true, // 308 redirect
      },
      {
        source: '/sneedsfeedandseed/', // Explicitly match with trailing slash
        destination: 'https://api.spitespiral.com/trap/17bff108-d97e-42d7-b151-7a2378c56d12',
        permanent: true, // 308 redirect
      },
    ];
  },
};

export default nextConfig;

