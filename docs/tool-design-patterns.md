# Tool Design Patterns — Learned From Existing YNAB MCP Servers

Reviewed the two most feature-complete servers found in
`competitive-landscape.md` for patterns worth reusing. Auth model is
explicitly **not** being copied (see below); the write-safety UX is worth
borrowing closely.

## Maronato/ynab-mcp (26 tools)

- **Auth**: personal access token via `YNAB_API_TOKEN` env var — not
  OAuth.
- **Undo support**: every write operation is recorded and reversible.
  Keeps up to 2,000 undo entries per budget; exposes `list_undo_history`
  and `undo_operations` tools so a user (or Claude, on request) can review
  and revert recent changes.
- **Read-only kill switch**: `YNAB_READ_ONLY=true` unregisters every write
  tool entirely — the client never even sees them as available. Simple,
  effective pattern for a read-only deployment mode.
- **Confidence-gated suggestions**: `suggest_transaction_categories`
  attaches confidence levels to its recommendations; only high-confidence
  ones are offered as ready-to-apply, everything else needs explicit
  opt-in.

## dizzlkheinz/ynab-mcpb (35 tools)

- **Auth**: personal access token via `YNAB_ACCESS_TOKEN` — also not
  OAuth. Token stored in local client config, not sent in conversation
  logs.
- **Three write modes**:
  1. `preview` (default) — a mutation first runs a `dry_run` path and
     returns a confirmation token, valid once, expires after 2 minutes,
     and only authorizes that exact tool + validated arguments. The
     write only actually happens if that token comes back.
  2. `read-only` — disables all mutation tools.
  3. `enabled` — direct writes, no confirmation (offered for
     backward-compatibility, explicitly the riskier option).
- This is a materially better safety pattern than a plain "are you sure?"
  confirmation — the confirmation token binds the approval to the exact
  arguments that were previewed, so there's no gap where a different
  action could slip through under a stale approval.

## What to carry into this project's design

1. **Read-only kill switch as a deploy-time flag**, not just "the MVP
   doesn't call write endpoints" — matches the honesty goal already in
   `privacy-policy.md` and gives a clean way to literally not register
   write tools until the guided-assignment phase ships.
2. **Dry-run + single-use confirmation token** pattern for the guided
   category-assignment phase (`personas-and-use-cases.md` phase 3),
   instead of a looser "confirm before executing" instruction to Claude —
   this closes the gap between what was previewed and what could execute.
3. **Undo support** for any write feature — YNAB itself doesn't version
   category/transaction changes for you, so this is the difference between
   "the AI moved my money somewhere I didn't want" being a two-second fix
   or a manual cleanup job. Worth treating as a requirement for shipping
   phase 3, not a nice-to-have.
4. **Confidence-gated suggestions** for anything with fuzzy matching or
   inference (e.g. if this project ever adds receipt-categorization-style
   features) — surface high-confidence matches as ready-to-apply, keep
   low-confidence ones as a suggestion the user has to actively choose.

## What's deliberately not being copied: auth model

Both servers use a personal access token pasted into local config — the
exact self-hosted, non-OAuth pattern `competitive-landscape.md` identified
as the actual gap in the ecosystem. This project's differentiation depends
on using YNAB's OAuth Authorization Code Grant instead (per
`ynab-guidelines-and-oauth.md`), even though it's more upfront engineering
work than a personal access token would be.
