import { AuthorizationError, type AuthRequest } from "@cloudflare/workers-oauth-provider";
import type { Env, YnabProps } from "./types.js";
import { exchangeYnabCode, YNAB_AUTHORIZE_URL, YnabClient } from "./ynab-client.js";

/**
 * Handles the two unprotected routes: /authorize (our own consent screen,
 * which is where YNAB's OAuth Application Requirements' mandatory
 * disclaimer lives -- see docs/ynab-guidelines-and-oauth.md) and /callback
 * (YNAB's redirect back after the user approves or denies on YNAB's own
 * site).
 *
 * The parsed AuthRequest from Claude is round-tripped through YNAB's own
 * `state` parameter as base64url JSON, rather than stored server-side --
 * it contains nothing secret (client_id, redirect_uri, scope, PKCE
 * challenge), so there's no separate KV entry to manage or expire.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/authorize" && request.method === "GET") {
      return handleAuthorize(request, env);
    }
    if (url.pathname === "/authorize" && request.method === "POST") {
      return handleAuthorizeApproval(request, env);
    }
    if (url.pathname === "/callback") {
      return handleCallback(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleAuthorize(request: Request, env: Env): Promise<Response> {
  let oauthRequest: AuthRequest;
  try {
    oauthRequest = await env.OAUTH_PROVIDER.parseAuthRequest(request);
  } catch (error) {
    return renderParseError(error);
  }

  const client = await env.OAUTH_PROVIDER.lookupClient(oauthRequest.clientId);
  if (!client) {
    return new Response("Unknown OAuth client.", { status: 400 });
  }

  const encodedRequest = encodeState(oauthRequest);

  return new Response(
    consentPageHtml(client.clientName ?? "This application", encodedRequest, env),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function handleAuthorizeApproval(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Missing or malformed form body.", { status: 400 });
  }
  const encodedRequest = form.get("state");
  const acknowledged = form.get("acknowledged") === "on";

  if (typeof encodedRequest !== "string") {
    return new Response("Missing state.", { status: 400 });
  }
  if (!acknowledged) {
    return new Response(
      "You must acknowledge that this connector is not officially supported by YNAB before continuing.",
      { status: 400 },
    );
  }

  const ynabAuthorizeUrl = new URL(YNAB_AUTHORIZE_URL);
  ynabAuthorizeUrl.searchParams.set("client_id", env.YNAB_CLIENT_ID);
  ynabAuthorizeUrl.searchParams.set("redirect_uri", env.YNAB_REDIRECT_URI);
  ynabAuthorizeUrl.searchParams.set("response_type", "code");
  ynabAuthorizeUrl.searchParams.set("state", encodedRequest);

  return Response.redirect(ynabAuthorizeUrl.toString(), 302);
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`YNAB authorization was not completed: ${error}`, { status: 400 });
  }
  if (!code || !state) {
    return new Response("Missing code or state from YNAB's redirect.", { status: 400 });
  }

  let oauthRequest: AuthRequest;
  try {
    oauthRequest = decodeState(state);
  } catch {
    return new Response("Invalid or expired authorization state.", { status: 400 });
  }

  const tokens = await exchangeYnabCode(env, code);
  const ynabUserId = await new YnabClient(tokens.access_token).getUserId();

  const props: YnabProps = {
    ynabAccessToken: tokens.access_token,
    ynabRefreshToken: tokens.refresh_token,
    ynabExpiresAt: Date.now() + tokens.expires_in * 1000,
  };

  const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthRequest,
    userId: ynabUserId,
    metadata: { label: "YNAB account" },
    scope: oauthRequest.scope,
    props,
  });

  return Response.redirect(redirectTo, 302);
}

function renderParseError(error: unknown): Response {
  if (!(error instanceof AuthorizationError)) throw error;
  if (!error.redirectUri) {
    return new Response(error.description, { status: 400 });
  }
  const redirect = new URL(error.redirectUri);
  redirect.searchParams.set("error", error.code);
  redirect.searchParams.set("error_description", error.description);
  if (error.state) redirect.searchParams.set("state", error.state);
  return Response.redirect(redirect.toString(), 302);
}

function encodeState(oauthRequest: AuthRequest): string {
  return btoa(JSON.stringify(oauthRequest)).replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeState(encoded: string): AuthRequest {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64)) as AuthRequest;
}

function consentPageHtml(clientName: string, encodedRequest: string, env: Env): string {
  const escapedClientName = clientName.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Connect to YNAB</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; color: #1a1a1a; }
  .disclaimer { background: #fff8e6; border: 1px solid #e6c200; border-radius: 6px; padding: 1rem; margin: 1.5rem 0; }
  label { display: flex; gap: 0.5rem; align-items: flex-start; margin: 1.5rem 0; }
  button { background: #1a5f3f; color: white; border: none; border-radius: 6px; padding: 0.75rem 1.5rem; font-size: 1rem; cursor: pointer; }
  button:disabled { background: #999; cursor: not-allowed; }
</style>
</head>
<body>
  <h1>Connect ${escapedClientName} to YNAB</h1>
  <p><strong>${escapedClientName}</strong> is requesting access to your YNAB budget through Budget Assistant for YNAB.</p>
  <div class="disclaimer">
    <strong>Budget Assistant for YNAB is not made, endorsed, or officially supported by YNAB in any way.</strong>
    It is an independent, third-party integration built against YNAB's public API.
    Read the <a href="${env.PRIVACY_POLICY_URL}" target="_blank">privacy policy</a> and
    <a href="${env.TERMS_URL}" target="_blank">terms of service</a> before continuing.
  </div>
  <form method="POST" action="/authorize">
    <input type="hidden" name="state" value="${encodedRequest}">
    <label>
      <input type="checkbox" name="acknowledged" required onclick="document.getElementById('continue').disabled = !this.checked">
      I understand this connector is not officially supported by YNAB, and I've read the privacy policy and terms of service.
    </label>
    <button id="continue" type="submit" disabled>Continue to YNAB</button>
  </form>
</body>
</html>`;
}
