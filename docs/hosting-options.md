# Hosting Options for the Remote MCP Server

## Recommendation: Cloudflare Workers

Given the connector is a thin proxy — fetch from YNAB, reshape, return to
Claude — with no heavy compute, Cloudflare Workers is a strong fit:

- **Free tier**: 100,000 requests/day, no credit card required, public
  HTTPS URL with TLS included, global edge (low latency for users
  anywhere). At the traffic level this project will realistically see
  (personal + early adopters, gated further by YNAB's 25-user Restricted
  Mode cap anyway), this is very unlikely to be exceeded.
- **Paid tier**: $5/month for 10 million requests, if it ever outgrows
  free — a low ceiling to worry about later, not now.
- **Persistent state**: use **Durable Objects**, not Workers KV, for the
  encrypted OAuth token storage (per `privacy-policy.md`'s commitment).
  Both are free-tier eligible, but their free write allowances differ a
  lot: KV's free tier caps at **1,000 writes/day account-wide**, while
  Durable Objects' free tier allows **~3 million writes/month**. Every
  YNAB token refresh (roughly every ~2 hours of active use, since YNAB
  access tokens expire that fast) is a write — KV's cap would become a
  real constraint at just a few hundred active users, while Durable
  Objects' wouldn't. See cost estimates below.
- **Built-in OAuth tooling**: Cloudflare publishes a `workers-oauth-provider`
  library specifically for building remote MCP servers that both (a) act
  as an OAuth provider to the MCP client (Claude) and (b) hold a token for
  an upstream OAuth provider (YNAB) on the user's behalf — which is
  exactly this project's shape (Claude ↔ our server ↔ YNAB). Worth using
  directly rather than hand-rolling the token-exchange/refresh logic.

## Alternatives considered

- **Fly.io** — better fit for multi-region, long-running, or custom
  runtime needs; overkill for a stateless API-proxy MCP server. No clear
  free-tier advantage over Workers for this use case.
- **Vercel / Railway / AWS Lambda** — all viable, but none had a
  free-tier + OAuth-provider-tooling combination as directly aimed at
  "remote MCP server" as Cloudflare's.

## Cost estimates by usage stage

Relevant free-tier limits (2026):
- **Workers**: 100,000 requests/day (~3M/month) free; paid plan is a flat
  **$5/month** covering Workers + KV + Durable Objects + Hyperdrive
  together, including 10M requests/month, then $0.30/million beyond that.
- **Durable Objects**: ~3M requests/month and ~3M row-writes/month free,
  even on the Workers Free plan.
- **No egress/bandwidth charges** on any plan — the request count is the
  only thing that matters.

Assume each user question triggers ~2 proxied YNAB API calls on average
(e.g. one to look up a category, one for its transactions), and an active
user asks something on the order of 10 questions/day. YNAB's own 200
requests/hour/user rate limit (`ynab-guidelines-and-oauth.md`) puts a hard
ceiling on how much any single user could drive this even if they tried.

| Stage | Active users | Worker requests/day | DO writes/day (token refresh) | Cost |
|---|---|---|---|---|
| Restricted Mode (YNAB's 25-user cap) | 25 | ~500 | ~100 | **$0** — nowhere near any free-tier limit |
| Restricted Mode removed, modest adoption | 500 | ~10,000 | ~2,500 | **$0** — still well under the 100k/day Worker cap; this is exactly the load level where KV's 1,000 writes/day cap would have broken, hence Durable Objects |
| Meaningful adoption | 5,000 | ~100,000 | ~25,000 | **At the free Worker daily cap** — this is the point to upgrade to the $5/month plan for headroom (10M requests/month included, ~333k/day) |
| Well beyond a hobby project | 50,000+ | ~1M+ | ~250,000+ | Still likely **$5–15/month** — the $5 plan's 10M included requests/month covers this; only the request overage rate ($0.30/million) would apply beyond that |

## Net

Cloudflare Workers (free tier to start), with **Durable Objects rather
than KV** for token storage, covers hosting, TLS, encrypted token
storage, and the OAuth Authorization Code Grant flow itself (via their
OAuth Provider library) at **$0/month through several thousand active
users**, and no more than **$5/month** for a long stretch beyond that.
Hosting cost is not a realistic blocker for a free, non-commercial
project at any scale this is likely to reach.
