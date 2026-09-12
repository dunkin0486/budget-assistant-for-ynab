import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

/**
 * Worker bindings, from wrangler.jsonc. OAUTH_PROVIDER is injected
 * automatically by the OAuthProvider wrapper in index.ts.
 */
export interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER: OAuthHelpers;
  YNAB_CLIENT_ID: string;
  YNAB_CLIENT_SECRET: string;
  YNAB_REDIRECT_URI: string;
  /** Where the consent screen links for the required policy documents.
   * Point these at the companion website (docs/website-and-contact-email.md)
   * once it exists; default to this repo's docs/ in the meantime. */
  PRIVACY_POLICY_URL: string;
  TERMS_URL: string;
}

/**
 * Handed to the MCP Durable Object by OAuthProvider after the user
 * completes the YNAB OAuth flow. This is the *initial* YNAB token pair;
 * BudgetAssistantMCP keeps its own copy in Durable Object storage and
 * refreshes it in place (via updateProps) as it expires, since YNAB
 * access tokens only live ~2 hours and this project's own OAuthProvider
 * grant lifetime is independent of that.
 */
export interface YnabProps extends Record<string, unknown> {
  ynabAccessToken: string;
  ynabRefreshToken: string;
  /** Epoch ms when ynabAccessToken expires. */
  ynabExpiresAt: number;
}

/** Minimal shape of the pieces of YNAB's API this project actually reads. */
export interface YnabBudgetSummary {
  id: string;
  name: string;
}

export interface YnabCategory {
  id: string;
  category_group_id: string;
  category_group_name?: string;
  name: string;
  budgeted: number;
  activity: number;
  balance: number;
  deleted: boolean;
}

export interface YnabMonthDetail {
  month: string;
  to_be_budgeted: number;
  age_of_money: number | null;
  categories: YnabCategory[];
}

export interface YnabTransaction {
  id: string;
  date: string;
  amount: number;
  payee_name: string | null;
  category_name: string | null;
  memo: string | null;
  cleared: string;
}

export interface YnabTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}
