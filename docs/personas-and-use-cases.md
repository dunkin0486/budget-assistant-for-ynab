# YNAB MCP Connector — Personas & Use Cases

## Prior findings (context)

- No existing YNAB connector in Anthropic's MCP registry. Closest alternatives are PocketSmith and Era Context (general finance apps), neither YNAB-specific.
- YNAB's public API (api.ynab.com) is solid: REST/JSON, OAuth 2.0, official JS/Ruby SDKs, a starter kit repo. Covers budgets, accounts, categories, transactions — including Ready to Assign balances and category assignment writes.
- Anthropic's Software Directory Policy has no hard blocker: prohibits software that transfers money/executes financial transactions, but a YNAB connector categorizes already-existing dollars rather than moving money between real accounts. Requires OAuth 2.0, tool annotations (title + readOnlyHint/destructiveHint), a privacy policy, minimal data collection, a test account, and 3 example prompts for review. Expect closer privacy scrutiny given the financial-data surface even without transaction/transfer capability.

## Decisions going in

- Target user: **general YNAB users**, not just a personal tool or one narrow budgeting style.
- Core use cases to support: **conversational Q&A, guided category assignment, spending analysis & insights, budget setup/planning assistance.**

**Update — see `competitive-landscape.md`:** at least 15 self-hosted YNAB
MCP servers already exist and collectively cover all four use cases below,
some with better write-safety UX (undo support) than sketched here. The
personas and use-case mapping below are still valid, but the differentiator
this project is actually building is **safe, zero-setup, officially-listed
access** (OAuth + Anthropic directory review) to functionality that
already exists in the wild — not novel features. That's why the build
sequence still starts read-only: it's both the lowest-review-risk path and
the safest on-ramp for the least technical personas (Beginner, Household
Manager), who are the ones least likely to self-host a script with a
full-access personal token in the first place.

## Personas

### 1. The Overwhelmed Beginner
New to YNAB, hasn't internalized "give every dollar a job" or "true expenses." Money sits unassigned in Ready to Assign, categories are either empty or mysterious, check-ins are sporadic.
- Wants: plain-language orientation ("what should I do with this $340 I haven't assigned yet?"), reassurance they're doing it right.
- Primary use case: conversational Q&A, secondarily budget setup assistance.

### 2. The Tight-Budget / Debt-Payoff User
Every dollar matters, categories go negative often, needs to "roll with the punches" by pulling slack from one category to cover another.
- Wants: fast, guided reallocation ("cover my overspent categories from what's left in dining and entertainment") without manually scanning the category list.
- Primary use case: guided category assignment, secondarily conversational Q&A.

### 3. The Optimizer / Power User
Years of YNAB history, multiple accounts, cares about age of money and long-run trends. YNAB's built-in reports are serviceable but rigid.
- Wants: ad hoc, narrative analysis — "why did I go over on groceries the last three months" — that a static report can't produce.
- Primary use case: spending analysis & insights, secondarily conversational Q&A.

### 4. The Household Budget Manager
Runs the budget for a family, needs to translate numbers into plain language for a partner, plans for true expenses (car repair, holidays) and per-category savings goals.
- Wants: summaries in plain English, help planning goal contributions.
- Primary use case: conversational Q&A, secondarily budget setup/planning.

### 5. The Irregular-Income User (freelancer/business)
Ready to Assign varies wildly month to month.
- Wants: help prioritizing which categories get funded first when income is unpredictable.
- Primary use case: budget setup/planning assistance, secondarily guided category assignment.

## Use case → persona mapping

| Use case | Best served personas | Risk profile |
|---|---|---|
| Conversational Q&A | All five — universal | Read-only, lowest scrutiny |
| Spending analysis & insights | Optimizer, Household Manager | Read-only, more aggregation logic |
| Guided category assignment | Tight-Budget, Irregular-Income | Read+write, needs explicit confirmation before moving money |
| Budget setup/planning | Beginner, Household Manager, Irregular-Income | Mostly write, most novel, least proven demand |

## Recommended build sequence

1. **Conversational Q&A** — serves every persona, read-only, fastest through review, and the foundation the other three build on.
2. **Spending analysis & insights** — still read-only, but the real differentiator versus YNAB's native (static) reports.
3. **Guided category assignment** — highest-value, hardest-to-replicate feature (nobody else does this), but a write action against financial-category data. Requires mandatory confirmation of the specific move before executing, a `destructiveHint` annotation, and no auto-execution on ambiguous requests.
4. **Budget setup/planning assistance** — most speculative use case, least clear demand signal; benefits from validating the other three with real users first.

Rationale: this keeps the MVP entirely read-only (lowest privacy scrutiny, consistent with the "categorizing existing dollars, not moving money" framing from the policy review), while the roadmap builds toward the write-capable feature that is actually novel versus existing finance connectors.

## Open questions for next pass

- Example prompts (3 required for directory review) — draft one per use case once scope for MVP (Q&A + analysis) is locked.
- Privacy policy scope: what YNAB data gets cached/logged vs. fetched live per request.
- For guided category assignment: exact confirmation UX (does Claude propose a specific dollar-amount move and require explicit "yes" before calling the write endpoint?).
