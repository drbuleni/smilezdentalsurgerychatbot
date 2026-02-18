import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Allow the /widget page to be embedded in iframes (for Wix)
  async headers() {
    return [
      {
        source: "/widget",
        headers: [
          // Allow any origin to embed the widget in an iframe.
          // X-Frame-Options is intentionally omitted — the only valid permissive
          // option is to not set it. frame-ancestors * in CSP handles modern browsers.
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        // CORS headers for API routes (so the widget can call the API cross-origin)
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, x-admin-password" },
        ],
      },
    ];
  },

  // Required for pdf-parse (uses Node.js fs module)
  serverExternalPackages: ["pdf-parse"],

  // Empty turbopack config to suppress the "missing turbopack config" warning
  turbopack: {},
};

export default nextConfig;
