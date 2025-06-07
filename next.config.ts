
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
        destination: 'https://api.spitespiral.com/trap/1e75948c-bd6d-4d14-ace9-f694de45dc24',
        permanent: true, // 308 redirect
      },
      {
        source: '/sneedsfeedandseed/', // Explicitly match with trailing slash
        destination: 'https://api.spitespiral.com/trap/1e75948c-bd6d-4d14-ace9-f694de45dc24',
        permanent: true, // 308 redirect
      },
    ];
  },
};

export default nextConfig;
