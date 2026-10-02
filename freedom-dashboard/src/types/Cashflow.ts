export type ExpenseCategory =
  | "fixed"
  | "living"
  | "investment"
  | "goal";

export type TransactionCategoryDetails = {
  categoryId?: number;
  categoryName?: string;
  categoryIconKey?: string;
  categoryColor?: string;
  categoryGroup?: string;
};

export type Expense = TransactionCategoryDetails & {
  id: number;
  name: string;
  amount: number;
  category: ExpenseCategory;
  recurring: boolean;
  date: string;
  recurringRuleId?: number;
  assetId?: number;
  goalId?: number;
};

export type Income = TransactionCategoryDetails & {
  id: number;
  name: string;
  amount: number;
  recurring: boolean;
  date: string;
  recurringRuleId?: number;
  assetId?: number;
};

export type MonthlyBudget = {
  incomes: Income[];
  expenses: Expense[];
};
