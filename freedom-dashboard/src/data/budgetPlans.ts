import type {
  MonthlyBudgetPlan,
} from "../types/Budget";

export const initialBudgetPlans: MonthlyBudgetPlan[] =
  [
    {
      month: "2026-09",

      limits: [
        {
          category: "fixed",
          limit: 2500,
        },

        {
          category: "living",
          limit: 2500,
        },

        {
          category: "investment",
          limit: 5000,
        },

        {
          category: "goal",
          limit: 2000,
        },
      ],
    },
  ];