import type { NextConfig } from "next";

// Admin-uploaded media (hero slide images, etc.) is served statically by the
// API server at <origin>/uploads/* - Next/Image requires remote hostnames to
// be explicitly allow-listed, so derive the pattern from the same
// server-only UKSHOP_API_URL every other API call already uses.
const apiOrigin = new URL(process.env.UKSHOP_API_URL ?? "http://localhost:3000/api/v1");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // The API is private; browsers load admin-uploaded media from the storefront, which fetches it
  // from the API server-side. (API calls go through src/app/api/v1/[...path] instead.)
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${apiOrigin.origin}/uploads/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/uploads/**",
      },
    ],
    // UKSHOP_API_URL points at localhost in dev, which Next 16's image
    // optimizer otherwise refuses to fetch from (SSRF guard treats it as a
    // private IP). Harmless in production, where the API is a real domain.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
