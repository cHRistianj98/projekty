import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Pencil,
  PiggyBank,
  Plus,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

import { CategoryMiniImage } from "../components/categories/CategoryMiniImage";
import { categoryApi } from "../api/categoryApi";

import type {
  Category,
  CategoryGroup,
} from "../types/Category";

import type {
  Expense,
  ExpenseCategory,
  MonthlyBudget,
} from "../types/Cashflow";

import type {
  BudgetLimit,
  MonthlyBudgetPlan,
} from "../types/Budget";

type BudgetProps = {
  budget: MonthlyBudget;
  budgetPlans: MonthlyBudgetPlan[];
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  onSavePlan: (
    plan: MonthlyBudgetPlan
  ) => void | Promise<void>;
};

export function Budget({
  budget,
  budgetPlans,
  selectedMonth,
  onChangeMonth,
  onSavePlan,
}: BudgetProps) {
  const [isPlanOpen, setIsPlanOpen] =
    useState(false);

  const [expenseCategories, setExpenseCategories] =
    useState<Category[]>([]);

  useEffect(() => {
    categoryApi
      .getAll("EXPENSE")
      .then((categories) =>
        setExpenseCategories(
          categories.filter(
            (category) => category.active
          )
        )
      )
      .catch((error) =>
        console.error(
          "Nie udało się pobrać kategorii budżetu:",
          error
        )
      );
  }, []);

  const monthExpenses = useMemo(
    () =>
      budget.expenses.filter((expense) =>
        expense.date.startsWith(selectedMonth)
      ),
    [budget.expenses, selectedMonth]
  );

  const monthIncomes = useMemo(
    () =>
      budget.incomes.filter((income) =>
        income.date.startsWith(selectedMonth)
      ),
    [budget.incomes, selectedMonth]
  );

  const income = sum(
    monthIncomes.map((item) => item.amount)
  );

  const expenses = sum(
    monthExpenses.map((item) => item.amount)
  );

  const surplus = income - expenses;

  const savingsRate =
    income > 0
      ? (surplus / income) * 100
      : 0;

  const plan = budgetPlans.find(
    (item) => item.month === selectedMonth
  );

  const plannedTotal = plan
    ? sum(plan.limits.map((item) => item.limit))
    : 0;

  const plannedRemaining =
    plannedTotal - expenses;

  const planRows = useMemo(
    () =>
      buildPlanRows(
        plan,
        expenseCategories,
        monthExpenses
      ),
    [plan, expenseCategories, monthExpenses]
  );

  return (
    <main className="min-h-screen bg-[#050c18] px-6 py-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25 shadow-[0_10px_35px_rgba(16,185,129,.15)]">
            <PiggyBank size={26} />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Budżet
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Plan kontra rzeczywiste wydatki
            </p>
          </div>
        </div>

        <MonthPicker
          month={selectedMonth}
          onChange={onChangeMonth}
        />
      </header>

      <section className="mt-8 grid gap-4 xl:grid-cols-4">
        <StatCard
          tone="emerald"
          label="Dochody"
          value={money(income)}
          subtitle={`${monthIncomes.length} transakcji`}
          icon={<ArrowUpRight size={22} />}
          art="income"
        />

        <StatCard
          tone="rose"
          label="Wydatki"
          value={money(expenses)}
          subtitle={`${monthExpenses.length} transakcji`}
          icon={<ArrowDownRight size={22} />}
          art="expense"
        />

        <StatCard
          tone="blue"
          label="Nadwyżka"
          value={money(surplus)}
          subtitle={
            surplus >= 0
              ? "Kapitał gotowy do alokacji"
              : "Miesiąc poniżej zera"
          }
          icon={<WalletCards size={22} />}
          art="wallet"
        />

        <StatCard
          tone="amber"
          label="Stopa oszczędności"
          value={`${savingsRate.toFixed(1)}%`}
          subtitle="Dochód minus wydatki"
          icon={<PiggyBank size={22} />}
          art="saving"
        />
      </section>

      {!plan ? (
        <section className="relative mt-7 overflow-hidden rounded-3xl border border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] via-slate-900/55 to-slate-950 px-6 py-12 text-center">
          <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
            <PiggyBank size={32} />
          </div>

          <h2 className="relative mt-5 text-xl font-black">
            Brak planu budżetu
          </h2>

          <p className="relative mt-2 text-sm text-slate-500">
            Rozdziel pieniądze pomiędzy prawdziwe
            kategorie Categories 2.0.
          </p>

          <button
            type="button"
            onClick={() => setIsPlanOpen(true)}
            className="relative mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            <Plus size={17} />
            Utwórz plan
          </button>
        </section>
      ) : (
        <section className="mt-7 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/55 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                  <CircleDollarSign size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black">
                    Plan kategorii
                  </h2>
                  <p className="text-sm text-slate-500">
                    {money(expenses)} wydano z{" "}
                    {money(plannedTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">
                  Zostało
                </div>
                <div
                  className={`mt-1 text-xl font-black ${
                    plannedRemaining >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {money(plannedRemaining)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPlanOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 ring-1 ring-blue-500/20 transition hover:bg-blue-500/20"
              >
                <Pencil size={16} />
                Edytuj plan
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {planRows.map((row) => (
              <BudgetCategoryCard
                {...row}
                key={row.key}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <div className="mb-4">
          <h2 className="text-xl font-black">
            Wydatki miesiąca
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Wszystkie wydatki przypisane do{" "}
            {monthLabel(selectedMonth)}.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/55">
          {monthExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Brak wydatków w tym miesiącu.
            </div>
          ) : (
            monthExpenses
              .slice()
              .sort((a, b) =>
                b.date.localeCompare(a.date)
              )
              .map((expense) => (
                <ExpenseVisualRow
                  key={expense.id}
                  expense={expense}
                />
              ))
          )}
        </div>
      </section>

      {isPlanOpen && (
        <BudgetPlanModal
          month={selectedMonth}
          categories={expenseCategories}
          currentPlan={plan}
          onClose={() => setIsPlanOpen(false)}
          onSave={async (nextPlan) => {
            await onSavePlan(nextPlan);
            setIsPlanOpen(false);
          }}
        />
      )}
    </main>
  );
}

function BudgetPlanModal({
  month,
  categories,
  currentPlan,
  onClose,
  onSave,
}: {
  month: string;
  categories: Category[];
  currentPlan?: MonthlyBudgetPlan;
  onClose: () => void;
  onSave: (
    plan: MonthlyBudgetPlan
  ) => void | Promise<void>;
}) {
  const [values, setValues] = useState<
    Record<number, string>
  >(() => {
    const result: Record<number, string> = {};

    for (const category of categories) {
      const existing =
        findLimitForCategory(
          currentPlan,
          category
        );

      result[category.id] =
        existing && existing.limit > 0
          ? String(existing.limit)
          : "";
    }

    return result;
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues((current) => {
      const next = { ...current };

      for (const category of categories) {
        if (next[category.id] === undefined) {
          const existing =
            findLimitForCategory(
              currentPlan,
              category
            );

          next[category.id] =
            existing && existing.limit > 0
              ? String(existing.limit)
              : "";
        }
      }

      return next;
    });
  }, [categories, currentPlan]);

  const total = categories.reduce(
    (sumValue, category) =>
      sumValue +
      numeric(values[category.id]),
    0
  );

  const grouped = groupCategories(categories);

  async function submit() {
    const limits: BudgetLimit[] =
      categories
        .map((category) => ({
          categoryId: category.id,
          categoryName: category.name,
          categoryIconKey: category.iconKey,
          categoryColor: category.color,
          categoryGroup: category.group,
          category:
            legacyCategory(category.group),
          limit: numeric(values[category.id]),
        }))
        .filter((limit) => limit.limit > 0);

    setSaving(true);

    try {
      await onSave({
        month,
        limits,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#0b1425] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20">
              <PiggyBank size={25} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                {currentPlan
                  ? "Edytuj plan"
                  : "Utwórz plan"}
              </h2>
              <p className="text-sm text-slate-500">
                {monthLabel(month)} • Categories 2.0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
              Brak kategorii wydatków. Categories
              2.0 nie zwróciło żadnych aktywnych
              kategorii.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(
                ([group, groupCategories]) => (
                  <div key={group}>
                    <div className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-500">
                      {groupLabel(group)}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {groupCategories.map(
                        (category) => (
                          <label
                            key={category.id}
                            className="group flex cursor-text items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-3 transition focus-within:border-emerald-500/35 hover:border-slate-700"
                          >
                            <CategoryMiniImage
                              name={category.name}
                              iconKey={category.iconKey}
                              color={category.color}
                              size="md"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold text-slate-100">
                                {category.name}
                              </div>
                              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                                {groupLabel(
                                  category.group
                                )}
                              </div>
                            </div>

                            <div className="relative w-28">
                              <input
                                inputMode="decimal"
                                value={
                                  values[
                                    category.id
                                  ] ?? ""
                                }
                                onChange={(event) =>
                                  setValues(
                                    (current) => ({
                                      ...current,
                                      [category.id]:
                                        event.target
                                          .value,
                                    })
                                  )
                                }
                                placeholder="0"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 pr-7 text-right text-sm font-black outline-none transition focus:border-emerald-500/50"
                              />
                              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                                zł
                              </span>
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/35 px-6 py-5">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3">
            <div>
              <div className="font-black">
                Łącznie zaplanowane
              </div>
              <div className="text-xs text-slate-500">
                Suma limitów kategorii
              </div>
            </div>

            <div className="text-xl font-black text-emerald-300">
              {money(total)}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5"
            >
              Anuluj
            </button>

            <button
              type="button"
              disabled={
                saving ||
                categories.length === 0
              }
              onClick={submit}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={16} />
              {saving
                ? "Zapisywanie..."
                : currentPlan
                ? "Zapisz plan"
                : "Utwórz plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type PlanRow = {
  key: string;
  name: string;
  iconKey: string;
  color: string;
  group: string;
  limit: number;
  spent: number;
};

function BudgetCategoryCard(
  row: PlanRow
) {
  const remaining =
    row.limit - row.spent;

  const percent =
    row.limit > 0
      ? (row.spent / row.limit) * 100
      : 0;

  const over = remaining < 0;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5"
      style={{
        borderColor: `${row.color}30`,
        background:
          `linear-gradient(120deg, ${row.color}12, rgba(15,23,42,.72) 48%)`,
      }}
    >
      <div className="flex items-start gap-3">
        <CategoryMiniImage
          name={row.name}
          iconKey={row.iconKey}
          color={row.color}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="truncate text-base font-black">
                {row.name}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {row.group}
              </div>
            </div>

            <div className="text-right">
              <div className="font-black">
                {money(row.spent)}
              </div>
              <div className="text-xs text-slate-500">
                z {money(row.limit)}
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, percent)
                )}%`,
                backgroundColor:
                  over ? "#fb7185" : row.color,
                boxShadow:
                  `0 0 12px ${
                    over
                      ? "#fb7185"
                      : row.color
                  }`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {percent.toFixed(0)}% wykorzystane
            </span>

            <span
              className={
                over
                  ? "font-bold text-rose-300"
                  : "font-bold text-emerald-300"
              }
            >
              {over
                ? `${money(
                    Math.abs(remaining)
                  )} ponad plan`
                : `${money(
                    remaining
                  )} zostało`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseVisualRow({
  expense,
}: {
  expense: Expense;
}) {
  const visual =
    expenseVisual(expense);

  return (
    <div className="group flex items-center gap-4 border-b border-slate-800/80 px-5 py-4 last:border-b-0 transition hover:bg-white/[0.025]">
      <CategoryMiniImage
        name={visual.name}
        iconKey={visual.iconKey}
        color={visual.color}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-black">
            {expense.name}
          </span>

          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
            style={{
              color: visual.color,
              borderColor:
                `${visual.color}30`,
              backgroundColor:
                `${visual.color}10`,
            }}
          >
            {visual.name}
          </span>
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {expense.date}
          {expense.recurring
            ? " • cykliczny"
            : " • jednorazowy"}
        </div>
      </div>

      <div className="text-base font-black text-rose-300">
        -{money(expense.amount)}
      </div>
    </div>
  );
}

function StatCard({
  tone,
  label,
  value,
  subtitle,
  icon,
  art,
}: {
  tone:
    | "emerald"
    | "rose"
    | "blue"
    | "amber";
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  art: string;
}) {
  const theme = {
    emerald: {
      border: "border-emerald-500/30",
      bg: "from-emerald-500/14 via-emerald-950/20 to-slate-950",
      icon: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
      value: "text-emerald-300",
    },
    rose: {
      border: "border-rose-500/30",
      bg: "from-rose-500/14 via-rose-950/20 to-slate-950",
      icon: "bg-rose-500/15 text-rose-300 ring-rose-500/20",
      value: "text-rose-300",
    },
    blue: {
      border: "border-blue-500/30",
      bg: "from-blue-500/14 via-blue-950/20 to-slate-950",
      icon: "bg-blue-500/15 text-blue-300 ring-blue-500/20",
      value: "text-blue-300",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "from-amber-500/14 via-amber-950/20 to-slate-950",
      icon: "bg-amber-500/15 text-amber-300 ring-amber-500/20",
      value: "text-amber-200",
    },
  }[tone];

  return (
    <div
      className={`group relative min-h-[145px] overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition hover:-translate-y-0.5 ${theme.border} ${theme.bg}`}
    >
      <div className="relative z-10">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${theme.icon}`}
        >
          {icon}
        </div>

        <div className="mt-4 text-xs font-black uppercase tracking-[.14em] text-slate-500">
          {label}
        </div>

        <div
          className={`mt-1 text-2xl font-black ${theme.value}`}
        >
          {value}
        </div>

        <div className="mt-1 text-xs text-slate-600">
          {subtitle}
        </div>
      </div>

      <div className="pointer-events-none absolute -right-4 -top-4 text-[110px] font-black text-white/[0.025] transition group-hover:scale-110">
        {art === "income"
          ? "↗"
          : art === "expense"
          ? "↘"
          : art === "wallet"
          ? "▣"
          : "%"}
      </div>
    </div>
  );
}

function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex min-w-[250px] items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-1">
      <button
        type="button"
        onClick={() =>
          onChange(shiftMonth(month, -1))
        }
        className="cursor-pointer rounded-lg p-2.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="text-sm font-black">
        {monthLabel(month)}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange(shiftMonth(month, 1))
        }
        className="cursor-pointer rounded-lg p-2.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function buildPlanRows(
  plan: MonthlyBudgetPlan | undefined,
  categories: Category[],
  expenses: Expense[]
): PlanRow[] {
  if (!plan) return [];

  return plan.limits.map((limit, index) => {
    const category =
      limit.categoryId != null
        ? categories.find(
            (item) =>
              item.id === limit.categoryId
          )
        : undefined;

    const name =
      category?.name ??
      limit.categoryName ??
      legacyLabel(limit.category);

    const iconKey =
      category?.iconKey ??
      limit.categoryIconKey ??
      legacyIcon(limit.category);

    const color =
      category?.color ??
      limit.categoryColor ??
      legacyColor(limit.category);

    const group =
      category?.group ??
      limit.categoryGroup ??
      ({ fixed: "FIXED", living: "LIVING", investment: "WEALTH", goal: "GOALS" }[limit.category ?? "living"]);

    const spent =
      limit.categoryId != null
        ? sum(
            expenses
              .filter(
                (expense) =>
                  expense.categoryId ===
                  limit.categoryId
              )
              .map(
                (expense) => expense.amount
              )
          )
        : sum(
            expenses
              .filter(
                (expense) =>
                  expense.category ===
                  limit.category
              )
              .map(
                (expense) => expense.amount
              )
          );

    return {
      key:
        limit.categoryId != null
          ? `category-${limit.categoryId}`
          : `legacy-${limit.category}-${index}`,
      name,
      iconKey,
      color,
      group:
        typeof group === "string"
          ? groupLabel(
              group as CategoryGroup
            )
          : String(group),
      limit: limit.limit,
      spent,
    };
  });
}

function findLimitForCategory(
  plan: MonthlyBudgetPlan | undefined,
  category: Category
) {
  if (!plan) return undefined;

  return (
    plan.limits.find(
      (limit) =>
        limit.categoryId === category.id
    ) ??
    plan.limits.find(
      (limit) =>
        limit.categoryId == null &&
        limit.category ===
          legacyCategory(category.group)
    )
  );
}

function groupCategories(
  categories: Category[]
): [CategoryGroup, Category[]][] {
  const groups = new Map<
    CategoryGroup,
    Category[]
  >();

  for (const category of categories) {
    const current =
      groups.get(category.group) ?? [];

    current.push(category);
    groups.set(category.group, current);
  }

  return Array.from(groups.entries());
}

function legacyCategory(
  group: CategoryGroup
): ExpenseCategory {
  if (group === "FIXED") return "fixed";
  if (group === "WEALTH") return "investment";
  if (group === "GOALS") return "goal";
  return "living";
}

function groupLabel(
  group: CategoryGroup | string
) {
  const labels: Record<string, string> = {
    FIXED: "Koszty stałe",
    LIVING: "Życie",
    HEALTH: "Zdrowie",
    GROWTH: "Rozwój",
    LIFESTYLE: "Lifestyle",
    WEALTH: "Majątek / inwestycje",
    GOALS: "Cele",
    INCOME: "Dochody",
    OTHER: "Inne",
  };

  return labels[group] ?? group;
}

function expenseVisual(
  expense: Expense
) {
  if (expense.categoryIconKey) {
    return {
      name:
        expense.categoryName ??
        legacyLabel(expense.category),
      iconKey:
        expense.categoryIconKey,
      color:
        expense.categoryColor ??
        legacyColor(expense.category),
    };
  }

  return {
    name: legacyLabel(expense.category),
    iconKey:
      legacyIcon(expense.category),
    color:
      legacyColor(expense.category),
  };
}

function legacyLabel(
  category?: ExpenseCategory
) {
  switch (category) {
    case "fixed":
      return "Koszty stałe";
    case "investment":
      return "Inwestycje";
    case "goal":
      return "Cele";
    default:
      return "Życie";
  }
}

function legacyIcon(
  category?: ExpenseCategory
) {
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

function legacyColor(
  category?: ExpenseCategory
) {
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

function numeric(value?: string) {
  const parsed = Number(
    String(value ?? "")
      .replace(",", ".")
      .replace(/\s/g, "")
  );

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
}

function sum(values: number[]) {
  return values.reduce(
    (total, value) => total + value,
    0
  );
}

function money(value: number) {
  return `${Math.round(value).toLocaleString(
    "pl-PL"
  )} zł`;
}

function shiftMonth(
  month: string,
  delta: number
) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  const date = new Date(
    year,
    monthNumber - 1 + delta,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  return new Intl.DateTimeFormat(
    "pl-PL",
    {
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(year, monthNumber - 1, 1)
  );
}
