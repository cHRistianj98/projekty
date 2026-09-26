import {
  ArrowRight,
  Target,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { GoalCard } from "./GoalCard";

import type { Goal } from "../../types/Goal";

type GoalsSectionProps = {
  goals: Goal[];
};

export function GoalsSection({
  goals,
}: GoalsSectionProps) {
  const navigate = useNavigate();

  const visibleGoals =
    goals.slice(0, 5);

  return (
    <section className="mt-6">
      {/* SECTION HEADER */}

      <div
        className="
          mb-4
          flex
          items-center
          justify-between
        "
      >
        <div className="flex items-center gap-2">
          <Target
            size={20}
            className="text-blue-400"
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
            Moje główne cele
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/goals")
          }
          className="
            flex
            items-center
            gap-2
            text-sm
            text-blue-400
            transition
            hover:text-blue-300
          "
        >
          Zobacz wszystkie
          <ArrowRight size={16} />
        </button>
      </div>

      {/* CARDS */}

      {visibleGoals.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-5
          "
        >
          {visibleGoals.map(
            (goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
              />
            )
          )}
        </div>
      ) : (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-slate-800
            bg-slate-900/30
            p-8
            text-center
          "
        >
          <p className="text-sm text-slate-500">
            Nie masz jeszcze żadnych
            celów.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/goals")
            }
            className="mt-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Dodaj pierwszy cel
          </button>
        </div>
      )}
    </section>
  );
}