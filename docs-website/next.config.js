/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // For static export to Vercel
  output: 'export',
  basePath: '',
};

module.exports = nextConfig;
