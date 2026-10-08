import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { NetWorthSnapshot } from "../../types/NetWorthHistory";

type NetWorthChartProps = {
  history: NetWorthSnapshot[];
};

export function NetWorthChart({
  history,
}: NetWorthChartProps) {
  const firstValue =
    history.length > 0
      ? history[0].value
      : 0;

  const lastValue =
    history.length > 0
      ? history[history.length - 1].value
      : 0;

  const change =
    lastValue - firstValue;

  const percentageChange =
    firstValue > 0
      ? (change / firstValue) * 100
      : 0;

  const chartData = history.map(
    (snapshot) => ({
      ...snapshot,

      label: new Date(
        `${snapshot.date}T12:00:00`
      ).toLocaleDateString(
        "pl-PL",
        {
          day: "2-digit",
          month: "short",
        }
      ),
    })
  );

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900/70
        p-5
      "
    >
      {/* HEADER */}

      <div
        className="
          mb-5
          flex
          items-start
          justify-between
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
            Historia majątku
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Codzienny snapshot: aktywa minus zobowiązania
          </p>
        </div>

        <div className="text-right">
          <div
            className={`
              text-sm
              font-semibold
              ${
                change >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            `}
          >
            {change >= 0 ? "+" : ""}
            {change.toLocaleString(
              "pl-PL"
            )}{" "}
            zł
          </div>

          <div
            className={`
              mt-1
              text-xs
              ${
                percentageChange >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }
            `}
          >
            {percentageChange >= 0
              ? "+"
              : ""}
            {percentageChange.toFixed(
              1
            )}
            %
          </div>
        </div>
      </div>

      {/* CHART */}

      <div className="h-[260px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 5,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="netWorthGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#3b82f6"
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor="#3b82f6"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              minTickGap={28}
            />

            <YAxis
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(value) =>
                `${Math.round(
                  value / 1000
                )}k`
              }
            />

            <Tooltip
              formatter={(value) => [
                `${Number(
                  value
                ).toLocaleString(
                  "pl-PL"
                )} zł`,
                "Majątek",
              ]}
              labelFormatter={(
                _label,
                payload
              ) => {
                const date =
                  payload?.[0]
                    ?.payload?.date;

                if (!date) {
                  return "";
                }

                return new Date(
                  `${date}T12:00:00`
                ).toLocaleDateString(
                  "pl-PL"
                );
              }}
              contentStyle={{
                backgroundColor:
                  "#0f172a",
                border:
                  "1px solid #334155",
                borderRadius: "12px",
                color: "#ffffff",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#netWorthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}