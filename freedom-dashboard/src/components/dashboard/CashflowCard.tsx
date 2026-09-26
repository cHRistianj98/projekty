import {
  ArrowDownRight,
  ArrowUpRight,
  Car,
  ChartNoAxesCombined,
  House,
  ShoppingBasket,
  WalletCards,
} from "lucide-react";

import type { MonthlyBudget } from "../../types/Cashflow";

import {
  calculateAvailableCash,
  sumByCategory,
  sumExpenses,
  sumIncomes,
} from "../../utils/cashflow";

type CashflowCardProps = {
  budget: MonthlyBudget;
};

export function CashflowCard({
  budget,
}: CashflowCardProps) {
  const { incomes, expenses } = budget;
  const income = sumIncomes(incomes);
  const fixed = sumByCategory(expenses, "fixed");
  const living = sumByCategory(expenses, "living");
  const investments = sumByCategory(
    expenses,
    "investment"
  );
  const goals = sumByCategory(expenses, "goal");

  const totalExpenses = sumExpenses(expenses);

  const available = calculateAvailableCash(
    income,
    expenses
  );

  const rows = [
    {
      name: "Koszty stałe",
      amount: fixed,
      icon: House,
      color: "text-red-400",
    },
    {
      name: "Życie",
      amount: living,
      icon: ShoppingBasket,
      color: "text-amber-400",
    },
    {
      name: "Inwestycje",
      amount: investments,
      icon: ChartNoAxesCombined,
      color: "text-blue-400",
    },
    {
      name: "Cele",
      amount: goals,
      icon: Car,
      color: "text-violet-400",
    },
  ];

  return (
    <div
      className="
        rounded-2xl
        border border-slate-800
        bg-slate-900/70
        p-5
      "
    >
      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h2
            className="
              text-sm
              font-bold
              uppercase
              tracking-wider
              text-slate-300
            "
          >
            Cashflow — wrzesień
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Gdzie poszła Twoja wypłata?
          </p>
        </div>

        <WalletCards className="text-emerald-400" />

      </div>

      {/* INCOME */}

      <div
        className="
          mt-6
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-emerald-500/20
          bg-emerald-500/5
          p-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              bg-emerald-500/10
              text-emerald-400
            "
          >
            <ArrowUpRight size={20} />
          </div>

          <span className="text-slate-300">
            Dochód netto
          </span>

        </div>

        <span
          className="
            text-xl
            font-bold
            text-emerald-400
          "
        >
          +{income.toLocaleString("pl-PL")} zł
        </span>

      </div>

      {/* EXPENSES */}

      <div className="mt-5 space-y-2">

        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              key={row.name}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                px-3 py-3
                transition
                hover:bg-slate-800/60
              "
            >

              <div className="flex items-center gap-3">

                <Icon
                  size={18}
                  className={row.color}
                />

                <span className="text-sm text-slate-400">
                  {row.name}
                </span>

              </div>

              <span className="font-semibold">
                -{row.amount.toLocaleString("pl-PL")} zł
              </span>

            </div>
          );
        })}

      </div>

      {/* SUMMARY */}

      <div
        className="
          mt-5
          border-t
          border-slate-800
          pt-5
        "
      >

        <div
          className="
            flex
            justify-between
            text-sm
            text-slate-500
          "
        >
          <span>Łączne rozdysponowanie</span>

          <span>
            {totalExpenses.toLocaleString("pl-PL")} zł
          </span>
        </div>

        <div
          className="
            mt-4
            flex
            items-center
            justify-between
          "
        >

          <div className="flex items-center gap-2">

            <ArrowDownRight
              size={20}
              className={
                available >= 0
                  ? "text-blue-400"
                  : "text-red-400"
              }
            />

            <span className="font-semibold">
              Wolne środki
            </span>

          </div>

          <span
            className={`
              text-2xl
              font-bold
              ${
                available >= 0
                  ? "text-blue-400"
                  : "text-red-400"
              }
            `}
          >
            {available.toLocaleString("pl-PL")} zł
          </span>

        </div>

      </div>

    </div>
  );
}