import { useMemo, useState } from "react";

import {
  Calculator,
  CalendarDays,
  Coins,
  Flag,
  Landmark,
  PiggyBank,
  Rocket,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

type SimulatorProps = {
  netWorth: number;
};

type SimulationPoint = {
  year: number;
  portfolio: number;
  contributions: number;
  profit: number;
};

type Milestone = {
  name: string;
  amount: number;
};

const milestones: Milestone[] = [
  {
    name: "Investor",
    amount: 250_000,
  },
  {
    name: "Accelerator",
    amount: 500_000,
  },
  {
    name: "Millionaire",
    amount: 1_000_000,
  },
  {
    name: "Independent",
    amount: 2_000_000,
  },
  {
    name: "FREE",
    amount: 3_000_000,
  },
];

export function Simulator({
  netWorth,
}: SimulatorProps) {
  const [startingCapital, setStartingCapital] =
    useState(netWorth);

  const [monthlyContribution, setMonthlyContribution] =
    useState(8_000);

  const [annualReturn, setAnnualReturn] =
    useState(7);

  const [annualContributionGrowth, setAnnualContributionGrowth] =
    useState(3);

  const [years, setYears] =
    useState(20);

  const simulation = useMemo(
    () =>
      calculateSimulation({
        startingCapital,
        monthlyContribution,
        annualReturn,
        annualContributionGrowth,
        years,
      }),
    [
      startingCapital,
      monthlyContribution,
      annualReturn,
      annualContributionGrowth,
      years,
    ]
  );

  const finalPoint =
    simulation[
      simulation.length - 1
    ];

  const milestoneResults =
    useMemo(
      () =>
        milestones.map(
          (milestone) => ({
            ...milestone,
            reached:
              findMilestoneYear(
                simulation,
                milestone.amount
              ),
          })
        ),
      [simulation]
    );

  const freedomMilestone =
    milestoneResults.find(
      (milestone) =>
        milestone.amount ===
        3_000_000
    );

  const investmentProfit =
    finalPoint?.profit ?? 0;

  const totalContributions =
    finalPoint?.contributions ??
    startingCapital;

  const finalPortfolio =
    finalPoint?.portfolio ??
    startingCapital;

  const freedomProgress =
    Math.min(
      (startingCapital /
        3_000_000) *
        100,
      100
    );

  return (
    <main className="min-h-screen bg-[#050b16] p-8">
      {/* HEADER */}

      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Calculator
              size={20}
              className="text-blue-400"
            />

            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-400">
              Freedom Simulator
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Zaprojektuj swoją wolność
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Sprawdź, jak kapitał,
            miesięczne inwestycje i procent
            składany wpływają na drogę do
            3 000 000 zł.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
            Cel FREEDOM
          </p>

          <p className="mt-1 text-xl font-black text-white">
            3 000 000 zł
          </p>
        </div>
      </section>

      {/* CURRENT PROGRESS */}

      <section className="mt-7 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Current position
            </p>

            <p className="mt-2 text-2xl font-black">
              {formatMoney(
                startingCapital
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Kapitał startowy symulacji
            </p>
          </div>

          <div className="w-full max-w-2xl">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                Droga do FREE
              </span>

              <span className="font-bold text-blue-400">
                {freedomProgress.toFixed(
                  1
                )}
                %
              </span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${freedomProgress}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-slate-600">
              <span>0 zł</span>

              <span>
                3 000 000 zł
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTROLS + RESULT */}

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* CONTROLS */}

        <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Parametry
          </p>

          <h2 className="mt-2 text-xl font-black">
            Twój scenariusz
          </h2>

          <div className="mt-7 space-y-6">
            <MoneyInput
              label="Kapitał startowy"
              value={startingCapital}
              onChange={
                setStartingCapital
              }
              icon={
                <WalletCards
                  size={18}
                />
              }
            />

            <MoneyInput
              label="Miesięczna inwestycja"
              value={
                monthlyContribution
              }
              onChange={
                setMonthlyContribution
              }
              icon={
                <PiggyBank
                  size={18}
                />
              }
            />

            <RangeControl
              label="Średnia stopa zwrotu"
              value={annualReturn}
              min={0}
              max={15}
              step={0.5}
              suffix="% rocznie"
              onChange={
                setAnnualReturn
              }
            />

            <RangeControl
              label="Wzrost miesięcznej wpłaty"
              value={
                annualContributionGrowth
              }
              min={0}
              max={15}
              step={1}
              suffix="% rocznie"
              onChange={
                setAnnualContributionGrowth
              }
            />

            <RangeControl
              label="Horyzont"
              value={years}
              min={5}
              max={30}
              step={1}
              suffix="lat"
              onChange={setYears}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setStartingCapital(
                netWorth
              );
              setMonthlyContribution(
                8_000
              );
              setAnnualReturn(7);
              setAnnualContributionGrowth(
                3
              );
              setYears(20);
            }}
            className="mt-7 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-blue-500/50 hover:text-white"
          >
            Resetuj scenariusz
          </button>
        </div>

        {/* RESULT */}

        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-[#0b1322] p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Projection
              </p>

              <h2 className="mt-2 text-xl font-black">
                Twój majątek za {years} lat
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
              <Rocket size={23} />
            </div>
          </div>

          <p className="mt-8 text-4xl font-black tracking-tight text-white md:text-5xl">
            {formatMoney(
              finalPortfolio
            )}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResultMetric
              label="Twój kapitał"
              value={formatMoney(
                totalContributions
              )}
              icon={
                <Coins size={18} />
              }
            />

            <ResultMetric
              label="Zysk z inwestycji"
              value={formatMoney(
                investmentProfit
              )}
              icon={
                <TrendingUp
                  size={18}
                />
              }
              accent
            />

            <ResultMetric
              label="Cel FREE"
              value={
                freedomMilestone?.reached
                  ? `rok ${freedomMilestone.reached.calendarYear}`
                  : `> ${years} lat`
              }
              icon={
                <Flag size={18} />
              }
            />
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#08111f]/70 p-5">
            <div className="flex items-start gap-3">
              <Sparkles
                size={19}
                className="mt-0.5 shrink-0 text-amber-400"
              />

              <div>
                <p className="font-bold">
                  Siła procentu składanego
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Z prognozowanych{" "}
                  <span className="font-semibold text-slate-300">
                    {formatMoney(
                      finalPortfolio
                    )}
                  </span>{" "}
                  około{" "}
                  <span className="font-semibold text-emerald-400">
                    {formatMoney(
                      investmentProfit
                    )}
                  </span>{" "}
                  pochodzi ze wzrostu
                  kapitału, a nie z Twoich
                  wpłat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHART */}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Wealth // Projection
            </p>

            <h2 className="mt-2 text-xl font-black">
              Trajektoria majątku
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kapitał własny kontra efekt
              inwestowania.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs">
            <Legend
              label="Wartość portfela"
              className="bg-blue-500"
            />

            <Legend
              label="Wpłacony kapitał"
              className="bg-violet-500"
            />
          </div>
        </div>

        <div className="mt-7">
          <ProjectionChart
            points={simulation}
          />
        </div>
      </section>

      {/* MILESTONES */}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Landmark size={21} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Milestones
            </p>

            <h2 className="mt-1 text-xl font-black">
              Droga do wolności
            </h2>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {milestoneResults.map(
            (milestone) => (
              <MilestoneCard
                key={milestone.amount}
                milestone={milestone}
                years={years}
              />
            )
          )}
        </div>
      </section>

      {/* NOTE */}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-start gap-3">
          <CalendarDays
            size={18}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <p className="text-xs leading-5 text-slate-500">
            Symulacja jest scenariuszem,
            nie prognozą. Zakłada stałą
            średnią stopę zwrotu oraz
            regularne miesięczne wpłaty.
            Nie uwzględnia podatków,
            inflacji, opłat ani zmienności
            rynku.
          </p>
        </div>
      </section>
    </main>
  );
}

