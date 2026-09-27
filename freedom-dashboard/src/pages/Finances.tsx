import { useState } from "react";

import {
  Banknote,
  Car,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  House,
  Plus,
  ShoppingBasket,
} from "lucide-react";

import { AddIncomeModal } from "../components/finances/AddIncomeModal";
import { IncomeRow } from "../components/finances/IncomeRow";
import { EditIncomeModal } from "../components/finances/EditIncomeModal";

import { AddExpenseModal } from "../components/dashboard/AddExpenseModal";
import { ExpenseRow } from "../components/finances/ExpenseRow";
import { EditExpenseModal } from "../components/finances/EditExpenseModal";

import { RecurringTransactionsSection } from "../components/finances/RecurringTransactionsSection";
import { AddRecurringTransactionModal } from "../components/finances/AddRecurringTransactionModal";
import { EditRecurringTransactionModal } from "../components/finances/EditRecurringTransactionModal";

import type {
  Expense,
  ExpenseCategory,
  Income,
  MonthlyBudget,
} from "../types/Cashflow";

import type {
  RecurringTransaction,
} from "../types/RecurringTransaction";

type FinancesProps = {
  budget: MonthlyBudget;

  recurringTransactions:
    RecurringTransaction[];

  onAddIncome: (
    income: Income
  ) => void;

  onDeleteIncome: (
    id: number
  ) => void;

  onUpdateIncome: (
    income: Income
  ) => void;

  onAddExpense: (
    expense: Expense
  ) => void;

  onDeleteExpense: (
    id: number
  ) => void;

  onUpdateExpense: (
    expense: Expense
  ) => void;

  onAddRecurringTransaction: (
    rule: RecurringTransaction
  ) => void;

  onUpdateRecurringTransaction: (
    rule: RecurringTransaction
  ) => void;

  onToggleRecurringTransaction: (
    id: number
  ) => void;

  onDeleteRecurringTransaction: (
    id: number
  ) => void;
};

const categories = [
  {
    category:
      "fixed" as ExpenseCategory,

    title: "Koszty stałe",

    icon: House,

    color: "text-red-400",
  },

  {
    category:
      "living" as ExpenseCategory,

    title: "Życie",

    icon: ShoppingBasket,

    color: "text-amber-400",
  },

  {
    category:
      "investment" as ExpenseCategory,

    title: "Inwestycje",

    icon:
      ChartNoAxesCombined,

    color: "text-blue-400",
  },

  {
    category:
      "goal" as ExpenseCategory,

    title: "Cele",

    icon: Car,

    color: "text-violet-400",
  },
];

