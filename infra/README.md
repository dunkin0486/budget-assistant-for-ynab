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

`tofu apply` runs from GitHub Actions (`../.github/workflows/opentofu.yml`),
not locally — deliberately, so applies aren't tied to whichever machine
happens to have credentials exported. Opening a PR that touches `infra/**`
runs `tofu plan` and posts the output as a PR comment for review; merging
to `main` runs `tofu apply`.

One-time bootstrap (already done for this repo, documented here for
disaster-recovery / setting up a fork):

1. Create the R2 bucket that holds remote state (see State, below) —
   manually, via the Cloudflare dashboard (R2 → Create bucket). This can't
   be managed by the same OpenTofu config that stores its state *in* that
   bucket (the classic backend bootstrapping chicken-and-egg), so it's a
   deliberate exception to "everything as code" here.
2. Create a scoped Cloudflare API token (Account token, not User — see
   below) with `Account > Workers KV Storage > Edit` — add
   `Zone > DNS > Edit` and `Account > Cloudflare Pages > Edit` once those
   resources are added (#16). Set it as the `CLOUDFLARE_API_TOKEN` GitHub
   Actions secret.
3. Create an R2 API token (dashboard → R2 → Manage R2 API Tokens →
   Account-scoped, Object Read & Write, scoped to the state bucket). Set
   the resulting Access Key ID / Secret Access Key as the
   `TOFU_R2_ACCESS_KEY_ID` / `TOFU_R2_SECRET_ACCESS_KEY` GitHub Actions
   secrets.
4. Set the Cloudflare account ID (dashboard sidebar) as the
   `TF_VAR_CLOUDFLARE_ACCOUNT_ID` GitHub Actions **variable** (not a
   secret — it's not sensitive, and the workflow maps it to the
   correctly-cased `TF_VAR_cloudflare_account_id` env var Tofu expects).

**Account vs. User API tokens**: use Account-scoped tokens for anything
consumed by CI. Account tokens act like a service principal and keep
working regardless of who created them; User tokens inherit one person's
account membership and silently stop working if that person is ever
removed — exactly the failure mode you don't want in an unattended Actions
workflow.

### Local use (debugging only)

For a one-off `tofu state list`/`tofu show` to debug something, without
touching CI: copy the backend settings from the `Write backend config`
step in `../.github/workflows/opentofu.yml` into a local `infra/backend.hcl`
(gitignored), fill in your own R2 credentials, then
`tofu init -backend-config=backend.hcl`. Don't run `tofu apply` this way —
that's what the workflow is for.

After a successful apply (via the workflow), `tofu output oauth_kv_namespace_id`
and paste the value into `../wrangler.jsonc`'s `kv_namespaces[0].id` (still
a manual step for now — not worth templating wrangler.jsonc for one
value).

## State

Remote state in a Cloudflare R2 bucket (`budget-assistant-for-ynab-opentofu-state`),
via OpenTofu's S3-compatible backend (see `versions.tf`'s partial `backend
"s3" {}` block, configured at `tofu init` time). Required once `tofu
apply` moved into GitHub Actions (#15) — Actions runners are ephemeral, so
a local `terraform.tfstate` wouldn't survive between runs; the first
`apply` would succeed, and every one after would have no memory of it.
`.terraform.lock.hcl` **is** committed (like `package-lock.json`) so
provider versions stay reproducible.

## Secrets

The YNAB OAuth client ID/secret and redirect URI are **not** managed here
— they're set via `wrangler secret put` (see `../README.md`), not
OpenTofu, so they never land in Terraform state (which isn't encrypted by
default). Only non-sensitive, infrequently-changing infrastructure belongs
in this directory.
