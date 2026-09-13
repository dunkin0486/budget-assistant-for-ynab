import {
  AuthorizationError,
  type AuthRequest,
  type ClientInfo,
} from "@cloudflare/workers-oauth-provider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import oauthHandler from "./oauth-handler.js";
import type { Env } from "./types.js";

function encodeState(oauthRequest: AuthRequest): string {
  return btoa(JSON.stringify(oauthRequest)).replace(/\+/g, "-").replace(/\//g, "_");
}

const baseAuthRequest: AuthRequest = {
  responseType: "code",
  clientId: "claude-client",
  redirectUri: "https://claude.ai/api/mcp/auth_callback",
  scope: ["ynab:read"],
  state: "xyz",
  codeChallenge: "challenge",
  codeChallengeMethod: "S256",
} as AuthRequest;

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    MCP_OBJECT: {} as never,
    OAUTH_KV: {} as never,
    OAUTH_PROVIDER: {
      parseAuthRequest: vi.fn(),
      lookupClient: vi.fn(),
      completeAuthorization: vi.fn(),
      createClient: vi.fn(),
    } as never,
    YNAB_CLIENT_ID: "ynab-client-id",
    YNAB_CLIENT_SECRET: "ynab-client-secret",
    YNAB_REDIRECT_URI: "https://budget-assistant-for-ynab.dunkin0486.workers.dev/callback",
    PRIVACY_POLICY_URL: "https://example.com/privacy",
    TERMS_URL: "https://example.com/terms",
    ...overrides,
  };
}

describe("oauthHandler routing", () => {
  it("returns 404 for unmatched routes", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(new Request("https://x/nope"), env);
    expect(response.status).toBe(404);
  });
});

describe("GET /authorize", () => {
  it("returns 400 with the description when parseAuthRequest fails with no redirectUri", async () => {
    const env = makeEnv();
    vi.mocked(env.OAUTH_PROVIDER.parseAuthRequest).mockRejectedValue(
      new AuthorizationError("invalid_request", { description: "missing client_id" }),
    );

    const response = await oauthHandler.fetch(new Request("https://x/authorize"), env);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("missing client_id");
  });

  it("redirects with error params when parseAuthRequest fails but a redirectUri is known", async () => {
    const env = makeEnv();
    vi.mocked(env.OAUTH_PROVIDER.parseAuthRequest).mockRejectedValue(
      new AuthorizationError("invalid_scope", {
        description: "unknown scope",
        redirectUri: "https://claude.ai/api/mcp/auth_callback",
        state: "abc",
      }),
    );

    const response = await oauthHandler.fetch(new Request("https://x/authorize"), env);

    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("Location")!);
    expect(location.origin + location.pathname).toBe("https://claude.ai/api/mcp/auth_callback");
    expect(location.searchParams.get("error")).toBe("invalid_scope");
    expect(location.searchParams.get("error_description")).toBe("unknown scope");
    expect(location.searchParams.get("state")).toBe("abc");
  });

  it("returns 400 for an unrecognized client", async () => {
    const env = makeEnv();
    vi.mocked(env.OAUTH_PROVIDER.parseAuthRequest).mockResolvedValue(baseAuthRequest);
    vi.mocked(env.OAUTH_PROVIDER.lookupClient).mockResolvedValue(null);

    const response = await oauthHandler.fetch(new Request("https://x/authorize"), env);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Unknown OAuth client.");
  });

  it("renders the consent page with an escaped client name and policy links", async () => {
    const env = makeEnv();
    vi.mocked(env.OAUTH_PROVIDER.parseAuthRequest).mockResolvedValue(baseAuthRequest);
    vi.mocked(env.OAUTH_PROVIDER.lookupClient).mockResolvedValue({
      clientId: "claude-client",
      clientName: "<script>Claude</script>",
      redirectUris: [baseAuthRequest.redirectUri],
    } as ClientInfo);

    const response = await oauthHandler.fetch(new Request("https://x/authorize"), env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).not.toContain("<script>Claude</script>");
    expect(html).toContain("&lt;script&gt;Claude&lt;/script&gt;");
    expect(html).toContain(env.PRIVACY_POLICY_URL);
    expect(html).toContain(env.TERMS_URL);
    expect(html).toContain("not made, endorsed, or officially supported by YNAB");
    expect(html).toContain('name="state"');
  });
});

describe("POST /authorize", () => {
  function post(body: Record<string, string>): Request {
    return new Request("https://x/authorize", {
      method: "POST",
      body: new URLSearchParams(body),
    });
  }

  it("returns 400 when state is missing", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(post({ acknowledged: "on" }), env);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Missing state.");
  });

  it("returns 400 rather than crashing on a request with no body at all", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(
      new Request("https://x/authorize", { method: "POST" }),
      env,
    );
    expect(response.status).toBe(400);
  });

  it("requires the disclaimer to be acknowledged", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(post({ state: "encoded" }), env);
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("not officially supported by YNAB");
  });

  it("redirects to YNAB's authorize endpoint with the encoded state round-tripped", async () => {
    const env = makeEnv();
    const encoded = encodeState(baseAuthRequest);

    const response = await oauthHandler.fetch(post({ state: encoded, acknowledged: "on" }), env);

    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("Location")!);
    expect(location.origin + location.pathname).toBe("https://app.ynab.com/oauth/authorize");
    expect(location.searchParams.get("client_id")).toBe(env.YNAB_CLIENT_ID);
    expect(location.searchParams.get("redirect_uri")).toBe(env.YNAB_REDIRECT_URI);
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("state")).toBe(encoded);
  });
});

describe("GET /callback", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when YNAB reports an error", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(
      new Request("https://x/callback?error=access_denied"),
      env,
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("access_denied");
  });

  it("returns 400 when code or state is missing", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(new Request("https://x/callback?code=abc"), env);
    expect(response.status).toBe(400);
  });

  it("returns 400 for an unparseable state", async () => {
    const env = makeEnv();
    const response = await oauthHandler.fetch(
      new Request("https://x/callback?code=abc&state=not-valid-base64!!"),
      env,
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid or expired authorization state.");
  });

  it("exchanges the code, fetches the YNAB user id, and completes authorization", async () => {
    const env = makeEnv();
    const encoded = encodeState(baseAuthRequest);

    fetchMock.mockImplementation((url: string) => {
      if (String(url) === "https://app.ynab.com/oauth/token") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "ynab-at",
              refresh_token: "ynab-rt",
              expires_in: 7200,
              token_type: "bearer",
            }),
            { status: 200 },
          ),
        );
      }
      if (String(url) === "https://api.ynab.com/v1/user") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { user: { id: "ynab-user-1" } } }), { status: 200 }),
        );
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });

    vi.mocked(env.OAUTH_PROVIDER.completeAuthorization).mockResolvedValue({
      redirectTo: "https://claude.ai/api/mcp/auth_callback?code=grant-code",
    });

    const response = await oauthHandler.fetch(
      new Request(`https://x/callback?code=auth-code&state=${encoded}`),
      env,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://claude.ai/api/mcp/auth_callback?code=grant-code",
    );

    const completeArgs = vi.mocked(env.OAUTH_PROVIDER.completeAuthorization).mock.calls[0]![0];
    expect(completeArgs.userId).toBe("ynab-user-1");
    expect(completeArgs.props).toMatchObject({
      ynabAccessToken: "ynab-at",
      ynabRefreshToken: "ynab-rt",
    });
  });
});
