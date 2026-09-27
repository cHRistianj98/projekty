import type {
  ExpenseCategory,
} from "./Cashflow";

export type RecurringTransactionType =
  | "income"
  | "expense";

export type RecurringTransaction = {
  id: number;

  type: RecurringTransactionType;

  name: string;

  amount: number;

  category?: ExpenseCategory;

  dayOfMonth: number;

  startDate: string;

  active: boolean;
};