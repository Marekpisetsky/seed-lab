import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A static site: no server routes, no functions. `next build` writes plain
  // HTML/CSS/JS to out/, served as-is from the CDN.
  output: "export",
};

export default nextConfig;