export function Finances({
  budget,
  recurringTransactions,
  onAddIncome,
  onDeleteIncome,
  onUpdateIncome,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
  onAddRecurringTransaction,
  onUpdateRecurringTransaction,
  onToggleRecurringTransaction,
  onDeleteRecurringTransaction,
}: FinancesProps) {
  const [
    isAddExpenseOpen,
    setIsAddExpenseOpen,
  ] = useState(false);

  const [
    isAddIncomeOpen,
    setIsAddIncomeOpen,
  ] = useState(false);

  const [
    isAddRecurringOpen,
    setIsAddRecurringOpen,
  ] = useState(false);

  const [
    editingExpense,
    setEditingExpense,
  ] =
    useState<Expense | null>(
      null
    );

  const [
    editingIncome,
    setEditingIncome,
  ] =
    useState<Income | null>(
      null
    );

  const [
    editingRecurringRule,
    setEditingRecurringRule,
  ] =
    useState<RecurringTransaction | null>(
      null
    );

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth()
  );

  const monthlyIncomes =
    budget.incomes.filter(
      (income) =>
        isTransactionInMonth(
          income.date,
          selectedMonth
        )
    );

  const monthlyExpenses =
    budget.expenses.filter(
      (expense) =>
        isTransactionInMonth(
          expense.date,
          selectedMonth
        )
    );

  const income =
    monthlyIncomes.reduce(
      (
        sum,
        incomeItem
      ) =>
        sum +
        incomeItem.amount,
      0
    );

  const totalExpenses =
    monthlyExpenses.reduce(
      (sum, expense) =>
        sum +
        expense.amount,
      0
    );

  const available =
    income -
    totalExpenses;

  const savingsRate =
    income > 0
      ? (available /
          income) *
        100
      : 0;

  function changeMonth(
    offset: number
  ) {
    const [year, month] =
      selectedMonth
        .split("-")
        .map(Number);

    const date =
      new Date(
        year,
        month - 1 +
          offset,
        1
      );

    const nextMonth =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    setSelectedMonth(
      nextMonth
    );
  }

  function handleBookRule(
    rule: RecurringTransaction
  ) {
    const date =
      createDateForMonth(
        selectedMonth,
        rule.dayOfMonth
      );

    if (
      rule.type ===
      "income"
    ) {
      onAddIncome({
        id: Date.now(),

        name: rule.name,

        amount:
          rule.amount,

        recurring: true,

        date,

        recurringRuleId:
          rule.id,
      });

      return;
    }

    onAddExpense({
      id: Date.now(),

      name: rule.name,

      amount:
        rule.amount,

      category:
        rule.category ??
        "fixed",

      recurring: true,

      date,

      recurringRuleId:
        rule.id,
    });
  }

  const monthLabel =
    formatMonth(
      selectedMonth
    );

  return (
    <main className="min-h-screen bg-[#050b16] p-8">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Freedom
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Finanse
          </h1>

          <p className="mt-2 text-slate-500">
            Zarządzaj miesięcznym
            cashflow.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
            <button
              type="button"
              onClick={() =>
                changeMonth(-1)
              }
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <div className="min-w-44 text-center">
              <p className="text-sm font-semibold capitalize">
                {monthLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                changeMonth(1)
              }
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsAddExpenseOpen(
                true
              )
            }
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus size={18} />

            Dodaj wydatek
          </button>
        </div>
      </div>

      {/* SUMMARY */}

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Dochód"
          value={income}
          color="text-emerald-400"
          subtitle={`${monthlyIncomes.length} źródeł`}
        />

        <SummaryCard
          label="Wydatki i alokacje"
          value={
            totalExpenses
          }
          color="text-red-400"
          subtitle={`${monthlyExpenses.length} pozycji`}
        />

        <SummaryCard
          label="Wolne środki"
          value={available}
          color={
            available >= 0
              ? "text-blue-400"
              : "text-red-400"
          }
          subtitle={
            available >= 0
              ? "Miesiąc na plusie"
              : "Miesiąc na minusie"
          }
        />

        <SummaryCard
          label="Stopa oszczędności"
          value={savingsRate}
          color={
            savingsRate >= 50
              ? "text-emerald-400"
              : "text-amber-400"
          }
          subtitle="Cel: minimum 50%"
          suffix="%"
          decimals={1}
        />
      </section>

      {/* RECURRING */}

      <RecurringTransactionsSection
        rules={
          recurringTransactions
        }
        selectedMonth={
          selectedMonth
        }
        incomes={
          budget.incomes
        }
        expenses={
          budget.expenses
        }
        onAddRule={() =>
          setIsAddRecurringOpen(
            true
          )
        }
        onEditRule={
          setEditingRecurringRule
        }
        onBookRule={
          handleBookRule
        }
        onToggleRule={
          onToggleRecurringTransaction
        }
        onDeleteRule={
          onDeleteRecurringTransaction
        }
      />

      {/* INCOMES */}

      <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <Banknote
              size={20}
              className="text-emerald-400"
            />

            <div>
              <h2 className="font-semibold">
                Przychody
              </h2>

              <span className="text-xs text-slate-500">
                {
                  monthlyIncomes.length
                }{" "}
                źródeł
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <span className="font-bold text-emerald-400">
              +
              {income.toLocaleString(
                "pl-PL"
              )}{" "}
              zł
            </span>

            <button
              type="button"
              onClick={() =>
                setIsAddIncomeOpen(
                  true
                )
              }
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <Plus size={16} />

              Dodaj
            </button>
          </div>
        </div>

        {monthlyIncomes.length ===
        0 ? (
          <EmptyRows
            text={`Brak przychodów w ${monthLabel}.`}
          />
        ) : (
          monthlyIncomes
            .slice()
            .sort(
              (a, b) =>
                getTransactionDate(
                  b.date
                ).localeCompare(
                  getTransactionDate(
                    a.date
                  )
                )
            )
            .map(
              (
                incomeItem
              ) => (
                <IncomeRow
                  key={
                    incomeItem.id
                  }
                  income={
                    incomeItem
                  }
                  onEdit={() =>
                    setEditingIncome(
                      incomeItem
                    )
                  }
                  onDelete={() =>
                    onDeleteIncome(
                      incomeItem.id
                    )
                  }
                />
              )
            )
        )}
      </section>

      {/* EXPENSE CATEGORIES */}

      <div className="mt-8 space-y-6">
        {categories.map(
          (config) => {
            const categoryExpenses =
              monthlyExpenses.filter(
                (expense) =>
                  expense.category ===
                  config.category
              );

            const categoryTotal =
              categoryExpenses.reduce(
                (
                  sum,
                  expense
                ) =>
                  sum +
                  expense.amount,
                0
              );

            const Icon =
              config.icon;

            return (
              <section
                key={
                  config.category
                }
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      size={20}
                      className={
                        config.color
                      }
                    />

                    <div>
                      <h2 className="font-semibold">
                        {
                          config.title
                        }
                      </h2>

                      <span className="text-xs text-slate-500">
                        {
                          categoryExpenses.length
                        }{" "}
                        pozycji
                      </span>
                    </div>
                  </div>

                  <span className="font-bold">
                    {categoryTotal.toLocaleString(
                      "pl-PL"
                    )}{" "}
                    zł
                  </span>
                </div>

                <div>
                  {categoryExpenses.length ===
                  0 ? (
                    <EmptyRows
                      text={`Brak pozycji w kategorii „${config.title}”.`}
                    />
                  ) : (
                    categoryExpenses
                      .slice()
                      .sort(
                        (
                          a,
                          b
                        ) =>
                          getTransactionDate(
                            b.date
                          ).localeCompare(
                            getTransactionDate(
                              a.date
                            )
                          )
                      )
                      .map(
                        (
                          expense
                        ) => (
                          <ExpenseRow
                            key={
                              expense.id
                            }
                            expense={
                              expense
                            }
                            onEdit={() =>
                              setEditingExpense(
                                expense
                              )
                            }
                            onDelete={() =>
                              onDeleteExpense(
                                expense.id
                              )
                            }
                          />
                        )
                      )
                  )}
                </div>
              </section>
            );
          }
        )}
      </div>

      {/* ADD EXPENSE */}

      {isAddExpenseOpen && (
        <AddExpenseModal
          onClose={() =>
            setIsAddExpenseOpen(
              false
            )
          }
          onAdd={
            onAddExpense
          }
        />
      )}

      {/* EDIT EXPENSE */}

      {editingExpense && (
        <EditExpenseModal
          expense={
            editingExpense
          }
          onClose={() =>
            setEditingExpense(
              null
            )
          }
          onSave={(
            expense
          ) => {
            onUpdateExpense(
              expense
            );

            setEditingExpense(
              null
            );
          }}
        />
      )}

      {/* ADD INCOME */}

      {isAddIncomeOpen && (
        <AddIncomeModal
          onClose={() =>
            setIsAddIncomeOpen(
              false
            )
          }
          onAdd={
            onAddIncome
          }
        />
      )}

      {/* EDIT INCOME */}

      {editingIncome && (
        <EditIncomeModal
          income={
            editingIncome
          }
          onClose={() =>
            setEditingIncome(
              null
            )
          }
          onSave={(
            income
          ) => {
            onUpdateIncome(
              income
            );

            setEditingIncome(
              null
            );
          }}
        />
      )}

      {/* ADD RECURRING */}

      {isAddRecurringOpen && (
        <AddRecurringTransactionModal
          onClose={() =>
            setIsAddRecurringOpen(
              false
            )
          }
          onAdd={
            onAddRecurringTransaction
          }
        />
      )}

      {/* EDIT RECURRING */}

      {editingRecurringRule && (
        <EditRecurringTransactionModal
          rule={
            editingRecurringRule
          }
          onClose={() =>
            setEditingRecurringRule(
              null
            )
          }
          onSave={(
            rule
          ) => {
            onUpdateRecurringTransaction(
              rule
            );

            setEditingRecurringRule(
              null
            );
          }}
        />
      )}
    </main>
  );
}

