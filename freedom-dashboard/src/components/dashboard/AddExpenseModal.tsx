import { useState } from "react";

import {
  AlertCircle,
  X,
} from "lucide-react";

import type {
  Expense,
  ExpenseCategory,
} from "../../types/Cashflow";

type AddExpenseModalProps = {
  onClose: () => void;

  onAdd: (
    expense: Expense
  ) => void;
};

const categories: {
  value: ExpenseCategory;
  label: string;
}[] = [
  {
    value: "fixed",
    label: "Stałe",
  },
  {
    value: "living",
    label: "Życie",
  },
  {
    value: "investment",
    label: "Inwestycje",
  },
  {
    value: "goal",
    label: "Cele",
  },
];

export function AddExpenseModal({
  onClose,
  onAdd,
}: AddExpenseModalProps) {
  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState<ExpenseCategory>(
      "living"
    );

  const [
    recurring,
    setRecurring,
  ] = useState(false);

  const [date, setDate] =
    useState(
      getTodayDate()
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

    if (!name.trim()) {
      setError(
        "Podaj nazwę wydatku."
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

    if (!date) {
      setError(
        "Wybierz datę wydatku."
      );

      return;
    }

    onAdd({
      id: Date.now(),

      name:
        name.trim(),

      amount:
        numericAmount,

      category,

      recurring,

      date,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">
              Dodaj wydatek
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Zapisz nową
              transakcję.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
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
              Nazwa
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="np. Zakupy spożywcze"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
              placeholder="150"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Data pierwszego
              wydatku
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-xs text-slate-600">
              Przy transakcji
              cyklicznej ta data
              określa również dzień
              comiesięcznej reguły.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Kategoria
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target
                    .value as ExpenseCategory
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              {categories.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {
                      item.label
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <input
              type="checkbox"
              checked={
                recurring
              }
              onChange={(event) =>
                setRecurring(
                  event.target
                    .checked
                )
              }
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                Powtarzaj co miesiąc
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Utworzy regułę
                cykliczną.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Dodaj wydatek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTodayDate() {
  return new Date()
    .toLocaleDateString(
      "sv-SE"
    );
}