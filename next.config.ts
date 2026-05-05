import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prefer this app as Turbopack root when other lockfiles exist higher in the tree.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
