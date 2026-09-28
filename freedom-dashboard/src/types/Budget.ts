import type { ExpenseCategory } from "./Cashflow";

export type BudgetLimit = {
  // Legacy bucket kept for old plans / compatibility.
  category?: ExpenseCategory;

  // Categories 2.0
  categoryId?: number;
  categoryName?: string;
  categoryIconKey?: string;
  categoryColor?: string;
  categoryGroup?: string;

  limit: number;
};

export type MonthlyBudgetPlan = {
  month: string;
  limits: BudgetLimit[];
};
