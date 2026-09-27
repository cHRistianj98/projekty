import { useState } from "react";

import {
  AlertCircle,
  X,
} from "lucide-react";

import type {
  ExpenseCategory,
} from "../../types/Cashflow";

import type {
  RecurringTransaction,
} from "../../types/RecurringTransaction";

type Props = {
  rule: RecurringTransaction;

  onClose: () => void;

  onSave: (
    rule: RecurringTransaction
  ) => void;
};

export function EditRecurringTransactionModal({
  rule,
  onClose,
  onSave,
}: Props) {
  const [name, setName] =
    useState(rule.name);

  const [amount, setAmount] =
    useState(
      String(rule.amount)
    );

  const [
    dayOfMonth,
    setDayOfMonth,
  ] = useState(
    String(
      rule.dayOfMonth
    )
  );

  const [
    startDate,
    setStartDate,
  ] = useState(
    rule.startDate
  );

  const [
    category,
    setCategory,
  ] =
    useState<ExpenseCategory>(
      rule.category ??
        "fixed"
    );

  const [error, setError] =
    useState("");

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    const numericAmount =
      Number(amount);

    const numericDay =
      Number(dayOfMonth);

    if (!name.trim()) {
      setError(
        "Podaj nazwę."
      );

      return;
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Kwota musi być większa od 0."
      );

      return;
    }

    if (
      !Number.isInteger(
        numericDay
      ) ||
      numericDay < 1 ||
      numericDay > 31
    ) {
      setError(
        "Dzień miesiąca musi być od 1 do 31."
      );

      return;
    }

    if (!startDate) {
      setError(
        "Podaj datę rozpoczęcia."
      );

      return;
    }

    onSave({
      ...rule,

      name:
        name.trim(),

      amount:
        numericAmount,

      dayOfMonth:
        numericDay,

      startDate,

      category:
        rule.type ===
        "expense"
          ? category
          : undefined,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Edytuj regułę
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Zmiana dotyczy
              przyszłych księgowań.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Typ
            </label>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
              {rule.type ===
              "income"
                ? "Przychód"
                : "Wydatek"}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nazwa
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Kwota
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          {rule.type ===
            "expense" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Kategoria
              </label>

              <select
                value={
                  category
                }
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value as ExpenseCategory
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
              >
                <option value="fixed">
                  Stałe
                </option>

                <option value="living">
                  Życie
                </option>

                <option value="investment">
                  Inwestycje
                </option>

                <option value="goal">
                  Cele
                </option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Dzień miesiąca
            </label>

            <input
              type="number"
              min="1"
              max="31"
              value={
                dayOfMonth
              }
              onChange={(event) =>
                setDayOfMonth(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Obowiązuje od
            </label>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs leading-5 text-blue-300">
            Zaksięgowane już
            transakcje pozostają
            bez zmian. Edytujesz
            regułę używaną przy
            kolejnych miesiącach.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500"
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}