import type {
  Env,
  YnabBudgetSummary,
  YnabCategory,
  YnabMonthDetail,
  YnabTokenResponse,
  YnabTransaction,
} from "./types.js";

const YNAB_API_BASE = "https://api.ynab.com/v1";
const YNAB_TOKEN_URL = "https://app.ynab.com/oauth/token";
export const YNAB_AUTHORIZE_URL = "https://app.ynab.com/oauth/authorize";

/**
 * Thin wrapper class around YNAB's REST API. Deliberately does not log
 * request or response bodies anywhere -- only the caller's error handling
 * (in index.ts) may log a status code and endpoint name for debugging, per
 * the operational-logging commitment in docs/privacy-policy.md.
 */
export class YnabClient {
  constructor(private accessToken: string) {}

  private async request<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const url = new URL(`${YNAB_API_BASE}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      // Intentionally omit response body from the thrown error -- it may
      // echo back request params. Status + path is enough to diagnose.
      throw new YnabApiError(response.status, path);
    }

    const json = (await response.json()) as { data: T };
    return json.data;
  }

  async listBudgets(): Promise<YnabBudgetSummary[]> {
    const data = await this.request<{ budgets: YnabBudgetSummary[] }>("/budgets");
    return data.budgets;
  }

  /** Used only to get a stable user id for the OAuth grant record -- never
   * exposed as an MCP tool. */
  async getUserId(): Promise<string> {
    const data = await this.request<{ user: { id: string } }>("/user");
    return data.user.id;
  }

  /** month is "current" or "YYYY-MM-01". */
  async getBudgetMonth(budgetId: string, month: string): Promise<YnabMonthDetail> {
    const data = await this.request<{ month: YnabMonthDetail }>(
      `/budgets/${budgetId}/months/${month}`,
    );
    return data.month;
  }

  async getCategoryForMonth(
    budgetId: string,
    month: string,
    categoryId: string,
  ): Promise<YnabCategory> {
    const data = await this.request<{ category: YnabCategory }>(
      `/budgets/${budgetId}/months/${month}/categories/${categoryId}`,
    );
    return data.category;
  }

  async listTransactions(
    budgetId: string,
    opts: { categoryId?: string; sinceDate?: string },
  ): Promise<YnabTransaction[]> {
    const path = opts.categoryId
      ? `/budgets/${budgetId}/categories/${opts.categoryId}/transactions`
      : `/budgets/${budgetId}/transactions`;
    const data = await this.request<{ transactions: YnabTransaction[] }>(path, {
      since_date: opts.sinceDate,
    });
    return data.transactions;
  }
}

export class YnabApiError extends Error {
  constructor(
    public status: number,
    public path: string,
  ) {
    super(`YNAB API request to ${path} failed with status ${status}`);
    this.name = "YnabApiError";
  }
}

export async function exchangeYnabCode(env: Env, code: string): Promise<YnabTokenResponse> {
  return tokenRequest(env, {
    grant_type: "authorization_code",
    code,
    redirect_uri: env.YNAB_REDIRECT_URI,
  });
}

export async function refreshYnabToken(env: Env, refreshToken: string): Promise<YnabTokenResponse> {
  return tokenRequest(env, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function tokenRequest(env: Env, params: Record<string, string>): Promise<YnabTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.YNAB_CLIENT_ID,
    client_secret: env.YNAB_CLIENT_SECRET,
    ...params,
  });

  const response = await fetch(YNAB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`YNAB token endpoint returned ${response.status}`);
  }

  return (await response.json()) as YnabTokenResponse;
}
