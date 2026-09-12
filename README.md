# Budget Assistant for YNAB — MCP Server

Remote MCP server that lets Claude answer questions about a YNAB budget.
Read-only MVP (phase 1 of `docs/personas-and-use-cases.md`):
`list_budgets`, `get_budget_month`, `get_category_history`,
`list_transactions`. None of these call a YNAB endpoint that creates,
edits, or deletes anything — see `docs/privacy-policy.md`.

**Not made, endorsed, or officially supported by YNAB in any way.**

## Architecture

- **Cloudflare Workers**, hosting a Durable-Object-backed MCP server via
  Cloudflare's `agents` SDK (`McpAgent`), and OAuth via
  `@cloudflare/workers-oauth-provider`. Rationale for this stack in
  `docs/hosting-options.md`.
- This server is itself an OAuth provider to Claude (issues its own
  access/refresh tokens, stored in the required `OAUTH_KV` namespace) and
  an OAuth *client* to YNAB (Authorization Code Grant, per
  `docs/ynab-guidelines-and-oauth.md`) — the YNAB token pair lives in the
  MCP Durable Object's props/storage and is refreshed transparently before
  each tool call (`src/mcp-agent.ts`'s `getClient()`).
- `src/oauth-handler.ts` renders YNAB's mandatory "not officially
  supported" disclaimer as an explicit checkbox on the consent screen
  before redirecting to YNAB — required by YNAB's OAuth Application
  Requirements, not just a nicety.
- **Infrastructure** (the KV namespace now; DNS/Pages/Email Routing once
  the domain decision in `docs/website-and-contact-email.md` is made) is
  managed via OpenTofu in `infra/`, kept separate from the Worker code
  deploy itself (`wrangler deploy` handles bundling the TypeScript + npm
  dependencies, which Terraform's own Workers deploy resources don't do
  for you) — see `infra/README.md` for the reasoning.

## Setup

1. **Register the OAuth app with YNAB** (developer settings on your YNAB
   account). Name it in a branding-compliant way — see
   `docs/ynab-guidelines-and-oauth.md` (e.g. "Budget Assistant for YNAB",
   not "YNAB Assistant"). Set its redirect URI to
   `https://<your-worker-url>/callback` (or `http://localhost:8787/callback`
   for local dev). Note: new apps start in YNAB's Restricted Mode
   (25-user cap) — request removal early, per the same doc, since it's a
   2-4 week review.

2. **Create the required KV namespace via OpenTofu** — see `infra/README.md`
   for the full setup (scoped API token, account ID, `tofu apply`). Then
   paste `tofu output oauth_kv_namespace_id`'s value into `wrangler.jsonc`.

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Local dev**: copy `.dev.vars.example` to `.dev.vars`, fill in the
   YNAB client ID/secret from step 1, then:
   ```
   npm run dev
   ```

5. **Deploy**:
   ```
   npx wrangler secret put YNAB_CLIENT_ID
   npx wrangler secret put YNAB_CLIENT_SECRET
   npx wrangler secret put YNAB_REDIRECT_URI
   npm run deploy
   ```
   Then update `wrangler.jsonc`'s `PRIVACY_POLICY_URL`/`TERMS_URL` and
   `src/index.ts`'s `resourceMetadata` placeholders to the real deployed
   URL (see `docs/website-and-contact-email.md` for the domain decision),
   and redeploy.

## Not yet implemented

- Guided category assignment and budget-setup/planning (phases 3-4 of
  `docs/personas-and-use-cases.md`) — deliberately out of scope until the
  read-only phases are validated.
- The dry-run confirmation-token pattern documented in
  `docs/tool-design-patterns.md`, needed once any write tool is added.

## Verifying changes

`npm run typecheck` runs `tsc --noEmit`. There's no live-network test
harness here (would need real YNAB OAuth credentials) — `wrangler dev`
against a real registered YNAB app is the way to exercise the OAuth flow
end-to-end.
