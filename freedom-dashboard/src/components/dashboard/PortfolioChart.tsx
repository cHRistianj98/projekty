import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { Asset } from "../../types/Asset";

type PortfolioChartProps = {
  portfolio: Asset[];
};

export function PortfolioChart({
  portfolio,
}: PortfolioChartProps) {
  const total = portfolio.reduce(
    (sum, asset) => sum + asset.value,
    0
  );

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

      <div className="mb-5">
        <h2
          className="
            text-sm
            font-bold
            uppercase
            tracking-wider
            text-slate-300
          "
        >
          Portfel inwestycyjny
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Struktura Twojego majątku
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-1
          items-center
          gap-6
          xl:grid-cols-[240px_1fr]
        "
      >
        {/* DONUT */}

        <div className="relative h-[240px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={portfolio}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={3}
                stroke="none"
              >
                {portfolio.map((asset) => (
                  <Cell
                    key={asset.id}
                    fill={asset.color}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) =>
                  `${Number(
                    value
                  ).toLocaleString(
                    "pl-PL"
                  )} zł`
                }
                contentStyle={{
                  backgroundColor:
                    "#0f172a",
                  border:
                    "1px solid #334155",
                  borderRadius: "12px",
                  color: "#ffffff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* TEXT IN CENTER */}

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
              {total.toLocaleString(
                "pl-PL"
              )}{" "}
              zł
            </span>

            <span className="mt-1 text-xs text-slate-500">
              Łącznie
            </span>
          </div>
        </div>

        {/* LEGEND */}

        <div className="space-y-3">
          {portfolio.map((asset) => {
            const percentage =
              total > 0
                ? (asset.value / total) *
                  100
                : 0;

            return (
              <div
                key={asset.id}
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      h-3
                      w-3
                      rounded-full
                    "
                    style={{
                      backgroundColor:
                        asset.color,
                    }}
                  />

                  <span className="text-sm text-slate-300">
                    {asset.name}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-semibold">
                    {asset.value.toLocaleString(
                      "pl-PL"
                    )}{" "}
                    zł
                  </span>

                  <span className="ml-3 text-xs text-slate-500">
                    {percentage.toFixed(
                      1
                    )}
                    %
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