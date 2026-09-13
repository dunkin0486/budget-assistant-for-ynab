import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env, YnabProps } from "./types.js";
import { lastNMonths } from "./date-utils.js";
import { YnabClient, refreshYnabToken } from "./ynab-client.js";

// Refresh a bit before actual expiry to avoid a request racing an
// about-to-expire token.
const REFRESH_SKEW_MS = 60_000;

/**
 * Read-only MVP tool surface, per docs/example-prompts.md and
 * docs/personas-and-use-cases.md phase 1. All four tools are read-only by
 * construction -- none of them call a YNAB endpoint that creates, edits,
 * or deletes anything, matching the commitment in docs/privacy-policy.md
 * section 2. Guided category assignment (a write feature) is an explicit
 * later phase, not implemented here.
 *
 * list_categories from the originally sketched tool surface is folded
 * into get_budget_month below, since YNAB's month-detail endpoint already
 * nests the full category list with budgeted/activity/balance -- a
 * separate call would just duplicate data this one already returns.
 */
export class BudgetAssistantMCP extends McpAgent<Env, unknown, YnabProps> {
  server = new McpServer({ name: "Budget Assistant for YNAB", version: "0.1.0" });

  /** Returns a YnabClient using a guaranteed-valid access token, refreshing
   * and persisting a new one first if the current one is expired or about
   * to be. This is the piece that makes Durable-Object-backed props (over
   * Workers KV) matter -- see docs/hosting-options.md. */
  private async getClient(): Promise<YnabClient> {
    if (!this.props) {
      throw new Error("Not authenticated with YNAB.");
    }

    if (Date.now() < this.props.ynabExpiresAt - REFRESH_SKEW_MS) {
      return new YnabClient(this.props.ynabAccessToken);
    }

    const refreshed = await refreshYnabToken(this.env, this.props.ynabRefreshToken);
    await this.updateProps({
      ynabAccessToken: refreshed.access_token,
      ynabRefreshToken: refreshed.refresh_token,
      ynabExpiresAt: Date.now() + refreshed.expires_in * 1000,
    });
    return new YnabClient(refreshed.access_token);
  }

  async init() {
    this.server.registerTool(
      "list_budgets",
      {
        title: "List YNAB budgets",
        description:
          "List the YNAB budgets available to the connected account. Most users have one; some have several (e.g. personal + business). Call this first if you don't already know which budget_id to use for the other tools.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async () => {
        const client = await this.getClient();
        const budgets = await client.listBudgets();
        return {
          content: [{ type: "text", text: JSON.stringify(budgets, null, 2) }],
        };
      },
    );

    this.server.registerTool(
      "get_budget_month",
      {
        title: "Get budget status for a month",
        description:
          "Get Ready to Assign and every category's budgeted/spent/remaining balance for one month of a budget. Use month='current' for the present month, or 'YYYY-MM-01' for a specific past month. This covers both 'how much do I have left in X' and 'summarize my whole budget' questions.",
        inputSchema: z.object({
          budget_id: z.string().describe("From list_budgets."),
          month: z
            .string()
            .default("current")
            .describe("'current' or a specific month as 'YYYY-MM-01'."),
        }),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ budget_id, month }) => {
        const client = await this.getClient();
        const detail = await client.getBudgetMonth(budget_id, month);
        return {
          content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
        };
      },
    );

    this.server.registerTool(
      "get_category_history",
      {
        title: "Get one category's history across months",
        description:
          "Get a single category's budgeted/activity/balance for each of the last N months, oldest first. Use this for spending-trend questions ('why did I go over on dining the last three months') -- get the category_id from get_budget_month first.",
        inputSchema: z.object({
          budget_id: z.string(),
          category_id: z.string().describe("From get_budget_month's categories array."),
          months: z
            .number()
            .int()
            .min(1)
            .max(12)
            .default(3)
            .describe("How many months back to look, including the current month."),
        }),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ budget_id, category_id, months }) => {
        const client = await this.getClient();
        const monthStrings = lastNMonths(months);
        const history = await Promise.all(
          monthStrings.map((month) => client.getCategoryForMonth(budget_id, month, category_id)),
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                history.map((c, i) => ({ month: monthStrings[i], ...c })),
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "list_transactions",
      {
        title: "List transactions",
        description:
          "List transactions for a budget, optionally filtered to one category and/or a start date. Useful for finding what specifically drove a category's spending (e.g. after get_category_history shows a spike).",
        inputSchema: z.object({
          budget_id: z.string(),
          category_id: z.string().optional().describe("Limit to one category, from get_budget_month."),
          since_date: z
            .string()
            .optional()
            .describe("ISO date 'YYYY-MM-DD'; only transactions on/after this date."),
        }),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ budget_id, category_id, since_date }) => {
        const client = await this.getClient();
        const transactions = await client.listTransactions(budget_id, {
          categoryId: category_id,
          sinceDate: since_date,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(transactions, null, 2) }],
        };
      },
    );
  }
}
