import { useState } from "react";

import {
  CalendarDays,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { AddGoalModal } from "../components/goals/AddGoalModal";
import { EditGoalModal } from "../components/goals/EditGoalModal";

import type { Goal } from "../types/Goal";

import {
  calculateGoalProgress,
  calculateGoalProjectedDate,
  calculateGoalRemaining,
  calculateMonthsToGoal,
} from "../utils/goals";

type GoalsProps = {
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: number) => void;
};

export function Goals({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}: GoalsProps) {
  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] = useState(false);

  const [
    editingGoal,
    setEditingGoal,
  ] = useState<Goal | null>(null);

  function handleDelete(
    goal: Goal
  ) {
    if (
      !window.confirm(
        `Usunąć cel "${goal.name}"?`
      )
    ) {
      return;
    }

    onDeleteGoal(goal.id);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Target size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Cele
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Zamieniaj pieniądze w konkretne plany
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsAddModalOpen(true)
          }
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Dodaj cel
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {goals.map((goal) => {
          const progress =
            calculateGoalProgress(goal);

          const remaining =
            calculateGoalRemaining(goal);

          const months =
            calculateMonthsToGoal(goal);

          const projectedDate =
            calculateGoalProjectedDate(
              goal
            );

          const completed =
            remaining === 0;

          return (
            <div
              key={goal.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        `${goal.color}20`,
                      color:
                        goal.color,
                    }}
                  >
                    <Target
                      size={21}
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      {goal.name}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {completed
                        ? "Cel osiągnięty 🎉"
                        : `${progress.toFixed(
                            1
                          )}% celu`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingGoal(
                        goal
                      )
                    }
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400"
                  >
                    <Pencil
                      size={17}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        goal
                      )
                    }
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2
                      size={17}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold">
                    {goal.currentAmount.toLocaleString(
                      "pl-PL"
                    )}{" "}
                    zł
                  </span>

                  <span className="ml-2 text-sm text-slate-500">
                    /{" "}
                    {goal.targetAmount.toLocaleString(
                      "pl-PL"
                    )}{" "}
                    zł
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-300">
                  {progress.toFixed(
                    0
                  )}
                  %
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor:
                      goal.color,
                  }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Info
                  label="Brakuje"
                  value={
                    completed
                      ? "0 zł"
                      : `${remaining.toLocaleString(
                          "pl-PL"
                        )} zł`
                  }
                />

                <Info
                  label="Miesięcznie"
                  value={`${goal.monthlyContribution.toLocaleString(
                    "pl-PL"
                  )} zł`}
                />
              </div>

              {!completed && (
                <div className="mt-5 flex items-center gap-2 border-t border-slate-800 pt-5 text-sm text-slate-400">
                  <CalendarDays
                    size={17}
                    className="text-blue-400"
                  />

                  {months === null ||
                  projectedDate ===
                    null ? (
                    <span>
                      Ustaw miesięczną wpłatę, aby policzyć termin
                    </span>
                  ) : (
                    <span>
                      Przy obecnym tempie:{" "}
                      <strong className="text-slate-200">
                        {months} mies.
                      </strong>{" "}
                      — około{" "}
                      {projectedDate.toLocaleDateString(
                        "pl-PL",
                        {
                          month:
                            "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-16 text-center">
          <Target
            size={36}
            className="mx-auto text-slate-600"
          />

          <h2 className="mt-4 text-lg font-semibold">
            Nie masz jeszcze celów
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Dodaj pierwszy cel finansowy.
          </p>
        </div>
      )}

      {isAddModalOpen && (
        <AddGoalModal
          onClose={() =>
            setIsAddModalOpen(
              false
            )
          }
          onAdd={onAddGoal}
        />
      )}

      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() =>
            setEditingGoal(null)
          }
          onUpdate={
            onUpdateGoal
          }
        />
      )}
    </main>
  );
}

type InfoProps = {
  label: string;
  value: string;
};

function Info({
  label,
  value,
}: InfoProps) {
  return (
    <div className="rounded-xl bg-slate-950/50 p-4">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-semibold">
        {value}
      </div>
    </div>
  );
}