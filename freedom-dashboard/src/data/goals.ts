import type { Goal } from "../types/Goal";

export const initialGoals: Goal[] = [
  {
    id: 1,
    name: "Zęby",
    currentAmount: 30_000,
    targetAmount: 30_000,
    monthlyContribution: 0,
    color: "#10b981",
  },
  {
    id: 2,
    name: "BMW",
    currentAmount: 50_000,
    targetAmount: 100_000,
    monthlyContribution: 5_000,
    color: "#3b82f6",
  },
  {
    id: 3,
    name: "Wkład na dom",
    currentAmount: 0,
    targetAmount: 300_000,
    monthlyContribution: 5_000,
    color: "#f59e0b",
  },
  {
    id: 4,
    name: "BMW X5",
    currentAmount: 0,
    targetAmount: 200_000,
    monthlyContribution: 3_000,
    color: "#a855f7",
  },
  {
    id: 5,
    name: "Wakacje marzeń",
    currentAmount: 12_000,
    targetAmount: 50_000,
    monthlyContribution: 1_500,
    color: "#06b6d4",
  },
];