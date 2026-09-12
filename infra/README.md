# Infrastructure (OpenTofu)

## Scope: what OpenTofu manages here, and what it doesn't

**OpenTofu manages the account-level Cloudflare infrastructure that isn't
tied to a specific code deployment**: currently just the `OAUTH_KV`
namespace. It'll grow to cover DNS records, the custom domain binding, the
Cloudflare Pages project for the companion website, and Email Routing
rules once the domain decision in `../docs/website-and-contact-email.md`
is made.

**OpenTofu does not deploy the Worker's actual code.** The Cloudflare
Terraform provider's v5 code-deployment resources (`cloudflare_worker`,
`cloudflare_worker_version`, `cloudflare_workers_deployment` — the
replacement for the now-deprecated `cloudflare_workers_script`) expect
already-bundled code as input. This project's Worker is TypeScript with
npm dependencies (`agents`, `@modelcontextprotocol/sdk`,
`@cloudflare/workers-oauth-provider`, `zod`) that need bundling — exactly
what `wrangler deploy` already does well via esbuild. Reimplementing that
bundling step just to hand OpenTofu a finished artifact would be
duplicating `wrangler`'s job for no real benefit, so code deployment stays
with `wrangler deploy` (see `../README.md`).

This is a common and deliberate split: OpenTofu/Terraform for
infrequently-changing cloud infrastructure, the framework's own CLI for
application code deploys.

## Setup

1. Install OpenTofu: https://opentofu.org/docs/intro/install/
2. Create a scoped Cloudflare API token (not a Global API Key) with
   `Account > Workers KV Storage > Edit` — add `Zone > DNS > Edit` and
   `Account > Cloudflare Pages > Edit` once those resources are added
   later.
3. Export it: `export CLOUDFLARE_API_TOKEN=...` (never put it in a `.tf`
   file or commit it).
4. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your
   Cloudflare account ID (find it in the Cloudflare dashboard sidebar).
5. `cd infra && tofu init && tofu plan`, review, then `tofu apply`.
6. `tofu output oauth_kv_namespace_id` and paste the value into
   `../wrangler.jsonc`'s `kv_namespaces[0].id` (still a manual step for
   now — not worth templating wrangler.jsonc for one value).

## State

Local state (`terraform.tfstate`, gitignored) for now — this is a single
solo-maintained resource today, so the durability/collaboration benefits
of a remote backend don't pay for the setup yet. `.terraform.lock.hcl`
**is** committed (like `package-lock.json`) so provider versions stay
reproducible.

Worth migrating to a remote backend (Cloudflare R2 via OpenTofu's S3-
compatible backend, staying in the same free-tier ecosystem as everything
else in this project) once there's more than one resource here, or more
than one person touching this repo.

## Secrets

The YNAB OAuth client ID/secret and redirect URI are **not** managed here
— they're set via `wrangler secret put` (see `../README.md`), not
OpenTofu, so they never land in Terraform state (which isn't encrypted by
default). Only non-sensitive, infrequently-changing infrastructure belongs
in this directory.
