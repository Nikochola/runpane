const apiTarget = process.env.RUNPANE_API ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["runpane.localhost"],
  experimental: {
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