type SummaryCardProps = {
  label: string;

  value: number;

  color: string;

  subtitle: string;

  suffix?: string;

  decimals?: number;
};

function SummaryCard({
  label,
  value,
  color,
  subtitle,
  suffix = " zł",
  decimals = 0,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div
        className={`mt-3 text-3xl font-bold ${color}`}
      >
        {value.toLocaleString(
          "pl-PL",
          {
            minimumFractionDigits:
              decimals,

            maximumFractionDigits:
              decimals,
          }
        )}

        {suffix}
      </div>

      <p className="mt-2 text-xs text-slate-600">
        {subtitle}
      </p>
    </div>
  );
}

function EmptyRows({
  text,
}: {
  text: string;
}) {
  return (
    <div className="px-5 py-8 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

function getCurrentMonth() {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getTransactionDate(
  date?: string
) {
  return date ?? "";
}

function isTransactionInMonth(
  date:
    | string
    | undefined,

  month: string
) {
  if (date) {
    return date.startsWith(
      month
    );
  }

  /*
   * Stare rekordy zapisane przed
   * dodaniem pola date pokazujemy
   * tylko w bieżącym miesiącu.
   */
  return (
    month ===
    getCurrentMonth()
  );
}

function createDateForMonth(
  month: string,
  dayOfMonth: number
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const lastDay =
    new Date(
      year,
      monthNumber,
      0
    ).getDate();

  const safeDay =
    Math.min(
      dayOfMonth,
      lastDay
    );

  return `${month}-${String(
    safeDay
  ).padStart(2, "0")}`;
}

function formatMonth(
  month: string
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber - 1,
      1
    );

  return date.toLocaleDateString(
    "pl-PL",
    {
      month: "long",
      year: "numeric",
    }
  );
}