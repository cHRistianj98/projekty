import type {
  Expense,
  Income,
} from "../types/Cashflow";

import type {
  RecurringTransaction,
} from "../types/RecurringTransaction";

export function isRuleAvailableInMonth(
  rule: RecurringTransaction,
  month: string
) {
  if (!rule.active) {
    return false;
  }

  const startMonth =
    rule.startDate.slice(0, 7);

  return month >= startMonth;
}

export function isRuleBookedInMonth(
  rule: RecurringTransaction,
  month: string,
  incomes: Income[],
  expenses: Expense[]
) {
  if (rule.type === "income") {
    return incomes.some(
      (income) =>
        income.recurringRuleId ===
          rule.id &&
        income.date?.startsWith(
          month
        )
    );
  }

  return expenses.some(
    (expense) =>
      expense.recurringRuleId ===
        rule.id &&
      expense.date?.startsWith(
        month
      )
  );
}

export function createDateForMonth(
  month: string,
  dayOfMonth: number
) {
  const [year, monthNumber] =
    month
      .split("-")
      .map(Number);

  const lastDay =
    new Date(
      year,
      monthNumber,
      0
    ).getDate();

  const safeDay = Math.min(
    dayOfMonth,
    lastDay
  );

  return `${month}-${String(
    safeDay
  ).padStart(2, "0")}`;
}