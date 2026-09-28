import type { NextConfig } from "next";

// Static export: the demo must run offline from any static host or `npx serve out`.
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
};

export default config;
