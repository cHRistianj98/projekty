import {
  useState,
} from "react";

import {
  AlertCircle,
  X,
} from "lucide-react";

import type {
  Income,
} from "../../types/Cashflow";

type EditIncomeModalProps = {
  income: Income;

  onClose: () => void;

  onSave: (
    income: Income
  ) => void;
};

export function EditIncomeModal({
  income,
  onClose,
  onSave,
}: EditIncomeModalProps) {
  const [name, setName] =
    useState(income.name);

  const [amount, setAmount] =
    useState(
      String(income.amount)
    );

  const [
    recurring,
    setRecurring,
  ] = useState(
    income.recurring
  );

  const [date, setDate] =
    useState(
      income.date ||
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

    if (!name.trim()) {
      setError(
        "Podaj nazwę przychodu."
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
        "Wybierz datę przychodu."
      );

      return;
    }

    onSave({
      ...income,

      name: name.trim(),

      amount:
        numericAmount,

      recurring,

      date,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Edytuj przychód
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Zmień dane
              przychodu.
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

        {/* FORM */}

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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          {/* AMOUNT */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Kwota netto
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 outline-none focus:border-emerald-500"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                zł
              </span>
            </div>
          </div>

          {/* DATE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Data
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <p className="mt-1 text-xs text-slate-600">
              Zmiana daty może
              przenieść przychód
              do innego miesiąca.
            </p>
          </div>

          {/* RECURRING */}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <input
              type="checkbox"
              checked={
                recurring
              }
              onChange={(event) =>
                setRecurring(
                  event.target.checked
                )
              }
            />

            <div>
              <div className="text-sm font-medium">
                Powtarzaj co
                miesiąc
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Oznacz jako
                przychód
                cykliczny
              </div>
            </div>
          </label>

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
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold hover:bg-emerald-500"
            >
              Zapisz zmiany
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