import {
  ArrowRight,
  CalendarDays,
  Target,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Goal } from "../../types/Goal";

type GoalsSectionProps = {
  goals: Goal[];
};

export function GoalsSection({
  goals,
}: GoalsSectionProps) {
  const navigate = useNavigate();

  const visibleGoals = goals.slice(0, 5);

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target
            size={20}
            className="text-blue-400"
          />

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Moje główne cele
          </h2>
        </div>

        <button
          type="button"
          onClick={() => navigate("/goals")}
          className="flex cursor-pointer items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300"
        >
          Zobacz wszystkie
          <ArrowRight size={16} />
        </button>
      </div>

      {visibleGoals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleGoals.map((goal) => (
            <DashboardGoalCard
              key={goal.id}
              goal={goal}
              onClick={() => navigate("/goals")}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
          <p className="text-sm text-slate-500">
            Nie masz jeszcze żadnych celów.
          </p>

          <button
            type="button"
            onClick={() => navigate("/goals")}
            className="mt-3 cursor-pointer text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Dodaj pierwszy cel
          </button>
        </div>
      )}
    </section>
  );
}

function DashboardGoalCard({
  goal,
  onClick,
}: {
  goal: Goal;
  onClick: () => void;
}) {
  const progress =
    goal.targetAmount > 0
      ? Math.min(
          (goal.currentAmount / goal.targetAmount) * 100,
          100
        )
      : 0;

  const remaining = Math.max(
    goal.targetAmount - goal.currentAmount,
    0
  );

  const monthsToGoal =
    goal.monthlyContribution > 0 && remaining > 0
      ? Math.ceil(remaining / goal.monthlyContribution)
      : remaining === 0
        ? 0
        : null;

  const imageUrl =
    "imageUrl" in goal && typeof goal.imageUrl === "string"
      ? goal.imageUrl
      : undefined;

  const imagePosition =
    "imagePosition" in goal &&
    typeof goal.imagePosition === "string"
      ? goal.imagePosition
      : "center";

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        overflow-hidden
        rounded-2xl
        border
        border-slate-800
        bg-[#0b1322]
        text-left
        shadow-lg
        shadow-black/10
        transition
        duration-300
        cursor-pointer
        hover:-translate-y-1
        hover:border-blue-500/35
        hover:shadow-xl
        hover:shadow-blue-950/20
      "
    >
      {imageUrl ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            className="
              h-full
              w-full
              object-cover
              transition
              duration-500
              group-hover:scale-[1.035]
            "
            style={{
              objectPosition: imagePosition,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-[#0b1322]/15 to-black/10" />

          <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
            <p className="line-clamp-1 text-lg font-black text-white drop-shadow-lg">
              {goal.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex h-28 items-end overflow-hidden bg-gradient-to-br from-blue-500/10 via-[#101b30] to-[#0b1322] p-5">
          <div className="absolute right-5 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-blue-400">
            <Target size={20} />
          </div>

          <p className="line-clamp-1 pr-12 text-lg font-black text-white">
            {goal.name}
          </p>
        </div>
      )}

      <div className="p-5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xl font-black text-white">
              {formatMoney(goal.currentAmount)}
            </span>

            <span className="ml-1 text-xs text-slate-500">
              / {formatMoney(goal.targetAmount)}
            </span>
          </div>

          <span className="shrink-0 text-sm font-black text-white">
            {progress.toFixed(0)}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
            <CalendarDays
              size={15}
              className="shrink-0 text-blue-400"
            />

            {goal.targetDate ? (
              <span className="truncate">
                Deadline{" "}
                <strong className="font-semibold text-slate-300">
                  {formatDeadline(goal.targetDate)}
                </strong>
              </span>
            ) : (
              <span>
                Brak deadline
              </span>
            )}
          </div>

          <span className="shrink-0 text-xs text-slate-500">
            {monthsToGoal === 0 ? (
              <strong className="text-emerald-400">
                Cel osiągnięty
              </strong>
            ) : monthsToGoal !== null ? (
              <>
                ~
                <strong className="text-slate-200">
                  {monthsToGoal}
                </strong>{" "}
                mies.
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("pl-PL")} zł`;
}

function formatDeadline(value: string) {
  const [year, month] = value.slice(0, 7).split("-");

  if (!year || !month) {
    return value;
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return new Intl.DateTimeFormat("pl-PL", {
    month: "short",
    year: "numeric",
  }).format(date);
}
