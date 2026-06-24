import type { NextConfig } from "next";

// Proxying the Django backend through this same origin keeps cookies
// (auth + CSRF) first-party in the browser. Without this, the backend's
// Set-Cookie responses belong to its own *.vercel.app domain, which the
// frontend's JS can never read via document.cookie, and which SameSite=Lax
// would block on cross-site requests anyway.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
    ];
  },
};

export default nextConfig;
