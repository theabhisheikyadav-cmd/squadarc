import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reads its data file from disk at runtime, so load it with plain Node require.
  serverExternalPackages: ["all-the-cities"],
};

export default nextConfig;
