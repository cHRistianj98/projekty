import {
  useState,
} from "react";

import {
  AlertCircle,
  X,
} from "lucide-react";

import type {
  ExpenseCategory,
} from "../../types/Cashflow";

import type {
  RecurringTransaction,
  RecurringTransactionType,
} from "../../types/RecurringTransaction";

type AddRecurringTransactionModalProps = {
  onClose: () => void;

  onAdd: (
    rule: RecurringTransaction
  ) => void;
};

export function AddRecurringTransactionModal({
  onClose,
  onAdd,
}: AddRecurringTransactionModalProps) {
  const [type, setType] =
    useState<RecurringTransactionType>(
      "expense"
    );

  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState<ExpenseCategory>(
      "fixed"
    );

  const [
    dayOfMonth,
    setDayOfMonth,
  ] = useState(
    String(
      new Date().getDate()
    )
  );

  const [
    startDate,
    setStartDate,
  ] = useState(
    getTodayDate()
  );

  const [error, setError] =
    useState("");

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const numericAmount =
      Number(amount);

    const numericDay =
      Number(dayOfMonth);

    if (!name.trim()) {
      setError(
        "Podaj nazwę reguły."
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

    onAdd({
      id: Date.now(),

      type,

      name:
        name.trim(),

      amount:
        numericAmount,

      category:
        type === "expense"
          ? category
          : undefined,

      dayOfMonth:
        numericDay,

      startDate,

      active: true,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Nowa reguła cykliczna
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Zdefiniuj miesięczną
              transakcję.
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
          onSubmit={
            handleSubmit
          }
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

          {/* TYPE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Typ
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setType(
                    "expense"
                  )
                }
                className={
                  type ===
                  "expense"
                    ? "rounded-xl border border-blue-500 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-400"
                    : "rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400"
                }
              >
                Wydatek
              </button>

              <button
                type="button"
                onClick={() =>
                  setType(
                    "income"
                  )
                }
                className={
                  type ===
                  "income"
                    ? "rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400"
                    : "rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400"
                }
              >
                Przychód
              </button>
            </div>
          </div>

          {/* NAME */}

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
              placeholder="np. Czynsz"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* AMOUNT */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Kwota
            </label>

            <div className="relative">
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 outline-none focus:border-blue-500"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                zł
              </span>
            </div>
          </div>

          {/* CATEGORY */}

          {type ===
            "expense" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Kategoria
              </label>

              <select
                value={
                  category
                }
                onChange={(
                  event
                ) =>
                  setCategory(
                    event
                      .target
                      .value as ExpenseCategory
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="fixed">
                  Koszt stały
                </option>

                <option value="living">
                  Życie
                </option>

                <option value="investment">
                  Inwestycja
                </option>

                <option value="goal">
                  Cel
                </option>
              </select>
            </div>
          )}

          {/* DAY */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Dzień miesiąca
            </label>

            <input
              type="number"
              min="1"
              max="31"
              step="1"
              value={
                dayOfMonth
              }
              onChange={(
                event
              ) =>
                setDayOfMonth(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-xs text-slate-600">
              Dla krótszego
              miesiąca użyjemy
              ostatniego dnia.
            </p>
          </div>

          {/* START */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Obowiązuje od
            </label>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(
                event
              ) =>
                setStartDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* ACTIONS */}

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
              Dodaj regułę
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTodayDate() {
  return new Date().toLocaleDateString(
    "sv-SE"
  );
}