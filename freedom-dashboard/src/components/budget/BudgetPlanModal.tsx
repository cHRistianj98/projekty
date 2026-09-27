import { useState } from "react";

import {
  PiggyBank,
  X,
} from "lucide-react";

import type {
  ExpenseCategory,
} from "../../types/Cashflow";

import type {
  MonthlyBudgetPlan,
} from "../../types/Budget";

type BudgetPlanModalProps = {
  month: string;

  existingPlan?: MonthlyBudgetPlan;

  onClose: () => void;

  onSave: (
    plan: MonthlyBudgetPlan
  ) => void;
};

type FormValues = Record<
  ExpenseCategory,
  string
>;

export function BudgetPlanModal({
  month,
  existingPlan,
  onClose,
  onSave,
}: BudgetPlanModalProps) {
  const [
    values,
    setValues,
  ] = useState<FormValues>(
    () => ({
      fixed: getExistingValue(
        existingPlan,
        "fixed"
      ),

      living: getExistingValue(
        existingPlan,
        "living"
      ),

      investment:
        getExistingValue(
          existingPlan,
          "investment"
        ),

      goal: getExistingValue(
        existingPlan,
        "goal"
      ),
    })
  );

  const [error, setError] =
    useState("");

  function updateValue(
    category: ExpenseCategory,
    value: string
  ) {
    setValues((current) => ({
      ...current,
      [category]: value,
    }));
  }

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    const fixed =
      Number(values.fixed);

    const living =
      Number(values.living);

    const investment =
      Number(
        values.investment
      );

    const goal =
      Number(values.goal);

    const amounts = [
      fixed,
      living,
      investment,
      goal,
    ];

    const invalid =
      amounts.some(
        (amount) =>
          !Number.isFinite(
            amount
          ) ||
          amount < 0
      );

    if (invalid) {
      setError(
        "Każdy limit musi być liczbą równą lub większą od 0."
      );

      return;
    }

    onSave({
      month,

      limits: [
        {
          category: "fixed",
          limit: fixed,
        },

        {
          category: "living",
          limit: living,
        },

        {
          category:
            "investment",
          limit: investment,
        },

        {
          category: "goal",
          limit: goal,
        },
      ],
    });

    onClose();
  }

  const totalPlanned =
    Number(values.fixed || 0) +
    Number(values.living || 0) +
    Number(
      values.investment || 0
    ) +
    Number(values.goal || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <PiggyBank
                size={20}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                {existingPlan
                  ? "Edytuj plan"
                  : "Utwórz plan"}
              </h2>

              <p className="mt-1 text-sm capitalize text-slate-500">
                {formatMonth(
                  month
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <BudgetInput
            label="Koszty stałe"
            value={
              values.fixed
            }
            onChange={(value) =>
              updateValue(
                "fixed",
                value
              )
            }
          />

          <BudgetInput
            label="Życie"
            value={
              values.living
            }
            onChange={(value) =>
              updateValue(
                "living",
                value
              )
            }
          />

          <BudgetInput
            label="Inwestycje"
            value={
              values.investment
            }
            onChange={(value) =>
              updateValue(
                "investment",
                value
              )
            }
          />

          <BudgetInput
            label="Cele"
            value={
              values.goal
            }
            onChange={(value) =>
              updateValue(
                "goal",
                value
              )
            }
          />

          {/* TOTAL */}

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div>
              <p className="text-sm font-semibold">
                Łącznie zaplanowane
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Suma wszystkich
                limitów
              </p>
            </div>

            <p className="text-xl font-bold text-emerald-400">
              {totalPlanned.toLocaleString(
                "pl-PL"
              )}{" "}
              zł
            </p>
          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              {existingPlan
                ? "Zapisz zmiany"
                : "Utwórz plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type BudgetInputProps = {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;
};

function BudgetInput({
  label,
  value,
  onChange,
}: BudgetInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="0"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          zł
        </span>
      </div>
    </div>
  );
}

function getExistingValue(
  plan: MonthlyBudgetPlan | undefined,
  category: ExpenseCategory
) {
  const limit =
    plan?.limits.find(
      (item) =>
        item.category ===
        category
    )?.limit;

  return limit !== undefined
    ? String(limit)
    : "";
}

function formatMonth(
  month: string
) {
  const [year, monthNumber] =
    month
      .split("-")
      .map(Number);

  return new Date(
    year,
    monthNumber - 1,
    1
  ).toLocaleDateString(
    "pl-PL",
    {
      month: "long",
      year: "numeric",
    }
  );
}