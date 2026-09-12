# Privacy Policy — Budget Assistant for YNAB

**Status: DRAFT for internal review.** This satisfies the structural
requirements from `ynab-guidelines-and-oauth.md` (YNAB's OAuth Application
Requirements) and the persona/example-prompt work in this repo, but it is
not a substitute for actual legal review before publishing — especially
given the financial-data surface. Bracketed items (`[...]`) are
placeholders to fill in before this goes live.

*Effective date: [set when the connector actually launches — not yet
published] · Last updated: September 12, 2026*

## 1. Who this covers

Budget Assistant for YNAB ("the connector," "we," "us") is a Claude
connector, built by Christopher Dunkin [confirm name spelling before
publishing — inferred from account email], operating as an individual
rather than through a formal business entity (see
`business-entity-notes.md` for the LLC option, held for later), that lets
you ask Claude questions about your YNAB (You Need A Budget) budget in
natural language. It is offered free of charge, and we do not monetize
your data as an alternative source of revenue.

**Budget Assistant for YNAB is not made, endorsed, or officially supported
by YNAB in any way.** It is an independent, third-party integration built
against YNAB's public API.

## 2. What data we access

When you connect your YNAB account, you grant the connector an OAuth
access token. That token, by YNAB's design, carries full read and write
access to your YNAB budget data — YNAB does not offer a narrower,
read-only OAuth scope. **Budget Assistant for YNAB's own tools currently
only read data; they do not call any YNAB endpoint that creates, edits, or
deletes anything in your budget**, regardless of what the token itself
would technically permit. If that changes in a future version (e.g. a
guided category-assignment feature), this policy will be updated first and
any write action will require your explicit, in-conversation confirmation
before it executes.

Depending on what you ask Claude, the connector may read:

- Budget names and settings
- Account names and balances
- Category groups, categories, budgeted amounts, activity, and balances
- Payee names
- Transaction details (date, amount, payee, category, memo) needed to
  answer your question

We only fetch what's needed to answer the specific question you asked in
that conversation. A question about a spending trend may require pulling
several months of category history at once — but only because you asked
for that trend, not on a recurring schedule. The connector does not run
background syncs and does not pull data you haven't effectively asked
about.

## 3. How we use it

Data read from YNAB is used solely to generate Claude's response to your
question in that conversation — for example, telling you your remaining
grocery budget, summarizing your overall budget status, or explaining a
spending trend. It is not used for advertising, profiling, resale, or any
purpose beyond answering what you asked.

Because Claude is an Anthropic product, the YNAB data relevant to your
question is processed by Claude's underlying models as part of generating
a response, in the same way as anything else you share in a Claude
conversation. That processing is governed by Anthropic's own privacy
policy and terms for the Claude product you're using, in addition to this
policy — including whether your conversations are used for model training,
which depends on your own Claude account/plan settings and is not
something this connector controls or changes.

**We do not use your YNAB data for anything beyond answering your
question in that conversation** — not for analytics, not for improving
the connector, not in aggregated or de-identified form, and not for
training any model ourselves.

## 4. What we store

- **OAuth tokens.** Your YNAB access and refresh tokens are stored
  encrypted, solely to maintain your connection between conversations so
  you don't have to re-authenticate every time. They are never logged in
  plaintext or shared outside the systems needed to make authenticated
  requests to YNAB on your behalf.
- **Budget data.** We do not maintain a persistent copy or database of
  your YNAB budget, categories, or transactions. Data fetched from YNAB to
  answer a question exists only for the duration of that request/response
  cycle and is not retained afterward, beyond whatever standard
  conversation history retention already applies to your use of Claude.
- **Operational logs.** Like any server, the connector's infrastructure
  may produce short-lived operational logs (e.g. error traces, uptime
  monitoring) for debugging outages. These are retained for **30 days at
  most**, are not reviewed except when investigating a specific problem,
  and are not used for analytics or any purpose beyond keeping the
  connector running. Logs are configured to exclude request/response
  bodies (the actual budget data) — only metadata needed to diagnose a
  failure (timestamp, endpoint, error type) is captured. [Confirm the
  actual hosting setup enforces this 30-day rotation and the
  body-exclusion before publishing — this is a policy commitment the
  infrastructure needs to be built to match, not yet a verified fact.]
- **No sharing or selling.** We do not sell, rent, or share your YNAB data
  with third parties, other than YNAB itself (to fetch the data you
  asked about) and Anthropic (to generate Claude's response, as described
  above). The only other exception is if required by law — e.g. a valid
  subpoena or court order — in which case we would disclose only what's
  legally compelled and, where legally permitted, notify you first.

## 5. Your control over access

- You can revoke Budget Assistant for YNAB's access at any time from your
  YNAB account's connected-applications settings, or by disconnecting the
  connector from within Claude. Revoking access immediately invalidates
  the stored token; we do not retain a usable copy after revocation.
- Restricted Mode and other YNAB-side controls (described in
  `ynab-guidelines-and-oauth.md`) are managed by YNAB, not us — see YNAB's
  own privacy policy and terms for how they handle authorization data on
  their end.

## 6. Your rights

Since we don't retain your budget data (Section 4), most of what there is
to control lives in the OAuth connection itself:

- **Access/know what we hold.** The only persistent data we hold about you
  is your encrypted OAuth token pair — no separate profile or budget copy.
  You can ask (Section 10) for confirmation of what's stored.
- **Delete.** Revoking access (Section 5) deletes the stored token. There
  is no budget data left over to separately delete.
- **Withdraw consent.** Connecting your YNAB account is consent to this
  policy; you can withdraw it at any time by disconnecting, with no effect
  on your underlying YNAB account.

If you're in the EU/UK, this processing relies on your consent (given by
connecting your account) as its legal basis under GDPR, and you may lodge
a complaint with your local data protection authority. [Add
CCPA/state-privacy-law language here if usage volume brings this project
into scope for those laws.]

## 7. Security

- Tokens are encrypted at rest and in transit (TLS).
- The connector requests OAuth via the Authorization Code Grant (not the
  weaker Implicit Grant), so your YNAB credentials are never seen or
  handled by us directly — only YNAB's own login page ever sees your
  password.
- Access is scoped in practice to read-only tool behavior as described in
  Section 2, as an additional safeguard beyond what YNAB's token model
  enforces on its own.
- If a security incident exposes your token or data we've processed, we
  will notify affected users without undue delay after we learn of it, and
  within any shorter window applicable law requires.

## 8. Children's privacy

Using Budget Assistant for YNAB requires an existing YNAB account, and
YNAB's own terms restrict accounts to users old enough to enter a binding
agreement in their jurisdiction — we rely on that gate rather than
separately verifying age. The connector is not directed at children, and
we do not knowingly collect data from anyone under 13.

## 9. Changes to this policy

If this policy changes in a material way — particularly if we add any
write capability against your YNAB data — we will update the effective
date above and, for changes that expand what we do with your data, seek
your renewed consent before the change takes effect.

## 10. Contact

Questions about this policy or how your data is handled:
**[privacy@budgetassistantforynab — dedicated project email, not a
personal address; see `website-and-contact-email.md` for setup. Fill in
the actual address once created, before publishing.]**

## 11. Relationship to YNAB's own policies

This policy covers only what Budget Assistant for YNAB does with your
data. YNAB's own handling of your budget data is governed by YNAB's
Privacy Policy and Terms of Service, independent of this connector.
