import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A static site: no server routes, no functions. `next build` writes plain
  // HTML/CSS/JS to out/, served as-is from the CDN.
  output: "export",
  // seed-kit (packages/seed-kit: the tokens, the header and footer, the tool
  // list) is imported from the code, outside this folder: the bundler looks
  // from the repository's root.
  turbopack: { root: fileURLToPath(new URL("../..", import.meta.url)) },
  // Types are checked by `npm run typecheck` (tsconfig.typecheck.json), which
  // `npm run build` runs first: Next's own check cannot find React's types
  // for seed-kit's component.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
