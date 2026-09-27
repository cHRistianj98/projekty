import type {
  ExpenseCategory,
} from "./Cashflow";

export type BudgetLimit = {
  category: ExpenseCategory;
  limit: number;
};

export type MonthlyBudgetPlan = {
  month: string;
  limits: BudgetLimit[];
};