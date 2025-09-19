/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "out",
  
  /**
   * GitHub Pages 배포를 위한 설정
   * 저장소 이름이 'totem'이라고 가정합니다.
   */
  basePath: isProd ? '/totem' : '',
  assetPrefix: isProd ? '/totem/' : '',
  
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
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// JavaScript 환경에서는 'module.exports'를 사용해야 합니다.
module.exports = nextConfig;
