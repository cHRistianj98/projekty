import { useState } from "react";

import {
  CalendarDays,
  Flag,
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

      <section className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Flag size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-400">
              Goals 2.1 · Typed Goals
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Każdy cel ma teraz typ, priorytet i opcjonalny deadline. Typ pozwala
              Money Routerowi rozpoznać m.in. poduszkę bezpieczeństwa i nie liczyć
              jej drugi raz jako osobnego Safety Shield.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
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

          const priority =
            goal.priority ?? "MEDIUM";

          const targetDate =
            goal.targetDate
              ? new Date(
                  `${goal.targetDate}T12:00:00`
                )
              : null;

          const now = new Date();
          const monthsToDeadline =
            targetDate
              ? Math.max(
                  1,
                  (targetDate.getFullYear() -
                    now.getFullYear()) *
                    12 +
                    targetDate.getMonth() -
                    now.getMonth()
                )
              : null;

          const requiredMonthly =
            monthsToDeadline
              ? Math.ceil(
                  remaining /
                    monthsToDeadline
                )
              : null;

          const contributionGap =
            requiredMonthly !== null
              ? requiredMonthly -
                goal.monthlyContribution
              : null;

          const onTrack =
            completed ||
            requiredMonthly === null ||
            contributionGap === null ||
            contributionGap <= 0;

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

                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md border border-slate-700 bg-slate-950/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                        {formatGoalType(goal.type)}
                      </span>
                      <p className="text-xs text-slate-500">
                      {completed
                        ? "Cel osiągnięty 🎉"
                        : `${progress.toFixed(
                            1
                          )}% celu`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGoal({
                        ...goal,
                        priority:
                          priority === "HIGH"
                            ? "MEDIUM"
                            : priority === "MEDIUM"
                              ? "LOW"
                              : "HIGH",
                      })
                    }
                    title="Kliknij, aby zmienić priorytet"
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                      priority === "HIGH"
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        : priority === "MEDIUM"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-slate-700 bg-slate-800/60 text-slate-400"
                    }`}
                  >
                    <Flag size={13} />
                    {priority}
                  </button>

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

              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                <Info
                  label="Brakuje"
                  value={
                    completed
                      ? "0 zł"
                      : `${remaining.toLocaleString("pl-PL")} zł`
                  }
                />

                <Info
                  label="Wpłacasz / mies."
                  value={`${goal.monthlyContribution.toLocaleString("pl-PL")} zł`}
                />

                <Info
                  label="Wymagane / mies."
                  value={
                    requiredMonthly !== null
                      ? `${requiredMonthly.toLocaleString("pl-PL")} zł`
                      : "Brak deadline"
                  }
                  status={
                    requiredMonthly === null
                      ? "neutral"
                      : onTrack
                        ? "good"
                        : "bad"
                  }
                />
              </div>

              {targetDate && !completed && (
                <div
                  className={`mt-4 rounded-xl border px-4 py-3 ${
                    onTrack
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-amber-500/20 bg-amber-500/5"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays
                        size={16}
                        className={
                          onTrack
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      />
                      <span className="text-slate-400">
                        Deadline:{" "}
                        <strong className="text-slate-200">
                          {targetDate.toLocaleDateString("pl-PL", {
                            month: "long",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black ${
                        onTrack
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {onTrack
                        ? "✓ ON TRACK"
                        : `Brakuje ${Math.max(
                            contributionGap ?? 0,
                            0
                          ).toLocaleString("pl-PL")} zł / mies.`}
                    </span>
                  </div>
                </div>
              )}

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

function formatGoalType(type: Goal["type"]) {
  return {
    EMERGENCY_FUND: "Poduszka",
    HOME: "Dom",
    CAR: "Samochód",
    TRAVEL: "Podróże",
    OTHER: "Inny",
  }[type ?? "OTHER"];
}

type InfoProps = {
  label: string;
  value: string;
  status?: "neutral" | "good" | "bad";
};

function Info({
  label,
  value,
  status = "neutral",
}: InfoProps) {
  return (
    <div className="rounded-xl bg-slate-950/50 p-4">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div
        className={`mt-1 font-semibold ${
          status === "good"
            ? "text-emerald-400"
            : status === "bad"
              ? "text-amber-400"
              : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}