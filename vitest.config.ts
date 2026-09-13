import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Plain node environment, not @cloudflare/vitest-pool-workers -- the
// modules under unit test (ynab-client.ts, oauth-handler.ts) are pure
// enough (global fetch, no Durable Object state) not to need the real
// workerd runtime. That realism gap is covered instead by the Docker-based
// acceptance tests (see Makefile) exercising an actual `wrangler dev`.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  // Without this, Vite treats @cloudflare/workers-oauth-provider as an
  // externalized SSR dependency and loads it via Node's native import(),
  // which bypasses resolve.alias below entirely -- this forces it through
  // Vite's own transform/resolve pipeline instead, where the alias applies.
  ssr: {
    noExternal: ["@cloudflare/workers-oauth-provider"],
  },
  resolve: {
    alias: {
      // See test/stubs/cloudflare-workers.ts for why this is needed.
      "cloudflare:workers": fileURLToPath(
        new URL("./test/stubs/cloudflare-workers.ts", import.meta.url),
      ),
    },
  },
});
