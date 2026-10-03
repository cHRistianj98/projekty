import { useState, type ComponentType } from "react";

import {
  Banknote,
  CalendarDays,
  Car,
  CreditCard,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  House,
  PiggyBank,
  Plus,
  Pencil,
  Repeat2,
  ShoppingBasket,
  Trash2,
  Sparkles,
  FileUp,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { AddIncomeModal } from "../components/finances/AddIncomeModal";
import { EditIncomeModal } from "../components/finances/EditIncomeModal";

import { AddExpenseModal } from "../components/dashboard/AddExpenseModal";
import { EditExpenseModal } from "../components/finances/EditExpenseModal";

import { CategoryIcon } from "../components/categories/CategoryIcon";

import { RecurringTransactionsSection } from "../components/finances/RecurringTransactionsSection";
import { AddRecurringTransactionModal } from "../components/finances/AddRecurringTransactionModal";
import { EditRecurringTransactionModal } from "../components/finances/EditRecurringTransactionModal";
import { MyFinanceImportModal } from "../components/finances/MyFinanceImportModal";

import type {
  Expense,
  ExpenseCategory,
  Income,
  MonthlyBudget,
} from "../types/Cashflow";

import type {
  RecurringTransaction,
} from "../types/RecurringTransaction";
import type { Asset } from "../types/Asset";

type FinancesProps = {
  budget: MonthlyBudget;
  assets: Asset[];

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

  onDataImported: () => Promise<void> | void;
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
  assets,
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
  onDataImported,
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
    isImportOpen,
    setIsImportOpen,
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

        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        categoryIconKey: rule.categoryIconKey,
        categoryColor: rule.categoryColor,
        categoryGroup: rule.categoryGroup,
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

      categoryId: rule.categoryId,
      categoryName: rule.categoryName,
      categoryIconKey: rule.categoryIconKey,
      categoryColor: rule.categoryColor,
      categoryGroup: rule.categoryGroup,
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
              className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
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
              className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsImportOpen(true)
            }
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white"
          >
            <FileUp size={18} />
            Import z Finanse
          </button>

          <button
            type="button"
            onClick={() =>
              setIsAddExpenseOpen(
                true
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
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
          color="text-emerald-300"
          subtitle={`${monthlyIncomes.length} źródeł`}
          icon={WalletCards}
          accent="emerald"
          eyebrow="INCOME"
        />

        <SummaryCard
          label="Wydatki i alokacje"
          value={totalExpenses}
          color="text-rose-300"
          subtitle={`${monthlyExpenses.length} pozycji`}
          icon={CreditCard}
          accent="rose"
          eyebrow="OUTFLOW"
        />

        <SummaryCard
          label="Wolne środki"
          value={available}
          color={available >= 0 ? "text-sky-300" : "text-red-300"}
          subtitle={available >= 0 ? "Kapitał gotowy do alokacji" : "Miesiąc na minusie"}
          icon={available >= 0 ? PiggyBank : TrendingDown}
          accent={available >= 0 ? "sky" : "rose"}
          eyebrow="AVAILABLE"
        />

        <SummaryCard
          label="Stopa oszczędności"
          value={savingsRate}
          color={savingsRate >= 50 ? "text-emerald-300" : "text-amber-300"}
          subtitle="Cel: minimum 50%"
          suffix="%"
          decimals={1}
          icon={savingsRate >= 50 ? TrendingUp : Target}
          accent={savingsRate >= 50 ? "emerald" : "amber"}
          eyebrow="SAVINGS RATE"
          progress={Math.max(0, Math.min(100, savingsRate))}
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/70 shadow-[0_12px_35px_rgba(0,0,0,0.14)] transition hover:border-emerald-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Banknote size={24} className="text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
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
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
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
                <TransactionVisualRow
                  key={incomeItem.id}
                  name={incomeItem.name}
                  amount={incomeItem.amount}
                  date={incomeItem.date}
                  recurring={incomeItem.recurring}
                  categoryName={incomeItem.categoryName ?? "Przychód"}
                  categoryIconKey={incomeItem.categoryIconKey ?? "Wallet"}
                  categoryColor={incomeItem.categoryColor ?? "#10b981"}
                  tone="income"
                  onEdit={() => setEditingIncome(incomeItem)}
                  onDelete={() => onDeleteIncome(incomeItem.id)}
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
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/70 ring-1 ring-slate-800">
                      <Icon size={24} className={config.color} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">
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
                          <TransactionVisualRow
                            key={expense.id}
                            name={expense.name}
                            amount={expense.amount}
                            date={expense.date}
                            recurring={expense.recurring}
                            categoryName={expense.categoryName ?? config.title}
                            categoryIconKey={expense.categoryIconKey ?? fallbackIconKey(config.category)}
                            categoryColor={expense.categoryColor ?? fallbackCategoryColor(config.category)}
                            tone="expense"
                            onEdit={() => setEditingExpense(expense)}
                            onDelete={() => onDeleteExpense(expense.id)}
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
          assets={assets}
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
          assets={assets}
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


      <MyFinanceImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={onDataImported}
      />
    </main>
  );
}


type TransactionVisualRowProps = {
  name: string;
  amount: number;
  date?: string;
  recurring: boolean;
  categoryName: string;
  categoryIconKey: string;
  categoryColor: string;
  tone: "income" | "expense";
  onEdit: () => void;
  onDelete: () => void;
};

function TransactionVisualRow({
  name,
  amount,
  date,
  recurring,
  categoryName,
  categoryIconKey,
  categoryColor,
  tone,
  onEdit,
  onDelete,
}: TransactionVisualRowProps) {
  const amountClass =
    tone === "income"
      ? "text-emerald-300"
      : "text-slate-100";

  return (
    <div className="group flex items-center gap-4 border-b border-slate-800/80 px-5 py-4 last:border-b-0 transition hover:bg-white/[0.025]">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10 shadow-lg"
        style={{
          backgroundColor: `${categoryColor}22`,
          color: categoryColor,
          boxShadow: `0 8px 24px ${categoryColor}18`,
        }}
        title={categoryName}
      >
        <CategoryIcon
          iconKey={categoryIconKey}
          className="h-5 w-5"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-bold text-slate-100">
            {name}
          </span>

          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              borderColor: `${categoryColor}35`,
              backgroundColor: `${categoryColor}12`,
              color: categoryColor,
            }}
          >
            {categoryName}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />
            {formatTransactionDate(date)}
          </span>

          <span>•</span>

          <span className="flex items-center gap-1">
            {recurring && <Repeat2 size={12} />}
            {recurring ? "Powtarzalny" : "Jednorazowy"}
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className={`min-w-[110px] text-right text-base font-black ${amountClass}`}>
          {tone === "income" ? "+" : ""}
          {amount.toLocaleString("pl-PL")} zł
        </div>

        <button
          type="button"
          onClick={onEdit}
          title="Edytuj"
          className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"
        >
          <Pencil size={17} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          title="Usuń"
          className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function formatTransactionDate(date?: string) {
  if (!date) return "Brak daty";

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;

  return `${day}.${month}.${year}`;
}

function fallbackIconKey(category: ExpenseCategory) {
  switch (category) {
    case "fixed":
      return "House";
    case "investment":
      return "TrendingUp";
    case "goal":
      return "Target";
    default:
      return "ShoppingBasket";
  }
}

function fallbackCategoryColor(category: ExpenseCategory) {
  switch (category) {
    case "fixed":
      return "#fb7185";
    case "investment":
      return "#60a5fa";
    case "goal":
      return "#a78bfa";
    default:
      return "#fbbf24";
  }
}

type SummaryCardProps = {
  label: string;
  value: number;
  color: string;
  subtitle: string;
  suffix?: string;
  decimals?: number;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: "emerald" | "rose" | "sky" | "amber";
  eyebrow: string;
  progress?: number;
};

const summaryAccent = {
  emerald: {
    border: "border-emerald-500/20",
    glow: "bg-emerald-400/10",
    icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
    bar: "bg-emerald-400",
  },
  rose: {
    border: "border-rose-500/20",
    glow: "bg-rose-400/10",
    icon: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
    bar: "bg-rose-400",
  },
  sky: {
    border: "border-sky-500/20",
    glow: "bg-sky-400/10",
    icon: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
    bar: "bg-sky-400",
  },
  amber: {
    border: "border-amber-500/20",
    glow: "bg-amber-400/10",
    icon: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    bar: "bg-amber-400",
  },
};

function SummaryCard({
  label,
  value,
  color,
  subtitle,
  suffix = " zł",
  decimals = 0,
  icon: Icon,
  accent,
  eyebrow,
  progress,
}: SummaryCardProps) {
  const palette = summaryAccent[accent];

  return (
    <div className={`group relative min-h-[180px] overflow-hidden rounded-2xl border ${palette.border} bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#07111f] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-600`}>
      <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full ${palette.glow} blur-3xl transition duration-500 group-hover:scale-125`} />
      <Icon className="pointer-events-none absolute -bottom-7 -right-4 h-32 w-32 rotate-[-10deg] text-white/[0.035] transition duration-500 group-hover:scale-110 group-hover:text-white/[0.055]" />

      <div className="relative z-[1] flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
              {eyebrow}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              {label}
            </div>
          </div>

          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${palette.icon} shadow-lg`}>
            <Icon size={21} />
          </div>
        </div>

        <div className="mt-6">
          <div className={`text-[2rem] font-black leading-none tracking-tight ${color}`}>
            {value.toLocaleString("pl-PL", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {suffix}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={13} className="opacity-70" />
            <span>{subtitle}</span>
          </div>

          {progress !== undefined && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${palette.bar} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
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