/*
 * =========================================
 * INPUTS
 * =========================================
 */

function MoneyInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">
        {label}
      </span>

      <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#08111f] px-4 transition focus-within:border-blue-500">
        <span className="text-slate-500">
          {icon}
        </span>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(
              Math.max(
                0,
                Number(
                  event.target.value
                ) || 0
              )
            )
          }
          className="w-full bg-transparent px-3 py-3 font-bold text-white outline-none"
        />

        <span className="text-sm text-slate-500">
          zł
        </span>
      </div>
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-300">
          {label}
        </span>

        <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-sm font-black text-blue-400">
          {value} {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="mt-4 w-full accent-blue-500"
      />

      <div className="mt-1 flex justify-between text-[10px] text-slate-600">
        <span>
          {min}
        </span>

        <span>
          {max}
        </span>
      </div>
    </div>
  );
}

/*
 * =========================================
 * RESULT COMPONENTS
 * =========================================
 */

function ResultMetric({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#08111f]/70 p-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          accent
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-blue-500/10 text-blue-400"
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-black ${
          accent
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MilestoneCard({
  milestone,
  years,
}: {
  milestone: Milestone & {
    reached: {
      year: number;
      calendarYear: number;
    } | null;
  };
  years: number;
}) {
  const reached =
    milestone.reached !== null;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        reached
          ? "border-blue-500/30 bg-blue-500/10"
          : "border-slate-800 bg-[#08111f]/60"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {milestone.name}
      </p>

      <p className="mt-2 text-xl font-black">
        {formatCompactMoney(
          milestone.amount
        )}
      </p>

      <div className="mt-5 border-t border-slate-800 pt-4">
        {reached ? (
          <>
            <p className="text-xs text-slate-500">
              Osiągnięcie
            </p>

            <p className="mt-1 font-bold text-blue-400">
              {milestone.reached!
                .year === 0
                ? "Już osiągnięte"
                : `${milestone.reached!.year} lat`}
            </p>

            {milestone.reached!
              .year > 0 && (
              <p className="mt-1 text-xs text-slate-600">
                około{" "}
                {
                  milestone
                    .reached!
                    .calendarYear
                }
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              Poza horyzontem
            </p>

            <p className="mt-1 font-bold text-slate-600">
              &gt; {years} lat
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Legend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2.5 w-2.5 rounded-full ${className}`}
      />

      <span className="text-slate-500">
        {label}
      </span>
    </div>
  );
}

/*
 * =========================================
 * CHART
 * =========================================
 */

function ProjectionChart({
  points,
}: {
  points: SimulationPoint[];
}) {
  if (points.length < 2) {
    return null;
  }

  const width = 1100;
  const height = 380;

  const paddingLeft = 90;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 55;

  const maxValue =
    Math.max(
      ...points.map(
        (point) =>
          point.portfolio
      ),
      1
    ) * 1.08;

  const xForIndex = (
    index: number
  ) =>
    paddingLeft +
    (index /
      Math.max(
        points.length - 1,
        1
      )) *
      (width -
        paddingLeft -
        paddingRight);

  const yForValue = (
    value: number
  ) =>
    paddingTop +
    (1 -
      value / maxValue) *
      (height -
        paddingTop -
        paddingBottom);

  const portfolioPoints =
    points
      .map(
        (point, index) =>
          `${xForIndex(
            index
          )},${yForValue(
            point.portfolio
          )}`
      )
      .join(" ");

  const contributionPoints =
    points
      .map(
        (point, index) =>
          `${xForIndex(
            index
          )},${yForValue(
            point.contributions
          )}`
      )
      .join(" ");

  const gridValues =
    Array.from(
      { length: 5 },
      (_, index) =>
        (maxValue / 4) *
        index
    );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[850px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[380px] w-full"
          role="img"
          aria-label="Prognoza wartości majątku"
        >
          <defs>
            <linearGradient
              id="portfolioGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="rgb(59 130 246)"
                stopOpacity="0.25"
              />

              <stop
                offset="100%"
                stopColor="rgb(59 130 246)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {gridValues.map(
            (value) => {
              const y =
                yForValue(value);

              return (
                <g key={value}>
                  <line
                    x1={paddingLeft}
                    x2={
                      width -
                      paddingRight
                    }
                    y1={y}
                    y2={y}
                    stroke="rgb(30 41 59)"
                    strokeWidth="1"
                  />

                  <text
                    x={
                      paddingLeft -
                      14
                    }
                    y={y + 4}
                    textAnchor="end"
                    fill="rgb(100 116 139)"
                    fontSize="12"
                  >
                    {formatCompactMoney(
                      value
                    )}
                  </text>
                </g>
              );
            }
          )}

          <polygon
            points={`${paddingLeft},${yForValue(
              0
            )} ${portfolioPoints} ${xForIndex(
              points.length - 1
            )},${yForValue(0)}`}
            fill="url(#portfolioGradient)"
          />

          <polyline
            points={
              contributionPoints
            }
            fill="none"
            stroke="rgb(139 92 246)"
            strokeWidth="3"
            strokeDasharray="8 7"
          />

          <polyline
            points={portfolioPoints}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map(
            (point, index) => {
              if (
                index !== 0 &&
                index !==
                  points.length - 1 &&
                index % 5 !== 0
              ) {
                return null;
              }

              const x =
                xForIndex(index);

              return (
                <g
                  key={point.year}
                >
                  <circle
                    cx={x}
                    cy={yForValue(
                      point.portfolio
                    )}
                    r="5"
                    fill="rgb(59 130 246)"
                    stroke="rgb(8 17 31)"
                    strokeWidth="3"
                  >
                    <title>
                      {`Rok ${point.year}: ${formatMoney(
                        point.portfolio
                      )}`}
                    </title>
                  </circle>

                  <text
                    x={x}
                    y={
                      height - 20
                    }
                    textAnchor="middle"
                    fill="rgb(100 116 139)"
                    fontSize="12"
                  >
                    {point.year} lat
                  </text>
                </g>
              );
            }
          )}

          <text
            x="18"
            y={
              height / 2
            }
            transform={`rotate(-90 18 ${
              height / 2
            })`}
            textAnchor="middle"
            fill="rgb(71 85 105)"
            fontSize="11"
            letterSpacing="1"
          >
            WARTOŚĆ PORTFELA
          </text>
        </svg>
      </div>
    </div>
  );
}

/*
 * =========================================
 * CALCULATIONS
 * =========================================
 */

function calculateSimulation({
  startingCapital,
  monthlyContribution,
  annualReturn,
  annualContributionGrowth,
  years,
}: {
  startingCapital: number;
  monthlyContribution: number;
  annualReturn: number;
  annualContributionGrowth: number;
  years: number;
}): SimulationPoint[] {
  const points: SimulationPoint[] =
    [];

  let portfolio =
    startingCapital;

  let contributions =
    startingCapital;

  let currentMonthlyContribution =
    monthlyContribution;

  const monthlyReturn =
    Math.pow(
      1 + annualReturn / 100,
      1 / 12
    ) - 1;

  points.push({
    year: 0,
    portfolio,
    contributions,
    profit:
      portfolio -
      contributions,
  });

  for (
    let year = 1;
    year <= years;
    year++
  ) {
    for (
      let month = 0;
      month < 12;
      month++
    ) {
      portfolio *=
        1 + monthlyReturn;

      portfolio +=
        currentMonthlyContribution;

      contributions +=
        currentMonthlyContribution;
    }

    points.push({
      year,
      portfolio,
      contributions,
      profit:
        portfolio -
        contributions,
    });

    currentMonthlyContribution *=
      1 +
      annualContributionGrowth /
        100;
  }

  return points;
}

function findMilestoneYear(
  simulation: SimulationPoint[],
  target: number
) {
  const point =
    simulation.find(
      (item) =>
        item.portfolio >=
        target
    );

  if (!point) {
    return null;
  }

  return {
    year: point.year,
    calendarYear:
      new Date().getFullYear() +
      point.year,
  };
}

/*
 * =========================================
 * FORMAT
 * =========================================
 */

function formatMoney(
  value: number
) {
  return `${Math.round(
    value
  ).toLocaleString(
    "pl-PL"
  )} zł`;
}

function formatCompactMoney(
  value: number
) {
  if (
    Math.abs(value) >=
    1_000_000
  ) {
    return `${(
      value / 1_000_000
    ).toLocaleString(
      "pl-PL",
      {
        maximumFractionDigits: 1,
      }
    )} mln`;
  }

  if (
    Math.abs(value) >=
    1_000
  ) {
    return `${Math.round(
      value / 1_000
    ).toLocaleString(
      "pl-PL"
    )}k`;
  }

  return Math.round(
    value
  ).toLocaleString(
    "pl-PL"
  );
}