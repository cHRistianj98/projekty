import type { ExpenseCategory } from "./Cashflow";

export type RecurringTransactionType =
  | "income"
  | "expense";

export type RecurringTransaction = {
  id: number;
  type: RecurringTransactionType;
  name: string;
  amount: number;
  category?: ExpenseCategory;

  categoryId?: number;
  categoryName?: string;
  categoryIconKey?: string;
  categoryColor?: string;
  categoryGroup?: string;

  dayOfMonth: number;
  startDate: string;
  active: boolean;
};
