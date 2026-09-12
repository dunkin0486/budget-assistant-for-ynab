# Competitive Landscape — Existing YNAB MCP Servers

## Finding

At least 15 YNAB MCP servers already exist on GitHub. Between them, all four
of our target use cases (conversational Q&A, spending analysis, guided
category assignment, budget setup/planning) are already implemented
somewhere, some with better safety UX than our own sketch (undo support on
every write).

| Server | Tools | Coverage |
|---|---|---|
| dizzlkheinz/ynab-mcpb | 28 tools | Full CRUD: budgets, accounts, transactions, categories, payees, months, reconciliation |
| Maronato/ynab-mcp | 26 tools | Budgets/accounts/transactions/categories/targets/scheduled transactions, "deterministic analysis," batch writes with undo |
| jeangnc/ynab-mcp-server | — | Categories grouped w/ budgeted+activity, transaction filtering, every write tracked with undo |
| jsclayton/ynab-mcp | — | Explicitly "spending analysis, guided reconciliation, and budget management through natural conversation" |
| cinnes/ynab-mcp | 16+ tools | Transaction management, budget analysis, account transfers, encrypted token storage |
| Tankatronic/ynab-mcp-server | — | Built for users who don't link bank accounts, natural-language budget management |
| (also found, not deeply reviewed) | — | obviyus/ynab-mcp, EthanKang1/ynab-mcp, mattweg/ynab-mcp, Jtewen/ynab-mcp, calebl/ynab-mcp-server, Bulletninja/mcp-ynab, chrisguidry/you-need-an-mcp, scottolsen/ynab-mcp |

This is a crowded space at the feature level, not a green field.

## What none of them have

- **OAuth.** Every one found uses a personal access token pasted into a
  local config file, not YNAB's OAuth flow. That means: no consent screen,
  no revocable per-app grant, no scoped session — the user hands over a
  long-lived token with full read+write access to their entire budget,
  manually, to a script they usually haven't audited.
- **Official distribution.** All are self-hosted (`npx`/`git clone` +
  manual MCP config edit). None are in Anthropic's MCP registry or
  Software Directory. A user has to find one of ~15 similarly-named repos,
  judge which is trustworthy enough to hand a full-access token to, and set
  it up by hand — a real barrier for the Beginner and Household personas,
  the least technical of our five.
- **Security/privacy review.** None appear to have gone through any formal
  review process. Quality, data handling, and write-safety vary
  project-to-project with no external check.

## Revised thesis

The differentiation is not "build features nobody else has" — the feature
space is already over-served for power users. The differentiation is
**being the safe, zero-setup, officially-listed path to those features**:
OAuth consent instead of a pasted token, one-click connector install
instead of local config editing, and passing Anthropic's directory review
(privacy policy, tool annotations, minimal data collection) instead of
"trust a random GitHub repo."

This reframes the project from *"build the functionality"* to *"be the
trustworthy distribution of functionality that already exists in the
wild."* It doesn't change the MVP scope decided in
`personas-and-use-cases.md` (read-only Q&A + analysis first, guided
assignment and budget planning later) — it changes why that scope matters:
the read-only-first sequencing is now also the safest on-ramp for
non-technical users who would never risk a self-hosted, full-access token
in the first place.

## Decision: pursue Anthropic directory listing

Given the above, the plan is to build toward an **official Anthropic
Software Directory listing**, not just a personal/self-hosted MCP server.
That decision drives concrete next steps:

- OAuth (Authorization Code Grant, per `ynab-guidelines-and-oauth.md`) is
  no longer optional/nice-to-have — it's the core differentiator, so it
  needs to be right from the first commit rather than retrofitted.
- The Restricted Mode removal request (25-user cap, 2-4 week YNAB review)
  and the Anthropic directory review should be kicked off in parallel,
  since both have multi-week lead times and neither blocks starting the
  other.
- Worth a closer look at 2-3 of the more mature existing servers (e.g.
  Maronato/ynab-mcp, dizzlkheinz/ynab-mcpb) purely for tool-shape and
  safety-UX patterns (undo support, batch operations) to borrow from —
  not for their auth model, which we're deliberately not copying.
- Branding name and privacy policy drafts (open items from earlier docs)
  become higher priority now that "get listed" is the explicit goal rather
  than a maybe.
