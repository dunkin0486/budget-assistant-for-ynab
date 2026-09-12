# YNAB Guidelines & OAuth — Findings

Researched via web search and GitHub (api.ynab.com, www.ynab.com, and
support.ynab.com are blocked by this environment's network egress proxy, so
these are reconstructed from search snippets, the `ynab-api-starter-kit`
README on GitHub, and third-party summaries — **worth a direct read of
YNAB's own API Terms of Service and OAuth Application Requirements pages
before finalizing anything**, since primary-source details may differ).

## Guidelines relevant to whether we can build this

1. **Restricted Mode (the real constraint).** New OAuth applications start
   in Restricted Mode: limited to **25 access tokens for users other than
   the app owner**. Once hit, new authorizations are blocked until YNAB
   manually reviews the app against the API Terms of Service and OAuth
   Application Requirements — review takes **2–4 weeks**. For a "general
   YNAB users" connector this cap will be hit almost immediately after any
   public listing.
   **Action: request Restricted Mode removal as soon as the MVP is built,**
   not after — the lead time means this has to run in parallel with (or
   ahead of) the Anthropic directory review, not after it.

2. **Mandatory user-facing disclaimer.** OAuth apps must display that they
   are "not officially supported by YNAB in any way," and the user must
   acknowledge this before the app functions. Needs to be part of the
   connector's consent/first-use flow.

3. **Branding restriction.** App name/domain must not contain "YNAB" or
   "You Need A Budget" unless preceded by "for" (e.g. "Budget Tools for
   YNAB" is fine; "YNAB Tools" or "Advanced YNAB" is not). Cannot reuse or
   modify YNAB's official graphics; any icon must be visually
   distinguishable from YNAB's own branding. Affects what we can name this
   connector — plan on a "for YNAB" style name.

4. **OAuth Application Requirements** (separate from the general API ToS):
   must publish a privacy policy, must not handle/store financial
   credentials beyond the OAuth access token itself, must maintain a secure
   operating environment. These already line up with what Anthropic's
   Software Directory Policy requires of us — no extra work implied.

5. **No explicit prohibition found on AI-assistant/chatbot use of the API.**
   YNAB's terms reference third-party AI platforms only to disclaim
   responsibility for those platforms' own data handling — not to forbid
   the use case. Also notable: unofficial YNAB MCP servers already exist
   (a glama.ai listing, a LobeHub skill, a .NET blog writeup) — this isn't
   unprecedented; worth studying one for how they handled Restricted Mode
   and rate limiting before we build.

**Net: nothing here blocks building this.** The two load-bearing items are
the Restricted Mode review lead time and the branding-compliant name.

## OAuth scopes

**YNAB has no granular OAuth scopes — no read-only option exists.** Every
access token grants full read+write access to the user's entire budget.
This changes the assumption in `example-prompts.md` ("read-only OAuth scope
if supported") — it isn't supported. Consequences:

- Our MVP being "read-only" is enforced entirely by **our own tool
  design** (the tools we expose only call read endpoints) — not by
  anything YNAB restricts at the token level. `readOnlyHint` annotations
  and the privacy policy need to state this plainly: the underlying token
  is full-access even though the exposed tool surface isn't.
- **Two grant types**: Implicit Grant (client-side, no client secret, token
  returned in a URL fragment, no refresh token — weaker security model)
  and **Authorization Code Grant** (server-side, uses a client secret,
  returns a refresh token, ~2 hour access-token expiry). Use Authorization
  Code Grant — it fits Anthropic's OAuth 2.0 requirement and supports
  proper session refresh; Implicit Grant is really meant for pure
  client-side apps that can't hold a secret.
- **Rate limit: 200 requests/hour** per access token. Tight enough to
  matter for the spending-analysis use case (multi-month trend queries).
  Use YNAB's delta/server-knowledge parameter to pull incremental changes
  instead of re-fetching full datasets on every turn.

## Implications for the build plan

- Add "apply for Restricted Mode removal" as an explicit early milestone,
  run in parallel with development — not a launch-week task.
- Name the connector in a YNAB-branding-compliant way (e.g. "Budget
  Assistant for YNAB," not "YNAB Assistant").
- Privacy policy must disclose that the OAuth token is full-access by
  YNAB's design, and that our tool surface — not YNAB's scope system — is
  what keeps the MVP read-only.
- Design API call patterns around the 200 req/hour limit from the start
  (delta requests, caching within a session) rather than retrofitting
  later.
