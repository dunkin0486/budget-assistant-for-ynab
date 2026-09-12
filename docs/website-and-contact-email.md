# Contact Email & Companion Website

## Contact email (not your personal address)

Two free options, in order of effort:

1. **Dedicated free Gmail address** — e.g. `budgetassistantforynab@gmail.com`
   (or similar, matching the connector's branding-compliant name from
   `ynab-guidelines-and-oauth.md`). Zero cost, no domain needed, takes five
   minutes to set up, and immediately separates this project's inbox from
   your personal one. This is the simplest path and doesn't depend on any
   other decision below.

2. **Cloudflare Email Routing on a custom domain** — since you already
   have a Cloudflare account handling DNS/domain registration, this is
   more immediately available than originally scoped: Cloudflare's Email
   Routing is free and lets you create addresses like
   `privacy@budgetassistantforynab.com` that forward to an inbox you
   already control (the new Gmail from option 1, ideally — not your
   personal one). No per-address fees, unlimited addresses on the domain,
   and it works whether that domain is a new registration or an existing
   one you already manage there (see Domain section below). Caveat: it's
   receive/forward only — it doesn't give you a mailbox to send *from*
   that address without extra setup (Gmail's "Send As" feature, using the
   free Gmail from option 1 as the sending account).

**Recommendation**: set up the free Gmail address now regardless (it's
useful immediately and costs nothing) — then, given you already have the
Cloudflare account, it's low-effort to also wire up Email Routing on a
domain there for a more professional-looking forwarding address, rather
than treating that as a "someday" upgrade.

## Is a companion website worth building?

Yes, worth it, but positioned as documentation rather than marketing. The
persona work in `personas-and-use-cases.md` already surfaces the need:
the Beginner and Household Manager personas need onboarding help, and
Anthropic's directory review benefits from a real, public location for
example prompts beyond the 3 required minimum — a place to show off
workflow ideas the four use cases actually enable (the guided-assignment
and budget-planning phases especially benefit from worked examples once
they exist, since "guided category assignment" is meaningless without
seeing what a good prompt for it looks like).

Scope it as: a landing page, the example prompts from `example-prompts.md`
expanded with more variety per persona, and — once later phases ship — a
"workflow ideas" section showing multi-step conversations (e.g., "help me
reallocate for an unexpected car repair"). Doesn't need to be more than a
handful of static pages.

## Hosting the website

**Update: since you already run an existing Cloudflare account for DNS
and domain registration**, the "avoid a new account" argument for
starting on GitHub Pages doesn't apply — go straight to **Cloudflare
Pages**. It puts the website, the MCP server (`hosting-options.md`), DNS,
domain registration, and Email Routing all in the one account you're
already managing, rather than splitting this project across GitHub Pages
now and migrating later. Free tier: unlimited bandwidth, free SSL, up to
100 custom domains — no reason to hold back from using a domain from day
one if you want.

(GitHub Pages remains a fine fallback if you'd rather keep the website
decoupled from Cloudflare for some reason — 100GB/month bandwidth cap,
which is not a real constraint for a docs site — but there's no longer a
clear advantage to it here.)

## Domain

Two paths, given the existing Cloudflare account:

1. **Use a subdomain of a domain you already own** (e.g.
   `budgetassistant.yourexistingdomain.com`) — **$0 additional cost**,
   works immediately with Cloudflare Pages + Email Routing on that same
   account, no new registration needed at all.
2. **Register a new domain via Cloudflare Registrar** — since you already
   register domains there, this is the cheapest path if you want a
   dedicated name like `budgetassistantforynab.com`: Cloudflare sells
   domains **at cost with no markup** — currently **~$10.44/year for
   `.com`** (rising slightly to ~$11.15/year in November 2026 following a
   wholesale registry price increase), with free WHOIS privacy included
   (no extra privacy-protection fee, unlike many registrars).

Either way, this is still the one piece of the whole project with an
actual recurring dollar cost — the website hosting, MCP server hosting,
and email forwarding are all free regardless of which domain path you
pick. Worth deciding once you know whether you want a dedicated branded
name or are fine using a subdomain of something you already have.
