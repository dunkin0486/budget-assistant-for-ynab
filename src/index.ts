import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { BudgetAssistantMCP } from "./mcp-agent.js";
import oauthHandler from "./oauth-handler.js";
import type { Env } from "./types.js";

// Re-export so wrangler can find the Durable Object class named in
// wrangler.jsonc's durable_objects.bindings[].class_name.
export { BudgetAssistantMCP };

export default new OAuthProvider<Env>({
  apiRoute: "/mcp",
  apiHandler: BudgetAssistantMCP.serve("/mcp"),
  defaultHandler: oauthHandler,

  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",

  // Lets Claude authenticate using its own Anthropic-published client
  // identity (Client ID Metadata Document) instead of this server having
  // to run Dynamic Client Registration. Needs the 'global_fetch_strictly_public'
  // compatibility flag (already set in wrangler.jsonc) so the fetch this
  // triggers can't be pointed at internal/private addresses.
  clientIdMetadataDocumentEnabled: true,

  // YNAB's OAuth app model has no granular scopes (see
  // docs/ynab-guidelines-and-oauth.md) -- this connector's own tool
  // surface is what stays read-only, not anything YNAB enforces on the
  // token. scopesSupported here describes what *this server* grants to
  // Claude, which is a single undifferentiated grant for now.
  scopesSupported: ["ynab:read"],

  // Update again once docs/website-and-contact-email.md's domain decision
  // (#5) lands and this moves to a custom domain instead of *.workers.dev.
  resourceMetadata: {
    resource: "https://budget-assistant-for-ynab.dunkin0486.workers.dev/mcp",
    authorization_servers: ["https://budget-assistant-for-ynab.dunkin0486.workers.dev"],
    scopes_supported: ["ynab:read"],
    resource_name: "Budget Assistant for YNAB",
  },
});
