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
  experimental: {
    allowedDevOrigins: [
      'https://3000-firebase-studio-1748446151693.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
      'https://3002-firebase-studio-1748446151693.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
      'https://9003-firebase-studio-1748446151693.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
 ],
  },
};

export default nextConfig;
