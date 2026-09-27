import type { LucideIcon } from "lucide-react";

export type GoalPriority =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type GoalType =
  | "EMERGENCY_FUND"
  | "HOME"
  | "CAR"
  | "TRAVEL"
  | "OTHER";

export type Goal = {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  priority?: GoalPriority;
  type?: GoalType;
  color: string;
  imageUrl?: string;
  imagePosition?: "center" | "top" | "bottom";
};

export type GoalDisplay = Goal & {
  icon?: LucideIcon;
};
