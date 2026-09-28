import { authApi } from "./authApi";
import type { Expense, ExpenseCategory, Income, MonthlyBudget } from "../types/Cashflow";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type BackendTransaction = {
  id: number;
  type: "INCOME" | "EXPENSE";
  name: string;
  amount: number;
  category?: "FIXED" | "LIVING" | "INVESTMENT" | "GOAL" | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryIconKey?: string | null;
  categoryColor?: string | null;
  categoryGroup?: string | null;
  recurring: boolean;
  date: string;
  recurringRuleId?: number | null;
};

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function legacyCategory(value?: BackendTransaction["category"]): ExpenseCategory {
  switch (value) {
    case "FIXED": return "fixed";
    case "INVESTMENT": return "investment";
    case "GOAL": return "goal";
    default: return "living";
  }
}

function details(item: BackendTransaction) {
  return {
    categoryId: item.categoryId ?? undefined,
    categoryName: item.categoryName ?? undefined,
    categoryIconKey: item.categoryIconKey ?? undefined,
    categoryColor: item.categoryColor ?? undefined,
    categoryGroup: item.categoryGroup ?? undefined,
  };
}

function toExpense(item: BackendTransaction): Expense {
  return {
    id: item.id,
    name: item.name,
    amount: Number(item.amount),
    category: legacyCategory(item.category),
    recurring: item.recurring,
    date: item.date,
    recurringRuleId: item.recurringRuleId ?? undefined,
    ...details(item),
  };
}

function toIncome(item: BackendTransaction): Income {
  return {
    id: item.id,
    name: item.name,
    amount: Number(item.amount),
    recurring: item.recurring,
    date: item.date,
    recurringRuleId: item.recurringRuleId ?? undefined,
    ...details(item),
  };
}

function expensePayload(expense: Expense) {
  return {
    type: "EXPENSE",
    name: expense.name,
    amount: expense.amount,
    category: expense.category.toUpperCase(),
    categoryId: expense.categoryId ?? null,
    recurring: expense.recurring,
    date: expense.date,
    recurringRuleId: expense.recurringRuleId ?? null,
  };
}

function incomePayload(income: Income) {
  return {
    type: "INCOME",
    name: income.name,
    amount: income.amount,
    category: null,
    categoryId: income.categoryId ?? null,
    recurring: income.recurring,
    date: income.date,
    recurringRuleId: income.recurringRuleId ?? null,
  };
}

export const transactionApi = {
  async getAll(): Promise<MonthlyBudget> {
    const items = await fetch(`${API_URL}/api/transactions`, { headers: headers() })
      .then(read<BackendTransaction[]>);

    return {
      incomes: items.filter((item) => item.type === "INCOME").map(toIncome),
      expenses: items.filter((item) => item.type === "EXPENSE").map(toExpense),
    };
  },

  createExpense: (expense: Expense) =>
    fetch(`${API_URL}/api/transactions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(expensePayload(expense)),
    }).then(read<BackendTransaction>).then(toExpense),

  createIncome: (income: Income) =>
    fetch(`${API_URL}/api/transactions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(incomePayload(income)),
    }).then(read<BackendTransaction>).then(toIncome),

  updateExpense: (expense: Expense) =>
    fetch(`${API_URL}/api/transactions/${expense.id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(expensePayload(expense)),
    }).then(read<BackendTransaction>).then(toExpense),

  updateIncome: (income: Income) =>
    fetch(`${API_URL}/api/transactions/${income.id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(incomePayload(income)),
    }).then(read<BackendTransaction>).then(toIncome),

  remove: (id: number) =>
    fetch(`${API_URL}/api/transactions/${id}`, {
      method: "DELETE",
      headers: headers(),
    }).then(read<void>),
};
