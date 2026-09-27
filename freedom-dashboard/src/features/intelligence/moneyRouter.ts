import type { Asset } from "../../types/Asset";
import type { Goal, GoalPriority } from "../../types/Goal";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
import { calculateFreedomEngine } from "../freedom/freedomEngine";
import {
  analyzeDebts,
  type DebtAction,
} from "./debtIntelligence";

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
  liabilityId?: number;
  interestRate?: number;
  debtAction?: DebtAction;
  requiredMonthly?: number;
  fundingStatus?: "FUNDED" | "PARTIAL" | "NO_DEADLINE";
  deadline?: string;
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

  // 1. EMERGENCY FUND / SAFETY SHIELD
  // Typed emergency goal is canonical, so we never finance
  // the same safety buffer twice.
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

  // 2. DEBT INTELLIGENCE
  // Instead of one abstract Debt Attack bucket, allocate the
  // debt budget to concrete liabilities in intelligence order.
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

  let debtBudget = Math.min(
    remaining,
    debtGap
  );

  const debtInsights =
    analyzeDebts(input.liabilities);

  // 0% / low-cost KEEP debt is intentionally excluded from
  // accelerated repayment. The router will not burn surplus
  // merely to satisfy the old global 10% ratio.
  const attackableDebts =
    debtInsights.filter(
      (insight) =>
        insight.action !== "KEEP"
    );

  for (const insight of attackableDebts) {
    if (
      remaining <= 0 ||
      debtBudget <= 0
    ) {
      break;
    }

    const liability =
      insight.liability;

    const outstanding =
      Math.max(
        liability.remainingAmount,
        0
      );

    if (outstanding <= 0) {
      continue;
    }

    const allocation = Math.min(
      remaining,
      debtBudget,
      outstanding
    );

    routes.push({
      kind: "debt",
      title: liability.name,
      amount: allocation,
      liabilityId: liability.id,
      interestRate:
        liability.interestRate,
      debtAction: insight.action,
      reason: buildDebtReason(
        liability,
        insight.action,
        debtGap
      ),
    });

    remaining -= allocation;
    debtBudget -= allocation;
  }

  // 3. GOAL DEADLINE INTELLIGENCE
  // Router 3.1 treats the entered amount as this month's available surplus.
  // For goals with a deadline, it first reserves the monthly amount required
  // to stay on schedule. If cash is insufficient, priority decides who gets
  // funded first; within the same priority, earlier deadline wins.
  const activeGoals = input.goals
    .filter(
      (goal) =>
        goal.type !== "EMERGENCY_FUND" &&
        goal.targetAmount >
          goal.currentAmount
    );

  const deadlineGoals = activeGoals
    .filter((goal) => Boolean(goal.targetDate))
    .map((goal) => ({
      goal,
      requiredMonthly:
        calculateRequiredMonthly(goal),
    }))
    .sort((a, b) =>
      compareGoals(a.goal, b.goal)
    );

  let totalRequiredMonthly = 0;
  let totalDeadlineAllocated = 0;

  for (const item of deadlineGoals) {
    if (remaining <= 0) break;

    const goal = item.goal;
    const gap = Math.max(
      goal.targetAmount -
        goal.currentAmount,
      0
    );

    const requiredMonthly = Math.min(
      item.requiredMonthly,
      gap
    );

    if (requiredMonthly <= 0) {
      continue;
    }

    totalRequiredMonthly +=
      requiredMonthly;

    const allocation = Math.min(
      remaining,
      requiredMonthly,
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
      requiredMonthly,
      fundingStatus:
        allocation >= requiredMonthly
          ? "FUNDED"
          : "PARTIAL",
      deadline: goal.targetDate,
      reason: buildDeadlineGoalReason(
        goal,
        priority,
        gap,
        requiredMonthly,
        allocation
      ),
    });

    remaining -= allocation;
    totalDeadlineAllocated +=
      allocation;
  }

  // Goals without a deadline still participate, but only after
  // deadline obligations have been funded for this month.
  const flexibleGoals = activeGoals
    .filter((goal) => !goal.targetDate)
    .sort(compareGoals);

  for (const goal of flexibleGoals) {
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
      fundingStatus: "NO_DEADLINE",
      reason: buildGoalReason(
        goal,
        priority,
        gap
      ),
    });

    remaining -= allocation;
  }

  // 4. ROAD TO FREE
  if (remaining > 0) {
    routes.push({
      kind: "invest",
      title: "Invest / Road To FREE",
      amount: remaining,
      reason:
        "Poduszka, kosztowne zobowiązania i aktywne cele zostały obsłużone w tej symulacji — reszta może pracować na wzrost majątku.",
    });

    remaining = 0;
  }

  const deadlineShortfall = Math.max(
    totalRequiredMonthly -
      totalDeadlineAllocated,
    0
  );

  return {
    amount,
    routes,
    allocated: amount - remaining,
    unallocated: remaining,
    deadlineSummary: {
      requiredMonthly:
        totalRequiredMonthly,
      allocatedMonthly:
        totalDeadlineAllocated,
      shortfall:
        deadlineShortfall,
      onTrack:
        deadlineShortfall <= 0,
    },
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

function buildDebtReason(
  liability: Liability,
  action: DebtAction,
  totalDebtGap: number
) {
  const actionText = {
    ATTACK: "AGGRESSIVE PAYDOWN",
    CONSIDER: "CONSIDER OVERPAYMENT",
    NORMAL: "NORMAL PAYDOWN",
    KEEP: "LOW-COST DEBT",
  }[action];

  return `${actionText} • ${formatRate(
    liability.interestRate
  )}. Debt Intelligence wskazuje ten dług przed tańszymi zobowiązaniami. Globalnie do zejścia poniżej 10% aktywów było ${formatMoney(
    totalDebtGap
  )}.`;
}

function calculateRequiredMonthly(
  goal: Goal
) {
  if (!goal.targetDate) {
    return 0;
  }

  const gap = Math.max(
    goal.targetAmount -
      goal.currentAmount,
    0
  );

  if (gap <= 0) {
    return 0;
  }

  const months =
    calculateMonthsToDeadline(
      goal.targetDate
    );

  return Math.ceil(
    gap / months
  );
}

function calculateMonthsToDeadline(
  targetDate: string
) {
  const target = new Date(
    `${targetDate}T12:00:00`
  );

  const now = new Date();

  if (
    !Number.isFinite(
      target.getTime()
    )
  ) {
    return 1;
  }

  return Math.max(
    1,
    (target.getFullYear() -
      now.getFullYear()) *
      12 +
      target.getMonth() -
      now.getMonth()
  );
}

function buildDeadlineGoalReason(
  goal: Goal,
  priority: GoalPriority,
  gap: number,
  requiredMonthly: number,
  allocation: number
) {
  const deadline = new Date(
    `${goal.targetDate}T12:00:00`
  ).toLocaleDateString(
    "pl-PL",
    {
      month: "long",
      year: "numeric",
    }
  );

  const status =
    allocation >= requiredMonthly
      ? "Tempo na ten miesiąc zabezpieczone."
      : `Brakuje ${formatMoney(
          requiredMonthly -
            allocation
        )} do miesięcznego minimum.`;

  return `${priority} • deadline ${deadline} • wymagane ${formatMoney(
    requiredMonthly
  )}/mies. ${status} Do całego celu brakuje ${formatMoney(
    gap
  )}.`;
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

function formatRate(value: number) {
  return `${value.toLocaleString(
    "pl-PL",
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}

function formatMoney(value: number) {
  return `${Math.round(
    value
  ).toLocaleString("pl-PL")} zł`;
}
