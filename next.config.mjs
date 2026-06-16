/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Konva references the Node-only `canvas` package for server-side rendering.
    // We only ever use Konva in the browser, so stub it out to avoid bundling errors.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
