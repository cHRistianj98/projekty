import type { MonthlyBudget } from "../types/Cashflow";

export const initialMonthlyBudget: MonthlyBudget = {
  incomes: [
    {
      id: 1,
      name: "Kontrakt IT",
      amount: 15_000,
      date: "2026-01-01",
      recurring: true,
    },
  ],

  expenses: [
    {
      id: 1,
      name: "Mieszkanie",
      amount: 2_000,
      category: "fixed",
      date: "2026-01-01",
      recurring: true,
    },
    {
      id: 2,
      name: "Telefon",
      amount: 70,
      category: "fixed",
      date: "2026-01-01",
      recurring: true,
    },
    {
      id: 3,
      name: "Siłownia",
      amount: 150,
      category: "fixed",
      date: "2026-01-01",
      recurring: true,
    },
    {
      id: 4,
      name: "Subskrypcje",
      amount: 100,
      category: "fixed",
      date: "2026-01-01",
      recurring: true,
    },
    {
      id: 5,
      name: "Jedzenie",
      amount: 1_800,
      category: "living",
      date: "2026-01-01",
      recurring: false,
    },
    {
      id: 6,
      name: "Transport",
      amount: 600,
      category: "living",
      date: "2026-01-01",
      recurring: false,
    },
    {
      id: 7,
      name: "Rozrywka",
      amount: 500,
      category: "living",
      date: "2026-01-01",
      recurring: false,
    },
    {
      id: 8,
      name: "Inwestycje",
      amount: 2_000,
      category: "investment",
      date: "2026-01-01",
      recurring: true,
    },
    {
      id: 9,
      name: "BMW Fund",
      amount: 5_000,
      category: "goal",
      date: "2026-01-01",
      recurring: true,
    },
  ],
};