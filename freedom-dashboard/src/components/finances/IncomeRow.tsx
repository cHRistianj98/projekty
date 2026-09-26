import {
  Repeat2,
  Trash2,
} from "lucide-react";

import type { Income } from "../../types/Cashflow";

type IncomeRowProps = {
  income: Income;
  onDelete: () => void;
};

export function IncomeRow({
  income,
  onDelete,
}: IncomeRowProps) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        border-b
        border-slate-800/60
        px-5 py-4
        last:border-b-0
        transition
        hover:bg-slate-800/40
      "
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {income.name}
          </span>

          {income.recurring && (
            <Repeat2
              size={14}
              className="text-slate-500"
            />
          )}
        </div>

        <div className="mt-1 text-xs text-slate-600">
          {income.recurring
            ? "Powtarzalny"
            : "Jednorazowy"}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <span className="font-semibold text-emerald-400">
          +{income.amount.toLocaleString("pl-PL")} zł
        </span>

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
  );
}