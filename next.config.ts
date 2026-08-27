
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  allowedDevOrigins: [
    'https://9003-firebase-studio-1748446151693.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
  ],
  async headers() {
    return [
      {
        source: '/(.*)', // Apply these headers to all routes
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Deprecated by modern browsers in favor of CSP, but good for older ones.
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Content-Security-Policy (CSP) is powerful but can be complex to configure correctly
          // without breaking functionality. A very basic one could be added, but it's
          // often application-specific. Example:
          // {
          //   key: 'Content-Security-Policy',
          //   value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://placehold.co data:; font-src 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self';"
          // }
          // For now, we'll omit CSP as it requires careful tuning.
        ],
      },
    ];
  },
};

export default nextConfig;
