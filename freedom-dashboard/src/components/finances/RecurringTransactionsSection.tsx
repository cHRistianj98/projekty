import {
  CalendarDays,
  Check,
  CirclePause,
  CirclePlay,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
} from "lucide-react";

import { CategoryIcon } from "../categories/CategoryIcon";

import type {
  Expense,
  Income,
} from "../../types/Cashflow";

import type {
  RecurringTransaction,
} from "../../types/RecurringTransaction";

type RecurringTransactionsSectionProps = {
  rules: RecurringTransaction[];
  selectedMonth: string;
  incomes: Income[];
  expenses: Expense[];
  onAddRule: () => void;
  onEditRule: (rule: RecurringTransaction) => void;
  onBookRule: (rule: RecurringTransaction) => void;
  onToggleRule: (id: number) => void;
  onDeleteRule: (id: number) => void;
};

export function RecurringTransactionsSection({
  rules,
  selectedMonth,
  incomes,
  expenses,
  onAddRule,
  onEditRule,
  onBookRule,
  onToggleRule,
  onDeleteRule,
}: RecurringTransactionsSectionProps) {
  const activeCount =
    rules.filter((rule) => rule.active).length;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-violet-500/25 bg-slate-900/70 shadow-[0_12px_35px_rgba(0,0,0,0.14)] transition hover:border-violet-500/40">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
            <Repeat2 size={24} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Transakcje cykliczne
            </h2>

            <span className="text-xs text-slate-500">
              {activeCount} aktywnych reguł
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddRule}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20"
        >
          <Plus size={16} />
          Dodaj regułę
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          Brak transakcji cyklicznych.
        </div>
      ) : (
        <div>
          {rules.map((rule) => {
            const booked =
              isRuleBooked(
                rule,
                selectedMonth,
                incomes,
                expenses
              );

            const visual =
              getRecurringVisual(
                rule,
                incomes,
                expenses
              );

            return (
              <div
                key={rule.id}
                className={`group flex flex-wrap items-center gap-4 border-b border-slate-800/80 px-5 py-4 last:border-b-0 transition hover:bg-white/[0.025] ${
                  rule.active ? "" : "opacity-55"
                }`}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10 shadow-lg"
                  style={{
                    backgroundColor: `${visual.color}22`,
                    color: visual.color,
                    boxShadow: `0 8px 24px ${visual.color}18`,
                  }}
                  title={visual.categoryName}
                >
                  <CategoryIcon
                    iconKey={visual.iconKey}
                    className="h-5 w-5"
                  />
                </div>

                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-bold text-slate-100">
                      {rule.name}
                    </span>

                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        borderColor: `${visual.color}35`,
                        backgroundColor: `${visual.color}12`,
                        color: visual.color,
                      }}
                    >
                      {visual.categoryName}
                    </span>

                    {!rule.active && (
                      <span className="rounded-full border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Wstrzymana
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Repeat2 size={12} />
                      {rule.type === "income"
                        ? "Przychód"
                        : "Wydatek"}
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {rule.dayOfMonth}. dzień miesiąca
                    </span>
                  </div>
                </div>

                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                  <div
                    className={`mr-2 min-w-[110px] text-right text-base font-black ${
                      rule.type === "income"
                        ? "text-emerald-300"
                        : "text-slate-100"
                    }`}
                  >
                    {rule.type === "income" ? "+" : "-"}
                    {rule.amount.toLocaleString("pl-PL")} zł
                  </div>

                  {booked ? (
                    <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
                      <Check size={14} />
                      Zaksięgowano
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!rule.active}
                      onClick={() => onBookRule(rule)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Check size={14} />
                      Zaksięguj
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditRule(rule)}
                    title="Edytuj regułę"
                    className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRule(rule.id)}
                    title={rule.active ? "Wstrzymaj" : "Wznów"}
                    className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-violet-500/10 hover:text-violet-300"
                  >
                    {rule.active ? (
                      <CirclePause size={17} />
                    ) : (
                      <CirclePlay size={17} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRule(rule.id)}
                    title="Usuń regułę"
                    className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function isRuleBooked(
  rule: RecurringTransaction,
  selectedMonth: string,
  incomes: Income[],
  expenses: Expense[]
) {
  const transactions =
    rule.type === "income"
      ? incomes
      : expenses;

  return transactions.some(
    (transaction) =>
      transaction.recurringRuleId === rule.id &&
      transaction.date.startsWith(selectedMonth)
  );
}

function getRecurringVisual(
  rule: RecurringTransaction,
  incomes: Income[],
  expenses: Expense[]
) {
  const linked =
    rule.type === "income"
      ? incomes.find(
          (transaction) =>
            transaction.recurringRuleId === rule.id
        )
      : expenses.find(
          (transaction) =>
            transaction.recurringRuleId === rule.id
        );

  if (linked?.categoryIconKey) {
    return {
      iconKey: linked.categoryIconKey,
      color:
        linked.categoryColor ??
        (rule.type === "income"
          ? "#10b981"
          : "#60a5fa"),
      categoryName:
        linked.categoryName ??
        (rule.type === "income"
          ? "Przychód"
          : "Wydatek"),
    };
  }

  if (rule.categoryIconKey) {
    return {
      iconKey: rule.categoryIconKey,
      color:
        rule.categoryColor ??
        (rule.type === "income"
          ? "#10b981"
          : "#60a5fa"),
      categoryName:
        rule.categoryName ??
        (rule.type === "income"
          ? "Przychód"
          : "Wydatek"),
    };
  }

  if (rule.type === "income") {
    return {
      iconKey: "Wallet",
      color: "#10b981",
      categoryName: "Przychód",
    };
  }

  switch (rule.category) {
    case "fixed":
      return {
        iconKey: "House",
        color: "#fb7185",
        categoryName: "Koszty stałe",
      };

    case "investment":
      return {
        iconKey: "TrendingUp",
        color: "#60a5fa",
        categoryName: "Inwestycje",
      };

    case "goal":
      return {
        iconKey: "Target",
        color: "#a78bfa",
        categoryName: "Cele",
      };

    default:
      return {
        iconKey: "ShoppingBasket",
        color: "#fbbf24",
        categoryName: "Życie",
      };
  }
}
