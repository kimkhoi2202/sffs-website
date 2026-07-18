import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The quiz now lives at the root (/). Keep old links working.
  async redirects() {
    return [
      {
        source: "/smart-or-fart",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
