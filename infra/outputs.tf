output "oauth_kv_namespace_id" {
  description = "Paste into ../wrangler.jsonc's kv_namespaces[0].id."
  value       = cloudflare_workers_kv_namespace.oauth_kv.id
}
