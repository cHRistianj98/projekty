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
  date: string;

  /*
   * Jeżeli transakcja pochodzi z reguły cyklicznej,
   * przechowujemy tutaj ID tej reguły.
   */
  recurringRuleId?: number;
};

export type Income = {
  id: number;
  name: string;
  amount: number;
  recurring: boolean;
  date: string;

  recurringRuleId?: number;
};

export type MonthlyBudget = {
  incomes: Income[];
  expenses: Expense[];
};