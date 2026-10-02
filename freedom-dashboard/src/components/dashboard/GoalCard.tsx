import {
  CheckCircle2,
  Target,
} from "lucide-react";

import type { Goal } from "../../types/Goal";

import {
  calculateGoalProgress,
  calculateGoalRemaining,
  calculateMonthsToGoal,
} from "../../utils/goals";

type GoalCardProps = {
  goal: Goal;
};

export function GoalCard({
  goal,
}: GoalCardProps) {
  const progress =
    calculateGoalProgress(goal);

  const remaining =
    calculateGoalRemaining(goal);

  const monthsRemaining =
    calculateMonthsToGoal(goal);

  const completed =
    goal.status === "COMPLETED";

  const funded =
    !completed && remaining === 0;

  return (
    <div
      className={`
        group
        rounded-2xl
        border
        border-slate-800
        bg-slate-900/70
        p-5
        transition
        ${completed
          ? "opacity-60 grayscale"
          : "hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl"}
      `}
    >
      {/* HEADER */}

      <div className="flex items-start justify-between">
        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
          "
          style={{
            backgroundColor:
              `${goal.color}20`,
            color: goal.color,
          }}
        >
          <Target size={22} />
        </div>

        {completed && (
          <CheckCircle2
            size={22}
            className="text-emerald-400"
          />
        )}
      </div>

      {/* NAME */}

      <h3 className="mt-5 text-lg font-semibold">
        {goal.name}
      </h3>

      {/* MONEY */}

      <div className="mt-3">
        <span className="text-xl font-bold">
          {goal.currentAmount.toLocaleString(
            "pl-PL"
          )}{" "}
          zł
        </span>

        <span className="text-sm text-slate-500">
          {" "}
          /{" "}
          {goal.targetAmount.toLocaleString(
            "pl-PL"
          )}{" "}
          zł
        </span>
      </div>

      {/* PROGRESS BAR */}

      <div className="mt-4">
        <div
          className="
            h-2
            overflow-hidden
            rounded-full
            bg-slate-800
          "
        >
          <div
            className="
              h-full
              rounded-full
              transition-all
            "
            style={{
              width: `${progress}%`,
              backgroundColor:
                goal.color,
            }}
          />
        </div>

        <div
          className="
            mt-2
            flex
            justify-between
            gap-3
            text-xs
            text-slate-500
          "
        >
          <span>
            {progress.toFixed(0)}%
          </span>

          <span className="text-right">
            Pozostało:{" "}
            {remaining.toLocaleString(
              "pl-PL"
            )}{" "}
            zł
          </span>
        </div>
      </div>

      {/* FOOTER */}

      <div
        className="
          mt-5
          border-t
          border-slate-800
          pt-4
          text-sm
        "
      >
        {completed ? (
          <span className="font-medium text-slate-400">
            ✓ Cel zrealizowany
          </span>
        ) : funded ? (
          <span className="font-medium text-emerald-400">
            ✓ Cel w pełni sfinansowany
          </span>
        ) : monthsRemaining !==
          null ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              Przy obecnym tempie
            </span>

            <span className="font-medium text-slate-300">
              ~{monthsRemaining} mies.
            </span>
          </div>
        ) : (
          <span className="text-slate-500">
            Brak miesięcznej wpłaty
          </span>
        )}
      </div>
    </div>
  );
}