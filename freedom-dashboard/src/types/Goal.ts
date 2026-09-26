import type { LucideIcon } from "lucide-react";

export type Goal = {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  color: string;
};

export type GoalDisplay = Goal & {
  icon?: LucideIcon;
};