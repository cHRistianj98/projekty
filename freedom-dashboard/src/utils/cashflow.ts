import type {
  Expense,
  ExpenseCategory,
  Income,
} from "../types/Cashflow";;

export function sumExpenses(
  expenses: Expense[]
): number {
  return expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
}

export function sumByCategory(
  expenses: Expense[],
  category: ExpenseCategory
): number {
  return expenses
    .filter((expense) => expense.category === category)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function calculateAvailableCash(
  income: number,
  expenses: Expense[]
): number {
  return income - sumExpenses(expenses);
}

export function calculateSavingsRate(
  income: number,
  expenses: Expense[]
): number {
  if (income <= 0) {
    return 0;
  }

  const investments = sumByCategory(
    expenses,
    "investment"
  );

  const goals = sumByCategory(
    expenses,
    "goal"
  );

  return ((investments + goals) / income) * 100;
}

export function sumIncomes(
  incomes: Income[]
): number {
  return incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
}