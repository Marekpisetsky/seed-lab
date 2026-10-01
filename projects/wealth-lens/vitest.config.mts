import { defineConfig } from "vitest/config";
import site from "../../deploy/site.json" with { type: "json" };

export default defineConfig({
  resolve: {
    // Resolve the `@/*` alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.mts"],
    // What next.config.ts writes into the code at build time (src/lib/site.ts).
    env: { SITE_ORIGIN: site.origin, BASE_PATH: site.wealthLensPath },
  },
});
