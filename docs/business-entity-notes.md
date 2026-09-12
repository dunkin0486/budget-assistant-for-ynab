# Business Entity — Notes for Future Reference

## Current decision

Operating as an individual (sole proprietor), not a formal legal entity.
The privacy policy names Christopher Dunkin directly rather than an LLC or
corporation.

## Why this doesn't block anything today

Neither YNAB's OAuth Application Requirements nor Anthropic's Software
Directory Policy require a formal legal entity — both just need a real,
contactable, responsible party and a published privacy policy. Forming an
LLC is a **liability question, not a compliance requirement**: it
separates personal assets from the project's, but doesn't change whether
YNAB or Anthropic will approve the connector.

## If it's revisited later: Iowa LLC cost

Iowa is one of the cheaper states to do this in:

- **$50 one-time fee** — Certificate of Organization, filed with the Iowa
  Secretary of State
- **$30 biennial report** — filed every two years (not annual), keeps the
  LLC active
- No annual franchise tax (unlike, e.g., California's $800/year)
- Additional cost only if using a registered-agent or formation service
  (LegalZoom, ZenBusiness, etc.) instead of filing directly — self-filing
  keeps it to the $50 + $30/biennial above

Sourced Sept 2026; reconfirm current fees on the Iowa Secretary of State
site before actually filing, in case they've changed.

## When to reconsider

Worth revisiting the LLC question if any of these change:
- The connector gets real usage volume (beyond a personal/hobby scale)
- Anything moves from read-only toward write actions against users'
  financial data (higher risk surface if something goes wrong)
- There's ever a reason to worry about personal liability exposure
  specifically — the LLC's only real benefit here is that shield

Until then, the $50–80 total cost is low enough that this is purely a
"worth it yet?" judgment call, not something to decide preemptively.
