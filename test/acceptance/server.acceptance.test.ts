import { describe, expect, it } from "vitest";

// Black-box checks against a running `wrangler dev` instance (see
// ../../Makefile's acceptance-tests target, which starts this in Docker
// before running this file). Deliberately limited to routes that don't
// need a real YNAB account: the point is to catch routing/config
// regressions (wrong status codes, broken OAuth discovery metadata) using
// the real workerd runtime, not to re-exercise logic already covered by
// the unit tests in src/*.test.ts.
const BASE_URL = process.env.ACCEPTANCE_BASE_URL ?? "http://localhost:8787";

describe("deployed Worker (acceptance)", () => {
  it("404s on an unhandled route", async () => {
    const response = await fetch(`${BASE_URL}/`);
    expect(response.status).toBe(404);
  });

  it("requires auth on /mcp", async () => {
    const response = await fetch(`${BASE_URL}/mcp`);
    expect(response.status).toBe(401);
  });

  it("rejects a bare /authorize request with no OAuth params", async () => {
    const response = await fetch(`${BASE_URL}/authorize`);
    expect(response.status).toBe(400);
  });

  it("rejects a POST /authorize with no state", async () => {
    const response = await fetch(`${BASE_URL}/authorize`, { method: "POST" });
    expect(response.status).toBe(400);
  });

  it("serves OAuth authorization server metadata with CIMD advertised", async () => {
    const response = await fetch(`${BASE_URL}/.well-known/oauth-authorization-server`);
    expect(response.status).toBe(200);

    const metadata = (await response.json()) as Record<string, unknown>;
    expect(metadata.authorization_endpoint).toContain("/authorize");
    expect(metadata.token_endpoint).toContain("/token");
    expect(metadata.client_id_metadata_document_supported).toBe(true);
    expect(metadata.scopes_supported).toContain("ynab:read");
  });

  it("serves protected resource metadata scoped to /mcp", async () => {
    // Per RFC 9728 §3.1, scoped to the /mcp resource path since that's
    // what resourceMetadata.resource is configured to in src/index.ts.
    const response = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource/mcp`);
    expect(response.status).toBe(200);

    const metadata = (await response.json()) as Record<string, unknown>;
    expect(metadata.resource_name).toBe("Budget Assistant for YNAB");
    expect(metadata.scopes_supported).toContain("ynab:read");
  });
});
