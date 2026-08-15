/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['localhost', '127.0.0.1', '*.manus.computer', '5000-i79l6w9j2mqsxahfjxyg0-011c1b0a.us2.manus.computer'],
};

module.exports = nextConfig;
