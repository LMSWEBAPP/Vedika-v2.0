const nextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'three', 'katex', '@upstash/redis', '@google/genai'],
  },
  async rewrites() {
    const backendUrl = process.env.FRAPPE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL;
    if (!backendUrl) return [];
    return [
      {
        source: '/api/method/:path*',
        destination: `${backendUrl}/api/method/:path*`,
      },
      {
        source: '/api/resource/:path*',
        destination: `${backendUrl}/api/resource/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
