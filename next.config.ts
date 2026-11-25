import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      // Si entran por eddubarber.com (o www.eddubarber.com) a la raíz "/", muestra la barbería
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*)eddubarber\\.com",
          },
        ],
        destination: "/eddubarber",
      },
      // Para cualquier subruta de eddubarber.com que no sea la raíz
      {
        source: "/:path((?!eddubarber|_next|api|favicon.ico).*)",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*)eddubarber\\.com",
          },
        ],
        destination: "/eddubarber/:path*",
      },
    ];
  },
};

export default nextConfig;