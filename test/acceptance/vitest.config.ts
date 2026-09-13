import { defineConfig } from "vitest/config";

// Separate from the root vitest.config.ts (unit tests only, src/**/*.test.ts)
// so `npm test` never tries to run these against a server that isn't
// running. Invoked via `make acceptance-tests`, never directly.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ["**/*.acceptance.test.ts"],
  },
});
