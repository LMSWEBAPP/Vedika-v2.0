const nextConfig = {
  compress: true,
  transpilePackages: ['feral-blob'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'three', 'katex', '@upstash/redis', '@google/genai'],
  },
  async rewrites() {
    let backendUrl = process.env.FRAPPE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || 'https://vedika-v2-0.onrender.com';
    if (backendUrl.includes('vyomanta.onrender.com')) {
      backendUrl = 'https://vedika-v2-0.onrender.com';
    }
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
