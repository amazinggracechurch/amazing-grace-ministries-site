import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin and its gRPC/auth dependency tree are server-only
  // runtime packages — bundling them with Turbopack breaks on Node
  // built-ins and dynamic requires.
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/storage",
    "google-auth-library",
    "google-gax",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // Event flyer artwork lives in Firebase Storage (both URL shapes).
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
