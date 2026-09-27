import {
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  BudgetPlanModal,
} from "../components/budget/BudgetPlanModal";

import type {
  MonthlyBudget as CashflowBudget,
  Expense,
  ExpenseCategory,
} from "../types/Cashflow";

import type {
  MonthlyBudgetPlan,
} from "../types/Budget";

type BudgetProps = {
  budget: CashflowBudget;

  budgetPlans: MonthlyBudgetPlan[];

  selectedMonth: string;

  onChangeMonth: (
    month: string
  ) => void;

  onSavePlan: (
    plan: MonthlyBudgetPlan
  ) => void;
};

const categoryLabels: Record<
  ExpenseCategory,
  string
> = {
  fixed: "Stałe",
  living: "Życie",
  investment: "Inwestycje",
  goal: "Cele",
};

export function Budget({
  budget,
  budgetPlans,
  selectedMonth,
  onChangeMonth,
  onSavePlan,
}: BudgetProps) {
  const [
    isPlanModalOpen,
    setIsPlanModalOpen,
  ] = useState(false);

  /*
   * =========================
   * CURRENT PLAN
   * =========================
   */

  const currentPlan =
    budgetPlans.find(
      (plan) =>
        plan.month ===
        selectedMonth
    );

  /*
   * =========================
   * MONTH TRANSACTIONS
   * =========================
   */

  const monthlyExpenses =
    budget.expenses.filter(
      (expense) =>
        isExpenseInMonth(
          expense,
          selectedMonth
        )
    );

  const monthlyIncomes =
    budget.incomes.filter(
      (income) =>
        isTransactionInMonth(
          income.date,
          selectedMonth
        )
    );

  /*
   * =========================
   * TOTALS
   * =========================
   */

  const totalIncome =
    monthlyIncomes.reduce(
      (sum, income) =>
        sum + income.amount,
      0
    );

  const totalExpenses =
    monthlyExpenses.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );

  const surplus =
    totalIncome -
    totalExpenses;

  const savingsRate =
    totalIncome > 0
      ? (surplus /
          totalIncome) *
        100
      : 0;

  const totalPlanned =
    currentPlan
      ? currentPlan.limits.reduce(
          (sum, item) =>
            sum + item.limit,
          0
        )
      : 0;

  const planRemaining =
    totalPlanned -
    totalExpenses;

  const plannedBuffer =
    totalIncome -
    totalPlanned;

  /*
   * =========================
   * MONTH NAVIGATION
   * =========================
   */

  function changeMonth(
    offset: number
  ) {
    onChangeMonth(
      offsetMonth(
        selectedMonth,
        offset
      )
    );
  }

  /*
   * =========================
   * COPY PREVIOUS PLAN
   * =========================
   */

  const previousMonth =
    offsetMonth(
      selectedMonth,
      -1
    );

  const previousPlan =
    budgetPlans.find(
      (plan) =>
        plan.month ===
        previousMonth
    );

  function copyPreviousPlan() {
    if (!previousPlan) {
      return;
    }

    const copiedPlan: MonthlyBudgetPlan =
      {
        month:
          selectedMonth,

        limits:
          previousPlan.limits.map(
            (item) => ({
              ...item,
            })
          ),
      };

    onSavePlan(
      copiedPlan
    );
  }

  const monthLabel =
    formatMonth(
      selectedMonth
    );

  return (
    <main className="min-h-screen bg-[#050b16] p-8">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <PiggyBank
              size={24}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Budżet
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Plan kontra
              rzeczywiste wydatki
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* MONTH */}

          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
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

            <div className="min-w-40 text-center">
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

          {/* EDIT */}

          {currentPlan && (
            <button
              type="button"
              onClick={() =>
                setIsPlanModalOpen(
                  true
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Pencil
                size={17}
              />

              Edytuj plan
            </button>
          )}
        </div>
      </div>

      {/* =========================
          SUMMARY
      ========================= */}

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Dochody"
          value={`${totalIncome.toLocaleString(
            "pl-PL"
          )} zł`}
          subtitle={`${monthlyIncomes.length} transakcji`}
          icon={
            <TrendingUp
              size={21}
              className="text-emerald-400"
            />
          }
        />

        <SummaryCard
          title="Wydatki"
          value={`${totalExpenses.toLocaleString(
            "pl-PL"
          )} zł`}
          subtitle={`${monthlyExpenses.length} transakcji`}
          icon={
            <TrendingDown
              size={21}
              className="text-red-400"
            />
          }
        />

        <SummaryCard
          title="Nadwyżka"
          value={`${surplus.toLocaleString(
            "pl-PL"
          )} zł`}
          subtitle={
            surplus >= 0
              ? "Jesteś na plusie"
              : "Miesiąc na minusie"
          }
          icon={
            <Wallet
              size={21}
              className={
                surplus >= 0
                  ? "text-blue-400"
                  : "text-red-400"
              }
            />
          }
        />

        <SummaryCard
          title="Stopa oszczędności"
          value={`${savingsRate.toFixed(
            1
          )}%`}
          subtitle="Dochód minus wydatki"
          icon={
            <PiggyBank
              size={21}
              className="text-amber-400"
            />
          }
        />
      </section>

      {/* =========================
          NO PLAN
      ========================= */}

      {!currentPlan && (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
          <PiggyBank
            size={42}
            className="mx-auto text-slate-600"
          />

          <h2 className="mt-4 text-xl font-bold">
            Brak planu budżetu
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Nie utworzono
            jeszcze planu na{" "}
            <span className="capitalize">
              {monthLabel}
            </span>
            .
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setIsPlanModalOpen(
                  true
                )
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              <Plus size={18} />

              Utwórz nowy plan
            </button>

            {previousPlan && (
              <button
                type="button"
                onClick={
                  copyPreviousPlan
                }
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <Copy
                  size={18}
                />

                Skopiuj z{" "}
                {formatMonth(
                  previousMonth
                )}
              </button>
            )}
          </div>
        </section>
      )}

      {/* =========================
          PLAN
      ========================= */}

      {currentPlan && (
        <>
          <section className="mt-8">
            <div>
              <h2 className="text-lg font-bold">
                Plan miesiąca
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ile chcesz
                przeznaczyć na
                poszczególne
                obszary.
              </p>
            </div>

            {/* PLAN SUMMARY */}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <PlanSummaryCard
                label="Zaplanowane"
                value={
                  totalPlanned
                }
              />

              <PlanSummaryCard
                label="Pozostało w planie"
                value={
                  planRemaining
                }
                danger={
                  planRemaining < 0
                }
              />

              <PlanSummaryCard
                label="Bufor dochodu"
                value={
                  plannedBuffer
                }
                danger={
                  plannedBuffer < 0
                }
              />
            </div>
          </section>

          {/* PLAN VS ACTUAL */}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold">
                Plan vs rzeczywistość
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Kontroluj, gdzie
                faktycznie uciekają
                pieniądze.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {currentPlan.limits.map(
                (
                  budgetLimit
                ) => {
                  const spent =
                    monthlyExpenses
                      .filter(
                        (
                          expense
                        ) =>
                          expense.category ===
                          budgetLimit.category
                      )
                      .reduce(
                        (
                          sum,
                          expense
                        ) =>
                          sum +
                          expense.amount,
                        0
                      );

                  return (
                    <CategoryBudgetCard
                      key={
                        budgetLimit.category
                      }
                      category={
                        budgetLimit.category
                      }
                      limit={
                        budgetLimit.limit
                      }
                      spent={
                        spent
                      }
                    />
                  );
                }
              )}
            </div>
          </section>
        </>
      )}

      {/* =========================
          EXPENSES
      ========================= */}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold">
            Wydatki miesiąca
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Wszystkie wydatki
            przypisane do{" "}
            <span className="capitalize">
              {monthLabel}
            </span>
            .
          </p>
        </div>

        {monthlyExpenses.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
            Brak wydatków w tym
            miesiącu.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            {monthlyExpenses
              .slice()
              .sort(
                (a, b) =>
                  (
                    b.date ??
                    ""
                  ).localeCompare(
                    a.date ??
                      ""
                  )
              )
              .map(
                (
                  expense,
                  index
                ) => (
                  <div
                    key={
                      expense.id
                    }
                    className={`flex items-center justify-between px-5 py-4 ${
                      index !==
                      monthlyExpenses.length -
                        1
                        ? "border-b border-slate-800"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {
                          expense.name
                        }
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        {expense.date ? (
                          <>
                            <span>
                              {
                                expense.date
                              }
                            </span>

                            <span>
                              •
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-amber-500">
                              stary wpis
                              — brak
                              daty
                            </span>

                            <span>
                              •
                            </span>
                          </>
                        )}

                        <span>
                          {
                            categoryLabels[
                              expense
                                .category
                            ]
                          }
                        </span>

                        {expense.recurring && (
                          <>
                            <span>
                              •
                            </span>

                            <span>
                              cykliczny
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="font-semibold text-red-400">
                      -
                      {expense.amount.toLocaleString(
                        "pl-PL"
                      )}{" "}
                      zł
                    </p>
                  </div>
                )
              )}
          </div>
        )}
      </section>

      {/* =========================
          MODAL
      ========================= */}

      {isPlanModalOpen && (
        <BudgetPlanModal
          month={
            selectedMonth
          }
          existingPlan={
            currentPlan
          }
          onClose={() =>
            setIsPlanModalOpen(
              false
            )
          }
          onSave={
            onSavePlan
          }
        />
      )}
    </main>
  );
}

/*
 * =========================
 * CATEGORY CARD
 * =========================
 */

type CategoryBudgetCardProps = {
  category: ExpenseCategory;
  limit: number;
  spent: number;
};

function CategoryBudgetCard({
  category,
  limit,
  spent,
}: CategoryBudgetCardProps) {
  const remaining =
    limit - spent;

  const percentage =
    limit > 0
      ? (spent / limit) * 100
      : spent > 0
        ? 100
        : 0;

  const barPercentage =
    Math.min(
      percentage,
      100
    );

  const isOverBudget =
    spent > limit;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {
              categoryLabels[
                category
              ]
            }
          </p>

          <p className="mt-2 text-xl font-bold">
            {spent.toLocaleString(
              "pl-PL"
            )}{" "}
            zł
          </p>

          <p className="mt-1 text-xs text-slate-500">
            z{" "}
            {limit.toLocaleString(
              "pl-PL"
            )}{" "}
            zł
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              isOverBudget
                ? "text-red-400"
                : "text-emerald-400"
            }`}
          >
            {percentage.toFixed(
              1
            )}
            %
          </p>

          <p className="mt-1 text-xs text-slate-500">
            wykorzystano
          </p>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${
            isOverBudget
              ? "bg-red-500"
              : "bg-emerald-500"
          }`}
          style={{
            width: `${barPercentage}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Pozostało
        </span>

        <span
          className={
            remaining >= 0
              ? "font-semibold text-slate-300"
              : "font-semibold text-red-400"
          }
        >
          {remaining.toLocaleString(
            "pl-PL"
          )}{" "}
          zł
        </span>
      </div>

      {isOverBudget && (
        <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Budżet przekroczony o{" "}
          {Math.abs(
            remaining
          ).toLocaleString(
            "pl-PL"
          )}{" "}
          zł
        </div>
      )}
    </div>
  );
}

/*
 * =========================
 * SUMMARY
 * =========================
 */

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
};

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {subtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================
 * PLAN SUMMARY
 * =========================
 */

type PlanSummaryCardProps = {
  label: string;
  value: number;
  danger?: boolean;
};

function PlanSummaryCard({
  label,
  value,
  danger = false,
}: PlanSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          danger
            ? "text-red-400"
            : "text-slate-100"
        }`}
      >
        {value.toLocaleString(
          "pl-PL"
        )}{" "}
        zł
      </p>
    </div>
  );
}

/*
 * =========================
 * HELPERS
 * =========================
 */

function isExpenseInMonth(
  expense: Expense,
  month: string
) {
  return isTransactionInMonth(
    expense.date,
    month
  );
}

function isTransactionInMonth(
  date: string | undefined,
  month: string
) {
  if (date) {
    return date.startsWith(
      month
    );
  }

  return (
    month ===
    getCurrentMonth()
  );
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function offsetMonth(
  month: string,
  offset: number
) {
  const [year, monthNumber] =
    month
      .split("-")
      .map(Number);

  const date = new Date(
    year,
    monthNumber - 1 + offset,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMonth(
  month: string
) {
  const [year, monthNumber] =
    month
      .split("-")
      .map(Number);

  return new Date(
    year,
    monthNumber - 1,
    1
  ).toLocaleDateString(
    "pl-PL",
    {
      month: "long",
      year: "numeric",
    }
  );
}