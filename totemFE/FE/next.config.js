/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "out",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.visitjeju.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

// JavaScript 환경에서는 'module.exports'를 사용해야 합니다.
module.exports = nextConfig;
