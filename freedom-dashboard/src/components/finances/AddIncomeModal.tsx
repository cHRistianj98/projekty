import { useState } from "react";
import { X } from "lucide-react";

import type { Income } from "../../types/Cashflow";

type AddIncomeModalProps = {
  onClose: () => void;
  onAdd: (income: Income) => void;
};

export function AddIncomeModal({
  onClose,
  onAdd,
}: AddIncomeModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!name.trim() || numericAmount <= 0) {
      return;
    }

    onAdd({
      id: Date.now(),
      name: name.trim(),
      amount: numericAmount,
      recurring,
    });

    onClose();
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70
        backdrop-blur-sm
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl
          border border-slate-700
          bg-slate-900
          p-6
          shadow-2xl
        "
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Dodaj przychód
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Dodaj nowe źródło dochodu.
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              rounded-lg p-2
              text-slate-400
              hover:bg-slate-800
              hover:text-white
            "
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nazwa
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="np. Side business"
              autoFocus
              className="
                w-full rounded-xl
                border border-slate-700
                bg-slate-950
                px-4 py-3
                outline-none
                placeholder:text-slate-600
                focus:border-emerald-500
              "
            />
          </div>

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
                  setAmount(event.target.value)
                }
                placeholder="3000"
                className="
                  w-full rounded-xl
                  border border-slate-700
                  bg-slate-950
                  px-4 py-3 pr-12
                  outline-none
                  placeholder:text-slate-600
                  focus:border-emerald-500
                "
              />

              <span
                className="
                  absolute
                  right-4 top-1/2
                  -translate-y-1/2
                  text-sm text-slate-500
                "
              >
                zł
              </span>
            </div>
          </div>

          <label
            className="
              flex cursor-pointer
              items-center gap-3
              rounded-xl
              border border-slate-800
              bg-slate-950/50
              p-4
            "
          >
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) =>
                setRecurring(event.target.checked)
              }
            />

            <div>
              <div className="text-sm font-medium">
                Powtarzaj co miesiąc
              </div>

              <div className="text-xs text-slate-500">
                Stałe źródło dochodu
              </div>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                px-5 py-3
                text-sm font-semibold
                text-slate-400
                hover:bg-slate-800
                hover:text-white
              "
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="
                rounded-xl
                bg-emerald-600
                px-5 py-3
                text-sm font-semibold
                hover:bg-emerald-500
              "
            >
              Dodaj przychód
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}