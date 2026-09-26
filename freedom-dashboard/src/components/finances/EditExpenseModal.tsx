import {
  useState,
} from "react";

import { X } from "lucide-react";

import type {
  Expense,
  ExpenseCategory,
} from "../../types/Cashflow";

type EditExpenseModalProps = {
  expense: Expense;
  onClose: () => void;
  onSave: (expense: Expense) => void;
};

export function EditExpenseModal({
  expense,
  onClose,
  onSave,
}: EditExpenseModalProps) {

  const [name, setName] =
    useState(expense.name);

  const [amount, setAmount] =
    useState(String(expense.amount));

  const [category, setCategory] =
    useState<ExpenseCategory>(
      expense.category
    );

  const [recurring, setRecurring] =
    useState(expense.recurring);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !name.trim() ||
      numericAmount <= 0
    ) {
      return;
    }

    onSave({
      ...expense,
      name: name.trim(),
      amount: numericAmount,
      category,
      recurring,
    });
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

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>

            <h2 className="text-xl font-bold">
              Edytuj wydatek
            </h2>

            <p className="
              mt-1
              text-sm
              text-slate-500
            ">
              Zmień dane pozycji.
            </p>

          </div>

          <button
            onClick={onClose}
            className="
              rounded-lg
              p-2
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

            <label className="
              mb-2 block
              text-sm font-medium
              text-slate-300
            ">
              Nazwa
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="
                w-full
                rounded-xl
                border border-slate-700
                bg-slate-950
                px-4 py-3
                outline-none
                focus:border-blue-500
              "
            />

          </div>

          <div>

            <label className="
              mb-2 block
              text-sm font-medium
              text-slate-300
            ">
              Kwota
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
                className="
                  w-full
                  rounded-xl
                  border border-slate-700
                  bg-slate-950
                  px-4 py-3
                  pr-12
                  outline-none
                  focus:border-blue-500
                "
              />

              <span className="
                absolute
                right-4 top-1/2
                -translate-y-1/2
                text-sm
                text-slate-500
              ">
                zł
              </span>

            </div>

          </div>

          <div>

            <label className="
              mb-2 block
              text-sm font-medium
              text-slate-300
            ">
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
              className="
                w-full
                rounded-xl
                border border-slate-700
                bg-slate-950
                px-4 py-3
                outline-none
                focus:border-blue-500
              "
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
                setRecurring(
                  event.target.checked
                )
              }
            />

            <span className="text-sm">
              Powtarzaj co miesiąc
            </span>

          </label>

          <div className="
            flex
            justify-end
            gap-3
            pt-2
          ">

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
                bg-blue-600
                px-5 py-3
                text-sm font-semibold
                hover:bg-blue-500
              "
            >
              Zapisz zmiany
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}