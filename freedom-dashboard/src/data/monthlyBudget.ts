import type { MonthlyBudget } from "../types/Cashflow";

export const initialMonthlyBudget: MonthlyBudget = {
  incomes: [
    {
      id: 1,
      name: "Kontrakt IT",
      amount: 15_000,
      recurring: true,
    },
  ],

  expenses: [
    {
      id: 1,
      name: "Mieszkanie",
      amount: 2_000,
      category: "fixed",
      recurring: true,
    },
    {
      id: 2,
      name: "Telefon",
      amount: 70,
      category: "fixed",
      recurring: true,
    },
    {
      id: 3,
      name: "Siłownia",
      amount: 150,
      category: "fixed",
      recurring: true,
    },
    {
      id: 4,
      name: "Subskrypcje",
      amount: 100,
      category: "fixed",
      recurring: true,
    },
    {
      id: 5,
      name: "Jedzenie",
      amount: 1_800,
      category: "living",
      recurring: false,
    },
    {
      id: 6,
      name: "Transport",
      amount: 600,
      category: "living",
      recurring: false,
    },
    {
      id: 7,
      name: "Rozrywka",
      amount: 500,
      category: "living",
      recurring: false,
    },
    {
      id: 8,
      name: "Inwestycje",
      amount: 2_000,
      category: "investment",
      recurring: true,
    },
    {
      id: 9,
      name: "BMW Fund",
      amount: 5_000,
      category: "goal",
      recurring: true,
    },
  ],
};