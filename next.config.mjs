/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', 'three-stdlib'],
  turbopack: {},
};

export default nextConfig;
