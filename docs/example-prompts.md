# YNAB MCP Connector — MVP Example Prompts

Scoped to the read-only MVP (conversational Q&A + spending analysis) per the
build sequence in `personas-and-use-cases.md`. All three tools below carry
`readOnlyHint: true`, `destructiveHint: false` — no write endpoints are
exercised in this phase, which keeps the directory-review privacy surface
minimal.

## Assumed minimal tool surface

- `list_budgets` — the user's YNAB budgets (most users have one; some have several, e.g. personal + business).
- `get_budget_month` — Ready to Assign, category balances, and Age of Money for a given month.
- `list_categories` — category groups, per-category budgeted/activity/balance.
- `list_transactions` — transactions filtered by category, payee, or date range.
- `get_category_by_month` (range) — a category's budgeted/activity/balance across a span of months, for trend analysis.

## 1. Conversational Q&A — "How much do I have left?"

**Persona:** Overwhelmed Beginner
**Prompt:** *"How much do I have left to spend on groceries this month?"*

**Expected flow:** `list_budgets` → `list_categories` (filtered/matched to "Groceries") → return the category's remaining balance, phrased in plain language, e.g. "You've spent $312 of your $450 groceries budget this month — $138 left." If the category is overspent, say so plainly and note it doesn't auto-fix itself (sets up the guided-assignment feature for a later phase, without doing it here).

**Why it's a good review example:** single read call, no ambiguity, demonstrates the core "ask your budget a question" value prop in the simplest form.

## 2. Conversational Q&A — plain-English budget status

**Persona:** Household Budget Manager
**Prompt:** *"Give me a plain-English summary of my budget status right now — what's covered, what's tight, and what still needs money assigned."*

**Expected flow:** `list_budgets` → `get_budget_month` (current month) → `list_categories` → synthesize into three buckets (fully funded / running low / unfunded or overspent) plus the current Ready to Assign figure. Response reads like a briefing, not a data dump — this is the "translate numbers for a partner" use case.

**Why it's a good review example:** exercises aggregation across multiple categories (not just one lookup), still fully read-only, shows the summarization value that a static YNAB report screen doesn't give you.

## 3. Spending analysis — trend over time

**Persona:** Optimizer / Power User
**Prompt:** *"Why did I go over budget on dining out the last three months? Show the trend."*

**Expected flow:** `get_category_by_month` for "Dining Out" across the last 3 months → optionally `list_transactions` for that category/date range to surface specific drivers (e.g. a spike in one month tied to a handful of large transactions) → respond with the month-by-month trend plus a plain-language explanation of what changed, not just numbers restated.

**Why it's a good review example:** the clearest differentiator versus YNAB's native reporting — narrative analysis across a time range that a static chart doesn't produce — while remaining entirely read-only.

## Notes for the directory submission

- All three prompts are achievable with a **read-only OAuth scope** if YNAB's API supports scoping reads separately from writes; if not, note in the privacy policy that write scope is requested but unused in this phase.
- None of these prompts require caching transaction-level data beyond the request/response cycle — worth stating explicitly in the privacy policy to minimize data-retention concerns.
- Phase 2 (guided category assignment) will need its own separate example prompt(s) and a `destructiveHint: true` annotation once that phase is built — not included here since it's out of MVP scope.
