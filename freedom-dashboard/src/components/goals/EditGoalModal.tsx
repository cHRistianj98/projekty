import { useState } from "react";
import { X } from "lucide-react";

import type { Goal, GoalPriority, GoalType } from "../../types/Goal";
import { GOAL_TYPE_OPTIONS } from "./goalCatalog";

type EditGoalModalProps = {
  goal: Goal;
  onClose: () => void;
  onUpdate: (goal: Goal) => void;
};

const colors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export function EditGoalModal({
  goal,
  onClose,
  onUpdate,
}: EditGoalModalProps) {
  const [name, setName] =
    useState(goal.name);

  const [
    targetAmount,
    setTargetAmount,
  ] = useState(
    goal.targetAmount.toString()
  );

  const [
    monthlyContribution,
    setMonthlyContribution,
  ] = useState(
    goal.monthlyContribution.toString()
  );

  const [priority, setPriority] =
    useState<GoalPriority>(
      goal.priority ?? "MEDIUM"
    );

  const [goalType, setGoalType] =
    useState<GoalType>(
      goal.type ?? "OTHER"
    );

  const [targetDate, setTargetDate] =
    useState(goal.targetDate ?? "");

  const [color, setColor] =
    useState(goal.color);

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const target =
      Number(targetAmount);

    const monthly =
      Number(monthlyContribution);

    if (
      !name.trim() ||
      target <= 0 ||
      monthly < 0
    ) {
      return;
    }

    onUpdate({
      ...goal,
      name: name.trim(),
      currentAmount: goal.currentAmount,
      targetAmount: target,
      monthlyContribution: monthly,
      priority,
      type: goalType,
      targetDate:
        targetDate || undefined,
      color,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">
              Edytuj cel
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Zmień parametry celu
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <Field
            label="Nazwa celu"
            value={name}
            onChange={setName}
            type="text"
          />

          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Pokryte przez rezerwy i wydatki
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {goal.currentAmount.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł
                </p>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div>Odłożone: {(goal.reservedAmount ?? goal.currentAmount).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł</div>
                <div>Wydano: {(goal.spentAmount ?? 0).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł</div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Tej kwoty nie edytujesz ręcznie. Zmienia się przez przypisywanie środków do celu oraz wydatki powiązane z celem.
            </p>
          </div>

          <Field
            label="Kwota celu"
            value={targetAmount}
            onChange={setTargetAmount}
          />

          <Field
            label="Miesięczna wpłata"
            value={monthlyContribution}
            onChange={
              setMonthlyContribution
            }
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Typ celu
            </label>
            <select
              value={goalType}
              onChange={(event) =>
                setGoalType(event.target.value as GoalType)
              }
              className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            >
              {GOAL_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Priorytet
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as GoalPriority[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPriority(item)}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                      priority === item
                        ? item === "HIGH"
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                          : item === "MEDIUM"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                            : "border-blue-500/40 bg-blue-500/10 text-blue-400"
                        : "border-slate-700 bg-slate-900 text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Deadline
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Kolor
            </label>

            <div className="flex gap-3">
              {colors.map(
                (availableColor) => (
                  <button
                    key={availableColor}
                    type="button"
                    onClick={() =>
                      setColor(
                        availableColor
                      )
                    }
                    className={`
                      h-9 w-9 cursor-pointer rounded-full transition
                      ${
                        color ===
                        availableColor
                          ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0b1322]"
                          : "hover:scale-110"
                      }
                    `}
                    style={{
                      backgroundColor:
                        availableColor,
                    }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
};

function Field({
  label,
  value,
  onChange,
  type = "number",
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type={type}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
      />
    </div>
  );
}