/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        // pages/index.js only redirects client side, so crawlers saw an empty
        // 200. This makes the hand-off a real 308 at the edge.
        source: '/',
        destination: '/app',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
