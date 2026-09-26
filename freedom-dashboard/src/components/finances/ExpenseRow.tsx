import {
  Pencil,
  Repeat2,
  Trash2,
} from "lucide-react";

import type { Expense } from "../../types/Cashflow";

type ExpenseRowProps = {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
};

export function ExpenseRow({
  expense,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  return (
    <div
      className="
        group
        flex
        items-center
        justify-between
        border-b
        border-slate-800/60
        px-5 py-4
        transition
        last:border-b-0
        hover:bg-slate-800/40
      "
    >

      <div>

        <div className="flex items-center gap-2">

          <span className="font-medium">
            {expense.name}
          </span>

          {expense.recurring && (
            <Repeat2
              size={14}
              className="text-slate-500"
            />
          )}

        </div>

        <div className="mt-1 text-xs text-slate-600">
          {expense.recurring
            ? "Powtarzalny"
            : "Jednorazowy"}
        </div>

      </div>

      <div className="flex items-center gap-5">

        <span className="font-semibold">
          {expense.amount.toLocaleString(
            "pl-PL"
          )}{" "}
          zł
        </span>

        <div className="flex items-center gap-1">

          <button
            onClick={onEdit}
            title="Edytuj"
            className="
              rounded-lg
              p-2
              text-slate-500
              transition
              hover:bg-blue-500/10
              hover:text-blue-400
            "
          >
            <Pencil size={17} />
          </button>

          <button
            onClick={onDelete}
            title="Usuń"
            className="
              rounded-lg
              p-2
              text-slate-500
              transition
              hover:bg-red-500/10
              hover:text-red-400
            "
          >
            <Trash2 size={17} />
          </button>

        </div>

      </div>

    </div>
  );
}