/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
};

// JavaScript 환경에서는 'module.exports'를 사용해야 합니다.
module.exports = nextConfig;
