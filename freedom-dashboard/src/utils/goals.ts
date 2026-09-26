import type { Goal } from "../types/Goal";

export function calculateGoalProgress(
  goal: Goal
): number {
  if (goal.targetAmount <= 0) {
    return 0;
  }

  return Math.min(
    (goal.currentAmount /
      goal.targetAmount) *
      100,
    100
  );
}

export function calculateGoalRemaining(
  goal: Goal
): number {
  return Math.max(
    goal.targetAmount -
      goal.currentAmount,
    0
  );
}

export function calculateMonthsToGoal(
  goal: Goal
): number | null {
  const remaining =
    calculateGoalRemaining(goal);

  if (remaining <= 0) {
    return 0;
  }

  if (goal.monthlyContribution <= 0) {
    return null;
  }

  return Math.ceil(
    remaining /
      goal.monthlyContribution
  );
}

export function calculateGoalProjectedDate(
  goal: Goal
): Date | null {
  const months =
    calculateMonthsToGoal(goal);

  if (months === null) {
    return null;
  }

  const date = new Date();

  date.setMonth(
    date.getMonth() + months
  );

  return date;
}