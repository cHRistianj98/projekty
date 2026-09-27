import {
  CalendarClock,
  Check,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

import type {
  Expense,
  Income,
} from "../../types/Cashflow";

import type {
  RecurringTransaction,
} from "../../types/RecurringTransaction";

import {
  isRuleAvailableInMonth,
  isRuleBookedInMonth,
} from "../../utils/recurringTransactions";

type Props = {
  rules:
    RecurringTransaction[];

  selectedMonth: string;

  incomes: Income[];

  expenses: Expense[];

  onAddRule: () => void;

  onEditRule: (
    rule: RecurringTransaction
  ) => void;

  onBookRule: (
    rule: RecurringTransaction
  ) => void;

  onToggleRule: (
    id: number
  ) => void;

  onDeleteRule: (
    id: number
  ) => void;
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
}: Props) {
  const activeRules =
    rules.filter(
      (rule) =>
        rule.active
    );

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <CalendarClock
            size={20}
            className="text-violet-400"
          />

          <div>
            <h2 className="font-semibold">
              Transakcje
              cykliczne
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {
                activeRules.length
              }{" "}
              aktywnych reguł
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddRule}
          className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-400 transition hover:bg-violet-500/20"
        >
          <Plus size={16} />

          Dodaj regułę
        </button>
      </div>

      {rules.length === 0 && (
        <div className="px-5 py-10 text-center">
          <CalendarClock
            size={30}
            className="mx-auto text-slate-700"
          />

          <p className="mt-3 text-sm font-medium text-slate-400">
            Brak transakcji
            cyklicznych
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Dodaj np.
            wynagrodzenie,
            czynsz albo
            abonament.
          </p>
        </div>
      )}

      {rules.map((rule) => {
        const available =
          isRuleAvailableInMonth(
            rule,
            selectedMonth
          );

        const booked =
          isRuleBookedInMonth(
            rule,
            selectedMonth,
            incomes,
            expenses
          );

        return (
          <div
            key={rule.id}
            className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4 last:border-b-0 hover:bg-slate-800/30"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {rule.name}
                </span>

                {!rule.active && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                    Wstrzymana
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {rule.type ===
                  "income"
                    ? "Przychód"
                    : "Wydatek"}
                </span>

                <span>•</span>

                <span>
                  {
                    rule.dayOfMonth
                  }
                  . dzień
                  miesiąca
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <span
                className={
                  rule.type ===
                  "income"
                    ? "font-semibold text-emerald-400"
                    : "font-semibold text-slate-200"
                }
              >
                {rule.type ===
                "income"
                  ? "+"
                  : "-"}

                {rule.amount.toLocaleString(
                  "pl-PL"
                )}{" "}
                zł
              </span>

              <div className="flex items-center gap-2">
                {booked ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400">
                    <Check
                      size={15}
                    />

                    Zaksięgowano
                  </div>
                ) : available ? (
                  <button
                    type="button"
                    onClick={() =>
                      onBookRule(
                        rule
                      )
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold transition hover:bg-blue-500"
                  >
                    Zaksięguj
                  </button>
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-600">
                    Niedostępna
                  </div>
                )}

                <button
                  type="button"
                  title="Edytuj"
                  onClick={() =>
                    onEditRule(
                      rule
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-violet-500/10 hover:text-violet-400"
                >
                  <Pencil
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  title={
                    rule.active
                      ? "Wstrzymaj"
                      : "Aktywuj"
                  }
                  onClick={() =>
                    onToggleRule(
                      rule.id
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                >
                  {rule.active ? (
                    <Pause
                      size={16}
                    />
                  ) : (
                    <Play
                      size={16}
                    />
                  )}
                </button>

                <button
                  type="button"
                  title="Usuń"
                  onClick={() =>
                    onDeleteRule(
                      rule.id
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2
                    size={16}
                  />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}