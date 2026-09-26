export type ExpenseCategory =
  | "fixed"
  | "living"
  | "investment"
  | "goal";

export type Expense = {
  id: number;
  name: string;
  amount: number;
  category: ExpenseCategory;
  recurring: boolean;
};

export type Income = {
  id: number;
  name: string;
  amount: number;
  recurring: boolean;
};

export type MonthlyBudget = {
  incomes: Income[];
  expenses: Expense[];
};