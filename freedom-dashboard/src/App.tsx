import {
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";

import { Dashboard } from "./pages/Dashboard";
import { Finances } from "./pages/Finances";
import { Investments } from "./pages/Investments";
import { Goals } from "./pages/Goals";

import { initialMonthlyBudget } from "./data/monthlyBudget";
import { initialPortfolio } from "./data/portfolio";
import { initialNetWorthHistory } from "./data/netWorthHistory";
import { initialGoals } from "./data/goals";

import { calculateNetWorth } from "./utils/portfolio";

import type {
  Expense,
  Income,
  MonthlyBudget,
} from "./types/Cashflow";

import type { Asset } from "./types/Asset";
import type { Goal } from "./types/Goal";
import type { NetWorthSnapshot } from "./types/NetWorthHistory";

function App() {
  /*
   * =========================
   * PORTFOLIO
   * =========================
   */

  const [
    portfolio,
    setPortfolio,
  ] = useState<Asset[]>(
    () => {
      const saved =
        localStorage.getItem(
          "freedom-portfolio"
        );

      return saved
        ? JSON.parse(saved)
        : initialPortfolio;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      "freedom-portfolio",
      JSON.stringify(
        portfolio
      )
    );
  }, [portfolio]);

  const netWorth =
    calculateNetWorth(
      portfolio
    );

  function handleAddAsset(
    asset: Asset
  ) {
    setPortfolio(
      (current) => [
        ...current,
        asset,
      ]
    );
  }

  function handleUpdateAsset(
    updatedAsset: Asset
  ) {
    setPortfolio(
      (current) =>
        current.map(
          (asset) =>
            asset.id ===
            updatedAsset.id
              ? updatedAsset
              : asset
        )
    );
  }

  function handleDeleteAsset(
    id: number
  ) {
    setPortfolio(
      (current) =>
        current.filter(
          (asset) =>
            asset.id !== id
        )
    );
  }

  /*
   * =========================
   * GOALS
   * =========================
   */

  const [
    goals,
    setGoals,
  ] = useState<Goal[]>(
    () => {
      const saved =
        localStorage.getItem(
          "freedom-goals"
        );

      return saved
        ? JSON.parse(saved)
        : initialGoals;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      "freedom-goals",
      JSON.stringify(goals)
    );
  }, [goals]);

  function handleAddGoal(
    goal: Goal
  ) {
    setGoals(
      (current) => [
        ...current,
        goal,
      ]
    );
  }

  function handleUpdateGoal(
    updatedGoal: Goal
  ) {
    setGoals(
      (current) =>
        current.map(
          (goal) =>
            goal.id ===
            updatedGoal.id
              ? updatedGoal
              : goal
        )
    );
  }

  function handleDeleteGoal(
    id: number
  ) {
    setGoals(
      (current) =>
        current.filter(
          (goal) =>
            goal.id !== id
        )
    );
  }

  /*
   * =========================
   * NET WORTH HISTORY
   * =========================
   */

  const [
    netWorthHistory,
    setNetWorthHistory,
  ] = useState<
    NetWorthSnapshot[]
  >(() => {
    const saved =
      localStorage.getItem(
        "freedom-net-worth-history"
      );

    return saved
      ? JSON.parse(saved)
      : initialNetWorthHistory;
  });

  useEffect(() => {
    const today =
      new Date().toLocaleDateString(
        "sv-SE"
      );

    setNetWorthHistory(
      (currentHistory) => {
        const existing =
          currentHistory.find(
            (snapshot) =>
              snapshot.date ===
              today
          );

        if (existing) {
          return currentHistory.map(
            (snapshot) =>
              snapshot.date ===
              today
                ? {
                    ...snapshot,
                    value:
                      netWorth,
                  }
                : snapshot
          );
        }

        return [
          ...currentHistory,
          {
            id: Date.now(),
            date: today,
            value: netWorth,
          },
        ];
      }
    );
  }, [netWorth]);

  useEffect(() => {
    localStorage.setItem(
      "freedom-net-worth-history",
      JSON.stringify(
        netWorthHistory
      )
    );
  }, [netWorthHistory]);

  /*
   * =========================
   * MONTHLY BUDGET
   * =========================
   */

  const [
    monthlyBudget,
    setMonthlyBudget,
  ] = useState<MonthlyBudget>(
    () => {
      const saved =
        localStorage.getItem(
          "freedom-budget"
        );

      return saved
        ? JSON.parse(saved)
        : initialMonthlyBudget;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      "freedom-budget",
      JSON.stringify(
        monthlyBudget
      )
    );
  }, [monthlyBudget]);

  function handleAddExpense(
    expense: Expense
  ) {
    setMonthlyBudget(
      (current) => ({
        ...current,
        expenses: [
          ...current.expenses,
          expense,
        ],
      })
    );
  }

  function handleDeleteExpense(
    id: number
  ) {
    setMonthlyBudget(
      (current) => ({
        ...current,
        expenses:
          current.expenses.filter(
            (expense) =>
              expense.id !== id
          ),
      })
    );
  }

  function handleUpdateExpense(
    updatedExpense: Expense
  ) {
    setMonthlyBudget(
      (current) => ({
        ...current,
        expenses:
          current.expenses.map(
            (expense) =>
              expense.id ===
              updatedExpense.id
                ? updatedExpense
                : expense
          ),
      })
    );
  }

  function handleAddIncome(
    income: Income
  ) {
    setMonthlyBudget(
      (current) => ({
        ...current,
        incomes: [
          ...current.incomes,
          income,
        ],
      })
    );
  }

  function handleDeleteIncome(
    id: number
  ) {
    setMonthlyBudget(
      (current) => ({
        ...current,
        incomes:
          current.incomes.filter(
            (income) =>
              income.id !== id
          ),
      })
    );
  }

  /*
   * =========================
   * ROUTER
   * =========================
   */

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050b16] text-white">
        <Sidebar
          netWorth={
            netWorth
          }
        />

        <div className="ml-64">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  netWorth={
                    netWorth
                  }
                  portfolio={
                    portfolio
                  }
                  goals={
                    goals
                  }
                  netWorthHistory={
                    netWorthHistory
                  }
                  monthlyBudget={
                    monthlyBudget
                  }
                  onAddExpense={
                    handleAddExpense
                  }
                />
              }
            />

            <Route
              path="/finances"
              element={
                <Finances
                  budget={
                    monthlyBudget
                  }
                  onAddIncome={
                    handleAddIncome
                  }
                  onDeleteIncome={
                    handleDeleteIncome
                  }
                  onAddExpense={
                    handleAddExpense
                  }
                  onDeleteExpense={
                    handleDeleteExpense
                  }
                  onUpdateExpense={
                    handleUpdateExpense
                  }
                />
              }
            />

            <Route
              path="/investments"
              element={
                <Investments
                  portfolio={
                    portfolio
                  }
                  onAddAsset={
                    handleAddAsset
                  }
                  onUpdateAsset={
                    handleUpdateAsset
                  }
                  onDeleteAsset={
                    handleDeleteAsset
                  }
                />
              }
            />

            <Route
              path="/goals"
              element={
                <Goals
                  goals={goals}
                  onAddGoal={
                    handleAddGoal
                  }
                  onUpdateGoal={
                    handleUpdateGoal
                  }
                  onDeleteGoal={
                    handleDeleteGoal
                  }
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;