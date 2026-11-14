# The KV namespace @cloudflare/workers-oauth-provider requires for its own
# grant/token storage (the downstream token this server issues to Claude,
# not the upstream YNAB token -- see ../src/mcp-agent.ts and
# ../docs/hosting-options.md). Its ID feeds into ../wrangler.jsonc's
# kv_namespaces[0].id -- see infra/README.md for the apply-then-paste
# workflow.
resource "cloudflare_workers_kv_namespace" "oauth_kv" {
  account_id = var.cloudflare_account_id
  # Cosmetic rename only (matches the Plan Assistant for YNAB rebrand) --
  # Cloudflare's KV namespace rename API changes the display title in
  # place; it does not change the namespace id or its stored data. Confirm
  # the `tofu plan` posted on this PR shows an in-place update, not a
  # destroy/recreate, before merging -- this namespace holds live OAuth
  # token data (OAUTH_KV in ../wrangler.jsonc).
  title = "plan-assistant-for-ynab-oauth"
}
