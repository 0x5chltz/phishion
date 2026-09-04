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
  webpack(config, { isServer }) {
    // Three.js uses modern class field syntax that Terser in Next 12 can't minify.
    // Exclude it from minification by disabling Terser on its chunks.
    if (!isServer) {
      const TerserPlugin = config.optimization.minimizer.find(
        (p) => p.constructor && p.constructor.name === 'TerserPlugin'
      );
      if (TerserPlugin) {
        const prev = TerserPlugin.options.exclude;
        TerserPlugin.options.exclude = /three/;
      }
    }
    return config;
  },
};

module.exports = nextConfig;
