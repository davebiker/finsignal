/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@gadicc/fetch-mock-cache': false,
      '@gadicc/fetch-mock-cache/engines/fs': false,
    };
    return config;
  },
};

module.exports = nextConfig;