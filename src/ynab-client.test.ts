import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./types.js";
import { exchangeYnabCode, refreshYnabToken, YnabApiError, YnabClient } from "./ynab-client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("YnabClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listPlans sends a bearer token and unwraps the data envelope", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { plans: [{ id: "b1", name: "My Plan" }] } }));

    const client = new YnabClient("token-123");
    const plans = await client.listPlans();

    expect(plans).toEqual([{ id: "b1", name: "My Plan" }]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.ynab.com/v1/plans");
    expect(init.headers.Authorization).toBe("Bearer token-123");
  });

  it("getPlanMonth builds the path from planId and month", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          month: { month: "2026-09-01", to_be_budgeted: 0, age_of_money: 12, categories: [] },
        },
      }),
    );

    const client = new YnabClient("t");
    await client.getPlanMonth("plan-1", "current");

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.ynab.com/v1/plans/plan-1/months/current");
  });

  it("listTransactions omits since_date when not provided", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { transactions: [] } }));

    const client = new YnabClient("t");
    await client.listTransactions("plan-1", {});

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.ynab.com/v1/plans/plan-1/transactions");
  });

  it("listTransactions includes since_date and scopes to a category when provided", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { transactions: [] } }));

    const client = new YnabClient("t");
    await client.listTransactions("plan-1", { categoryId: "cat-1", sinceDate: "2026-01-01" });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.ynab.com/v1/plans/plan-1/categories/cat-1/transactions?since_date=2026-01-01",
    );
  });

  it("throws YnabApiError with status and path, without leaking the response body", async () => {
    fetchMock.mockResolvedValue(
      new Response("sensitive plan data in the error body", { status: 429 }),
    );

    const client = new YnabClient("t");
    await expect(client.listPlans()).rejects.toMatchObject({
      name: "YnabApiError",
      status: 429,
      path: "/plans",
    });
    await expect(client.listPlans()).rejects.not.toThrow(
      expect.objectContaining({ message: expect.stringContaining("sensitive") }),
    );
  });

  it("YnabApiError message includes status and path only", () => {
    const error = new YnabApiError(404, "/plans/x/months/current");
    expect(error.message).toBe(
      "YNAB API request to /plans/x/months/current failed with status 404",
    );
  });
});

describe("token exchange", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const env = {
    YNAB_CLIENT_ID: "client-id",
    YNAB_CLIENT_SECRET: "client-secret",
    YNAB_REDIRECT_URI: "https://example.workers.dev/callback",
  } as Env;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchangeYnabCode posts the authorization_code grant with client credentials", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: "at",
        refresh_token: "rt",
        expires_in: 7200,
        token_type: "bearer",
      }),
    );

    const tokens = await exchangeYnabCode(env, "auth-code-123");

    expect(tokens.access_token).toBe("at");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://app.ynab.com/oauth/token");
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code-123");
    expect(body.get("redirect_uri")).toBe("https://example.workers.dev/callback");
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("client_secret")).toBe("client-secret");
  });

  it("refreshYnabToken posts the refresh_token grant", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: "at2",
        refresh_token: "rt2",
        expires_in: 7200,
        token_type: "bearer",
      }),
    );

    await refreshYnabToken(env, "old-refresh-token");

    const [, init] = fetchMock.mock.calls[0]!;
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("old-refresh-token");
  });

  it("throws when the token endpoint responds with a non-2xx status", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 401 }));

    await expect(refreshYnabToken(env, "bad-token")).rejects.toThrow(
      "YNAB token endpoint returned 401",
    );
  });
});
