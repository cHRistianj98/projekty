import { Banknote } from "lucide-react";

import { CashflowCard } from "./CashflowCard";
import { SpendingChart } from "./SpendingChart";
import type { MonthlyBudget } from "../../types/Cashflow";
import { Plus } from "lucide-react";

type CashflowSectionProps = {
  budget: MonthlyBudget;
  onAddExpenseClick: () => void;
};

export function CashflowSection({
  budget,
  onAddExpenseClick,
}: CashflowSectionProps) {
  return (
    <section className="mt-6">

      <div className="mb-4 flex items-center justify-between">

        <Banknote
          size={20}
          className="text-emerald-400"
        />

        <h2
          className="
            text-sm
            font-bold
            uppercase
            tracking-wider
            text-slate-300
          "
        >
          Miesięczny cashflow
        </h2>

      </div>

      <button
        onClick={onAddExpenseClick}
        className="
            flex items-center gap-2
            rounded-xl
            bg-blue-600
            px-4 py-2
            text-sm font-semibold
            transition
            hover:bg-blue-500
        "
        >
        <Plus size={17} />
        Dodaj wydatek
        </button>

      <div
        className="
          grid
          grid-cols-1
          gap-4
          2xl:grid-cols-2
        "
      >

        <CashflowCard budget={budget} />

        <SpendingChart budget={budget} />

      </div>

    </section>
  );
}