import type {
  MonthlySnapshot,
} from "../types/MonthlySnapshot";

import {
  authApi,
} from "./authApi";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

type BackendAssetCategory =
  | "CASH"
  | "STOCKS"
  | "CRYPTO"
  | "REAL_ESTATE"
  | "BUSINESS"
  | "VEHICLE"
  | "METALS"
  | "OTHER";

type BackendSnapshot = {
  id: number;
  month: string;
  closedAt: string;

  cashflow: {
    income: number;
    expenses: number;
    surplus: number;
    savingsRate: number;
    incomeTransactions: number;
    expenseTransactions: number;
  };

  wealth: {
    netWorth: number;
    assets: number;
    liabilities: number;
  };

  assets: Array<{
    id: number;
    name: string;
    value: number;
    category?: BackendAssetCategory;
  }>;

  goals: MonthlySnapshot["goals"];
  liabilities: MonthlySnapshot["liabilities"];
  player: MonthlySnapshot["player"];
};

function authHeaders(): HeadersInit {
  const token = authApi.getToken();

  if (!token) {
    throw new Error("Brak tokenu JWT");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function mapAssetCategory(
  category?: BackendAssetCategory
) {
  switch (category) {
    case "CASH":
      return "cash" as const;

    case "STOCKS":
      return "stocks" as const;

    case "CRYPTO":
      return "crypto" as const;

    case "REAL_ESTATE":
      return "realEstate" as const;

    case "BUSINESS":
      return "business" as const;

    case "VEHICLE":
      return "vehicle" as const;

    case "METALS":
      return "metals" as const;

    case "OTHER":
      return "other" as const;

    default:
      return undefined;
  }
}

function fromBackend(
  snapshot: BackendSnapshot
): MonthlySnapshot {
  return {
    ...snapshot,

    cashflow: {
      income: Number(snapshot.cashflow.income),
      expenses: Number(snapshot.cashflow.expenses),
      surplus: Number(snapshot.cashflow.surplus),
      savingsRate:
        Number(snapshot.cashflow.savingsRate),
      incomeTransactions:
        snapshot.cashflow.incomeTransactions,
      expenseTransactions:
        snapshot.cashflow.expenseTransactions,
    },

    wealth: {
      netWorth:
        Number(snapshot.wealth.netWorth),

      assets:
        Number(snapshot.wealth.assets),

      liabilities:
        Number(snapshot.wealth.liabilities),
    },

    assets: snapshot.assets.map(
      (asset) => ({
        ...asset,
        value: Number(asset.value),
        category:
          mapAssetCategory(asset.category),
      })
    ),

    goals: snapshot.goals.map(
      (goal) => ({
        ...goal,

        currentAmount:
          Number(goal.currentAmount),

        targetAmount:
          Number(goal.targetAmount),

        monthlyContribution:
          Number(goal.monthlyContribution),
      })
    ),

    liabilities:
      snapshot.liabilities.map(
        (liability) => ({
          ...liability,

          originalAmount:
            Number(liability.originalAmount),

          remainingAmount:
            Number(liability.remainingAmount),

          monthlyPayment:
            Number(liability.monthlyPayment),

          principalPayment:
            Number(liability.principalPayment),

          interestPayment:
            Number(liability.interestPayment),

          interestRate:
            Number(liability.interestRate),
        })
      ),
  };
}

async function handleResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      body ||
        `HTTP ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

async function getAll() {
  const response = await fetch(
    `${API_URL}/api/monthly-snapshots`,
    {
      headers: authHeaders(),
    }
  );

  const snapshots =
    await handleResponse<BackendSnapshot[]>(
      response
    );

  return snapshots.map(fromBackend);
}

async function closeMonth(
  month: string
) {
  const response = await fetch(
    `${API_URL}/api/monthly-snapshots/close/${month}`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );

  return fromBackend(
    await handleResponse<BackendSnapshot>(
      response
    )
  );
}

export const monthlySnapshotApi = {
  getAll,
  closeMonth,
};