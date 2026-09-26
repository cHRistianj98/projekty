import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { MonthlyBudget } from "../../types/Cashflow";

import {
  calculateAvailableCash,
  sumByCategory,
  sumIncomes,
} from "../../utils/cashflow";

type SpendingChartProps = {
  budget: MonthlyBudget;
};

export function SpendingChart({
  budget,
}: SpendingChartProps) {
  const { incomes, expenses } = budget;
  const income = sumIncomes(incomes);

  const available = Math.max(
    calculateAvailableCash(income, expenses),
    0
  );

  const data = [
    {
      name: "Koszty stałe",
      value: sumByCategory(expenses, "fixed"),
      color: "#ef4444",
    },
    {
      name: "Życie",
      value: sumByCategory(expenses, "living"),
      color: "#f59e0b",
    },
    {
      name: "Inwestycje",
      value: sumByCategory(expenses, "investment"),
      color: "#3b82f6",
    },
    {
      name: "Cele",
      value: sumByCategory(expenses, "goal"),
      color: "#8b5cf6",
    },
    {
      name: "Wolne",
      value: available,
      color: "#10b981",
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
          Gdzie poszła wypłata?
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Podział miesięcznego dochodu
        </p>
      </div>

      <div
        className="
          mt-5
          grid
          grid-cols-1
          items-center
          gap-4
          xl:grid-cols-[260px_1fr]
        "
      >

        <div className="relative h-[260px]">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={3}
                stroke="none"
              >

                {data.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}

              </Pie>

              <Tooltip
                formatter={(value) =>
                  `${Number(value).toLocaleString("pl-PL")} zł`
                }
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  color: "#ffffff",
                }}
              />

            </PieChart>

          </ResponsiveContainer>

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
            "
          >

            <span className="text-2xl font-bold">
              {income.toLocaleString("pl-PL")} zł
            </span>

            <span className="text-xs text-slate-500">
              miesięcznie
            </span>

          </div>

        </div>

        {/* LEGEND */}

        <div className="space-y-4">

          {data.map((item) => {

            const percentage =
              (item.value / income) * 100;

            return (
              <div
                key={item.name}
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />

                  <span className="text-sm text-slate-400">
                    {item.name}
                  </span>

                </div>

                <div>
                  <span className="font-semibold">
                    {item.value.toLocaleString("pl-PL")} zł
                  </span>

                  <span className="ml-3 text-xs text-slate-500">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}