import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moonlace/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://localhost:4000"}/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
