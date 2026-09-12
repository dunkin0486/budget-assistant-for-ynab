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

  // YNAB's OAuth app model has no granular scopes (see
  // docs/ynab-guidelines-and-oauth.md) -- this connector's own tool
  // surface is what stays read-only, not anything YNAB enforces on the
  // token. scopesSupported here describes what *this server* grants to
  // Claude, which is a single undifferentiated grant for now.
  scopesSupported: ["ynab:read"],

  // TODO: replace with the actual deployed URL (the *.workers.dev default,
  // or a custom domain once docs/website-and-contact-email.md's domain
  // decision is made) before going live.
  resourceMetadata: {
    resource: "https://budget-assistant-for-ynab.workers.dev/mcp",
    authorization_servers: ["https://budget-assistant-for-ynab.workers.dev"],
    scopes_supported: ["ynab:read"],
    resource_name: "Budget Assistant for YNAB",
  },
});
