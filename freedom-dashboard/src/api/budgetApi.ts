import type { ExpenseCategory } from "../types/Cashflow";
import type { MonthlyBudgetPlan } from "../types/Budget";
import { authApi } from "./authApi";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

type BackendLimit = {
  category?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryIconKey?: string | null;
  categoryColor?: string | null;
  categoryGroup?: string | null;
  limit: number;
};

type BackendPlan = {
  month: string;
  limits: BackendLimit[];
};

function headers(): HeadersInit {
  const token = authApi.getToken();

  if (!token) {
    throw new Error("Brak tokenu.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handle<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        `HTTP ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

function fromBackend(
  plan: BackendPlan
): MonthlyBudgetPlan {
  return {
    month: plan.month,
    limits: plan.limits.map((limit) => ({
      category: limit.category
        ? (limit.category.toLowerCase() as ExpenseCategory)
        : undefined,
      categoryId: limit.categoryId ?? undefined,
      categoryName: limit.categoryName ?? undefined,
      categoryIconKey:
        limit.categoryIconKey ?? undefined,
      categoryColor:
        limit.categoryColor ?? undefined,
      categoryGroup:
        limit.categoryGroup ?? undefined,
      limit: Number(limit.limit),
    })),
  };
}

function body(plan: MonthlyBudgetPlan) {
  return {
    month: plan.month,
    limits: plan.limits.map((limit) => ({
      category: limit.category
        ? limit.category.toUpperCase()
        : null,
      categoryId: limit.categoryId ?? null,
      limit: limit.limit,
    })),
  };
}

export const budgetApi = {
  async getAll() {
    const plans =
      await handle<BackendPlan[]>(
        await fetch(
          `${API_URL}/api/budget-plans`,
          { headers: headers() }
        )
      );

    return plans.map(fromBackend);
  },

  async save(plan: MonthlyBudgetPlan) {
    return fromBackend(
      await handle<BackendPlan>(
        await fetch(
          `${API_URL}/api/budget-plans`,
          {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body(plan)),
          }
        )
      )
    );
  },
};
