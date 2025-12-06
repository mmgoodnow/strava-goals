import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    // Explicitly set the root to avoid lockfile auto-detection picking a parent directory.
    root: projectRoot,
  },
};

export default nextConfig;
