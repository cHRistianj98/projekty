import type { FreedomLevel } from "../types/Level";

export const freedomLevels: FreedomLevel[] = [
  {
    level: 1,
    name: "Starter",
    minNetWorth: 0,
    maxNetWorth: 100_000,
  },
  {
    level: 2,
    name: "Builder",
    minNetWorth: 100_000,
    maxNetWorth: 250_000,
  },
  {
    level: 3,
    name: "Investor",
    minNetWorth: 250_000,
    maxNetWorth: 500_000,
  },
  {
    level: 4,
    name: "Accelerator",
    minNetWorth: 500_000,
    maxNetWorth: 1_000_000,
  },
  {
    level: 5,
    name: "Millionaire",
    minNetWorth: 1_000_000,
    maxNetWorth: 2_000_000,
  },
  {
    level: 6,
    name: "Independent",
    minNetWorth: 2_000_000,
    maxNetWorth: 3_000_000,
  },
  {
    level: 7,
    name: "FREE",
    minNetWorth: 3_000_000,
    maxNetWorth: null,
  },
];