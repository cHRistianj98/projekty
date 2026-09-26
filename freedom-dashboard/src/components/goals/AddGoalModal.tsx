import { useState } from "react";
import { X } from "lucide-react";

import type { Goal } from "../../types/Goal";

type AddGoalModalProps = {
  onClose: () => void;
  onAdd: (goal: Goal) => void;
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

export function AddGoalModal({
  onClose,
  onAdd,
}: AddGoalModalProps) {
  const [name, setName] =
    useState("");

  const [currentAmount, setCurrentAmount] =
    useState("0");

  const [targetAmount, setTargetAmount] =
    useState("");

  const [
    monthlyContribution,
    setMonthlyContribution,
  ] = useState("");

  const [color, setColor] =
    useState(colors[0]);

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const current =
      Number(currentAmount);

    const target =
      Number(targetAmount);

    const monthly =
      Number(monthlyContribution);

    if (
      !name.trim() ||
      target <= 0 ||
      current < 0 ||
      monthly < 0
    ) {
      return;
    }

    onAdd({
      id: Date.now(),
      name: name.trim(),
      currentAmount: current,
      targetAmount: target,
      monthlyContribution: monthly,
      color,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">
              Dodaj cel
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Stwórz nowy cel finansowy
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <Input
            label="Nazwa celu"
            value={name}
            onChange={setName}
            placeholder="np. Porsche 911 😎"
            type="text"
          />

          <Input
            label="Aktualnie odłożone"
            value={currentAmount}
            onChange={setCurrentAmount}
            placeholder="0"
          />

          <Input
            label="Kwota celu"
            value={targetAmount}
            onChange={setTargetAmount}
            placeholder="100000"
          />

          <Input
            label="Miesięczna wpłata"
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            placeholder="5000"
          />

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
                      h-9 w-9 rounded-full transition
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
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Dodaj cel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
};

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "number",
}: InputProps) {
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
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
      />
    </div>
  );
}