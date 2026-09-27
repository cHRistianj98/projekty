import type { Asset } from "../../types/Asset";
import type { Goal, GoalPriority } from "../../types/Goal";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
import { calculateFreedomEngine } from "../freedom/freedomEngine";

export type MoneyRouteKind =
  | "shield"
  | "debt"
  | "goal"
  | "invest";

export type MoneyRoute = {
  kind: MoneyRouteKind;
  title: string;
  amount: number;
  reason: string;
  priority?: GoalPriority;
  goalId?: number;
};

export type MoneyRouterInput = {
  amount: number;
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export function routeMoney(
  input: MoneyRouterInput
) {
  const amount = Math.max(
    Math.round(input.amount),
    0
  );

  let remaining = amount;
  const routes: MoneyRoute[] = [];

  const engine =
    calculateFreedomEngine(input);

  // 1. Safety Shield / Emergency Fund.
  // Jeśli użytkownik ma aktywny cel typu EMERGENCY_FUND,
  // to on staje się kanoniczną poduszką i NIE finansujemy
  // osobno systemowego Safety Shield.
  const emergencyGoal = input.goals
    .filter(
      (goal) =>
        goal.type === "EMERGENCY_FUND" &&
        goal.targetAmount > goal.currentAmount
    )
    .sort(compareGoals)[0];

  const systemShieldTarget = Math.max(
    engine.averageExpenses * 6,
    0
  );

  const shieldTarget = emergencyGoal
    ? Math.max(
        emergencyGoal.targetAmount,
        systemShieldTarget
      )
    : systemShieldTarget;

  const shieldCurrent = emergencyGoal
    ? emergencyGoal.currentAmount
    : engine.liquidAssets;

  const shieldGap = Math.max(
    shieldTarget - shieldCurrent,
    0
  );

  if (remaining > 0 && shieldGap > 0) {
    const allocation = Math.min(
      remaining,
      shieldGap
    );

    routes.push({
      kind: "shield",
      title: emergencyGoal
        ? emergencyGoal.name
        : "Safety Shield",
      amount: allocation,
      priority:
        emergencyGoal?.priority ??
        "HIGH",
      goalId: emergencyGoal?.id,
      reason: emergencyGoal
        ? `Cel typu Poduszka bezpieczeństwa zastępuje systemowy Safety Shield. Do docelowej poduszki brakuje ${formatMoney(
            shieldGap
          )}.`
        : `Domknij 6 miesięcy bezpieczeństwa. Brakowało ${formatMoney(
            shieldGap
          )}.`,
    });

    remaining -= allocation;
  }

  // 2. Debt Attack — zejście poniżej 10% aktywów brutto.
  const totalDebt =
    input.liabilities.reduce(
      (sum, liability) =>
        sum +
        Math.max(
          liability.remainingAmount,
          0
        ),
      0
    );

  const grossAssets =
    input.portfolio.reduce(
      (sum, asset) =>
        sum +
        Math.max(asset.value, 0),
      0
    );

  const debtGap = Math.max(
    totalDebt - grossAssets * 0.1,
    0
  );

  if (remaining > 0 && debtGap > 0) {
    const allocation = Math.min(
      remaining,
      debtGap
    );

    routes.push({
      kind: "debt",
      title: "Debt Attack",
      amount: allocation,
      reason: `Zejdź z zobowiązaniami do maks. 10% aktywów brutto. Do redukcji było ${formatMoney(
        debtGap
      )}.`,
    });

    remaining -= allocation;
  }

  // 3. Goals — HIGH -> MEDIUM -> LOW.
  // W ramach tego samego priorytetu wcześniejszy deadline wygrywa.
  const activeGoals = input.goals
    .filter(
      (goal) =>
        goal.type !== "EMERGENCY_FUND" &&
        goal.targetAmount >
        goal.currentAmount
    )
    .sort(compareGoals);

  for (const goal of activeGoals) {
    if (remaining <= 0) break;

    const gap = Math.max(
      goal.targetAmount -
        goal.currentAmount,
      0
    );

    if (gap <= 0) continue;

    const allocation = Math.min(
      remaining,
      gap
    );

    const priority =
      goal.priority ?? "MEDIUM";

    routes.push({
      kind: "goal",
      title: goal.name,
      amount: allocation,
      priority,
      goalId: goal.id,
      reason: buildGoalReason(
        goal,
        priority,
        gap
      ),
    });

    remaining -= allocation;
  }

  // 4. Reszta pracuje na Road To FREE.
  if (remaining > 0) {
    routes.push({
      kind: "invest",
      title: "Invest / Road To FREE",
      amount: remaining,
      reason:
        "Poduszka, limit długu i aktywne cele zostały pokryte w tej symulacji — reszta może pracować na wzrost majątku.",
    });

    remaining = 0;
  }

  return {
    amount,
    routes,
    allocated: amount - remaining,
    unallocated: remaining,
  };
}

function compareGoals(
  a: Goal,
  b: Goal
) {
  const priorityDiff =
    priorityWeight(
      a.priority ?? "MEDIUM"
    ) -
    priorityWeight(
      b.priority ?? "MEDIUM"
    );

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const aDate = dateWeight(
    a.targetDate
  );
  const bDate = dateWeight(
    b.targetDate
  );

  if (aDate !== bDate) {
    return aDate - bDate;
  }

  const aGap =
    a.targetAmount -
    a.currentAmount;

  const bGap =
    b.targetAmount -
    b.currentAmount;

  return aGap - bGap;
}

function priorityWeight(
  priority: GoalPriority
) {
  return {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  }[priority];
}

function dateWeight(
  targetDate?: string
) {
  if (!targetDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(
    `${targetDate}T12:00:00`
  ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.MAX_SAFE_INTEGER;
}

function buildGoalReason(
  goal: Goal,
  priority: GoalPriority,
  gap: number
) {
  const deadline = goal.targetDate
    ? new Date(
        `${goal.targetDate}T12:00:00`
      ).toLocaleDateString(
        "pl-PL",
        {
          month: "long",
          year: "numeric",
        }
      )
    : null;

  return `${priority} priority${
    deadline
      ? ` • deadline ${deadline}`
      : ""
  }. Do celu brakuje ${formatMoney(
    gap
  )}.`;
}

function formatMoney(value: number) {
  return `${Math.round(
    value
  ).toLocaleString("pl-PL")} zł`;
}
