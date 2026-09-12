# The KV namespace @cloudflare/workers-oauth-provider requires for its own
# grant/token storage (the downstream token this server issues to Claude,
# not the upstream YNAB token -- see ../src/mcp-agent.ts and
# ../docs/hosting-options.md). Its ID feeds into ../wrangler.jsonc's
# kv_namespaces[0].id -- see infra/README.md for the apply-then-paste
# workflow.
resource "cloudflare_workers_kv_namespace" "oauth_kv" {
  account_id = var.cloudflare_account_id
  title      = "budget-assistant-for-ynab-oauth"
}
