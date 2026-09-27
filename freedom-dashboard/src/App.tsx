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
import { Simulator } from "./pages/Simulator";
import { Dashboard } from "./pages/Dashboard";
import { Finances } from "./pages/Finances";
import { Investments } from "./pages/Investments";
import { Goals } from "./pages/Goals";
import { Liabilities } from "./pages/Liabilities";
import { Budget } from "./pages/Budget";
import { Analytics } from "./pages/Analytics";
import { Achievements } from "./pages/Achievements";
import { AchievementUnlockManager } from "./features/achievements/AchievementUnlockManager";

import { initialMonthlyBudget } from "./data/monthlyBudget";
import { initialPortfolio } from "./data/portfolio";
import { initialNetWorthHistory } from "./data/netWorthHistory";
import { initialGoals } from "./data/goals";
import { initialLiabilities } from "./data/liabilities";
import { initialBudgetPlans } from "./data/budgetPlans";
import { initialRecurringTransactions } from "./data/recurringTransactions";

import { calculateNetWorth } from "./utils/portfolio";
import { calculateTotalLiabilities } from "./utils/liabilities";

import type {
  Expense,
  Income,
  MonthlyBudget,
} from "./types/Cashflow";

import type { Asset } from "./types/Asset";
import type { Goal } from "./types/Goal";
import type { Liability } from "./types/Liability";
import type { NetWorthSnapshot } from "./types/NetWorthHistory";
import type { MonthlyBudgetPlan } from "./types/Budget";

import type {
  RecurringTransaction,
} from "./types/RecurringTransaction";

function App() {
  /*
   * =========================================================
   * PORTFOLIO
   * =========================================================
   */

  const [
    portfolio,
    setPortfolio,
  ] = useState<Asset[]>(() => {
    const saved =
      localStorage.getItem(
        "freedom-portfolio"
      );

    return saved
      ? JSON.parse(saved)
      : initialPortfolio;
  });

  useEffect(() => {
    localStorage.setItem(
      "freedom-portfolio",
      JSON.stringify(portfolio)
    );
  }, [portfolio]);

  const totalAssets =
    calculateNetWorth(
      portfolio
    );

  function handleAddAsset(
    asset: Asset
  ) {
    setPortfolio((current) => [
      ...current,
      asset,
    ]);
  }

  function handleUpdateAsset(
    updatedAsset: Asset
  ) {
    setPortfolio((current) =>
      current.map((asset) =>
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
    setPortfolio((current) =>
      current.filter(
        (asset) =>
          asset.id !== id
      )
    );
  }

  /*
   * =========================================================
   * LIABILITIES
   * =========================================================
   */

  const [
    liabilities,
    setLiabilities,
  ] = useState<Liability[]>(() => {
    const saved =
      localStorage.getItem(
        "freedom-liabilities"
      );

    return saved
      ? JSON.parse(saved)
      : initialLiabilities;
  });

  useEffect(() => {
    localStorage.setItem(
      "freedom-liabilities",
      JSON.stringify(
        liabilities
      )
    );
  }, [liabilities]);

  function handleAddLiability(
    liability: Liability
  ) {
    setLiabilities(
      (current) => [
        ...current,
        liability,
      ]
    );
  }

  function handleUpdateLiability(
    updatedLiability: Liability
  ) {
    setLiabilities(
      (current) =>
        current.map(
          (liability) =>
            liability.id ===
            updatedLiability.id
              ? updatedLiability
              : liability
        )
    );
  }

  function handleDeleteLiability(
    id: number
  ) {
    setLiabilities(
      (current) =>
        current.filter(
          (liability) =>
            liability.id !== id
        )
    );
  }

  const totalLiabilities =
    calculateTotalLiabilities(
      liabilities
    );

  const netWorth =
    totalAssets -
    totalLiabilities;

  /*
   * =========================================================
   * GOALS
   * =========================================================
   */

  const [
    goals,
    setGoals,
  ] = useState<Goal[]>(() => {
    const saved =
      localStorage.getItem(
        "freedom-goals"
      );

    return saved
      ? JSON.parse(saved)
      : initialGoals;
  });

  useEffect(() => {
    localStorage.setItem(
      "freedom-goals",
      JSON.stringify(goals)
    );
  }, [goals]);

  function handleAddGoal(
    goal: Goal
  ) {
    setGoals((current) => [
      ...current,
      goal,
    ]);
  }

  function handleUpdateGoal(
    updatedGoal: Goal
  ) {
    setGoals((current) =>
      current.map((goal) =>
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
    setGoals((current) =>
      current.filter(
        (goal) =>
          goal.id !== id
      )
    );
  }

  /*
   * =========================================================
   * NET WORTH HISTORY
   * =========================================================
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
      new Date()
        .toLocaleDateString(
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
   * =========================================================
   * CASHFLOW
   * =========================================================
   */

  const [
    monthlyBudget,
    setMonthlyBudget,
  ] =
    useState<MonthlyBudget>(
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

  /*
   * =========================================================
   * RECURRING TRANSACTIONS
   * =========================================================
   */

  const [
    recurringTransactions,
    setRecurringTransactions,
  ] = useState<
    RecurringTransaction[]
  >(() => {
    const saved =
      localStorage.getItem(
        "freedom-recurring-transactions"
      );

    return saved
      ? JSON.parse(saved)
      : initialRecurringTransactions;
  });

  useEffect(() => {
    localStorage.setItem(
      "freedom-recurring-transactions",
      JSON.stringify(
        recurringTransactions
      )
    );
  }, [
    recurringTransactions,
  ]);

  /*
   * =========================================================
   * EXPENSE CRUD
   * =========================================================
   */

  function handleAddExpense(
    expense: Expense
  ) {
    /*
     * Jeżeli transakcja ma recurringRuleId,
     * oznacza to, że księgujemy ISTNIEJĄCĄ
     * regułę cykliczną.
     *
     * Nie wolno wtedy tworzyć kolejnej reguły.
     */
    if (
      expense.recurringRuleId !==
      undefined
    ) {
      setMonthlyBudget(
        (current) => ({
          ...current,

          expenses: [
            ...current.expenses,
            {
              ...expense,

              id:
                createTransactionId(),
            },
          ],
        })
      );

      return;
    }

    /*
     * Zwykły jednorazowy wydatek.
     */
    if (!expense.recurring) {
      setMonthlyBudget(
        (current) => ({
          ...current,

          expenses: [
            ...current.expenses,
            {
              ...expense,

              id:
                createTransactionId(),
            },
          ],
        })
      );

      return;
    }

    /*
     * NOWY wydatek cykliczny.
     *
     * Tworzymy:
     * 1. konkretną transakcję,
     * 2. regułę cykliczną,
     * 3. spinamy je recurringRuleId.
     */

    const transactionId =
      createTransactionId();

    const ruleId =
      createRuleId();

    const dayOfMonth =
      getDayFromDate(
        expense.date
      );

    const newExpense: Expense = {
      ...expense,

      id: transactionId,

      recurring: true,

      recurringRuleId:
        ruleId,
    };

    const newRule:
      RecurringTransaction = {
      id: ruleId,

      type: "expense",

      name:
        expense.name,

      amount:
        expense.amount,

      category:
        expense.category,

      dayOfMonth,

      startDate:
        expense.date,

      active: true,
    };

    setMonthlyBudget(
      (current) => ({
        ...current,

        expenses: [
          ...current.expenses,
          newExpense,
        ],
      })
    );

    setRecurringTransactions(
      (current) => [
        ...current,
        newRule,
      ]
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
    /*
     * Edytujemy tylko konkretną
     * zaksięgowaną transakcję.
     *
     * Reguła cykliczna pozostaje bez zmian.
     */
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

  /*
   * =========================================================
   * INCOME CRUD
   * =========================================================
   */

  function handleAddIncome(
    income: Income
  ) {
    /*
     * Księgowanie istniejącej reguły.
     */
    if (
      income.recurringRuleId !==
      undefined
    ) {
      setMonthlyBudget(
        (current) => ({
          ...current,

          incomes: [
            ...current.incomes,
            {
              ...income,

              id:
                createTransactionId(),
            },
          ],
        })
      );

      return;
    }

    /*
     * Jednorazowy przychód.
     */
    if (!income.recurring) {
      setMonthlyBudget(
        (current) => ({
          ...current,

          incomes: [
            ...current.incomes,
            {
              ...income,

              id:
                createTransactionId(),
            },
          ],
        })
      );

      return;
    }

    /*
     * NOWY przychód cykliczny.
     */

    const transactionId =
      createTransactionId();

    const ruleId =
      createRuleId();

    const dayOfMonth =
      getDayFromDate(
        income.date
      );

    const newIncome: Income = {
      ...income,

      id: transactionId,

      recurring: true,

      recurringRuleId:
        ruleId,
    };

    const newRule:
      RecurringTransaction = {
      id: ruleId,

      type: "income",

      name:
        income.name,

      amount:
        income.amount,

      dayOfMonth,

      startDate:
        income.date,

      active: true,
    };

    setMonthlyBudget(
      (current) => ({
        ...current,

        incomes: [
          ...current.incomes,
          newIncome,
        ],
      })
    );

    setRecurringTransactions(
      (current) => [
        ...current,
        newRule,
      ]
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

  function handleUpdateIncome(
    updatedIncome: Income
  ) {
    /*
     * Edycja transakcji nie zmienia
     * automatycznie reguły.
     */
    setMonthlyBudget(
      (current) => ({
        ...current,

        incomes:
          current.incomes.map(
            (income) =>
              income.id ===
              updatedIncome.id
                ? updatedIncome
                : income
          ),
      })
    );
  }

  /*
   * =========================================================
   * RECURRING CRUD
   * =========================================================
   */

  function handleAddRecurringTransaction(
    rule: RecurringTransaction
  ) {
    setRecurringTransactions(
      (current) => [
        ...current,
        rule,
      ]
    );
  }

  function handleUpdateRecurringTransaction(
    updatedRule:
      RecurringTransaction
  ) {
    /*
     * Zmieniamy tylko regułę.
     *
     * Już zaksięgowane historyczne
     * transakcje pozostają bez zmian.
     */
    setRecurringTransactions(
      (current) =>
        current.map(
          (rule) =>
            rule.id ===
            updatedRule.id
              ? updatedRule
              : rule
        )
    );
  }

  function handleToggleRecurringTransaction(
    id: number
  ) {
    setRecurringTransactions(
      (current) =>
        current.map(
          (rule) =>
            rule.id === id
              ? {
                  ...rule,

                  active:
                    !rule.active,
                }
              : rule
        )
    );
  }

  function handleDeleteRecurringTransaction(
    id: number
  ) {
    /*
     * Usuwamy tylko regułę.
     *
     * Historyczne zaksięgowane
     * transakcje zostają.
     */
    setRecurringTransactions(
      (current) =>
        current.filter(
          (rule) =>
            rule.id !== id
        )
    );
  }

  /*
   * =========================================================
   * BUDGET PLANS
   * =========================================================
   */

  const [
    budgetPlans,
    setBudgetPlans,
  ] = useState<
    MonthlyBudgetPlan[]
  >(() => {
    const saved =
      localStorage.getItem(
        "freedom-budget-plans"
      );

    return saved
      ? JSON.parse(saved)
      : initialBudgetPlans;
  });

  useEffect(() => {
    localStorage.setItem(
      "freedom-budget-plans",
      JSON.stringify(
        budgetPlans
      )
    );
  }, [budgetPlans]);

  function handleSaveBudgetPlan(
    plan: MonthlyBudgetPlan
  ) {
    setBudgetPlans(
      (current) => {
        const alreadyExists =
          current.some(
            (existingPlan) =>
              existingPlan.month ===
              plan.month
          );

        if (alreadyExists) {
          return current.map(
            (existingPlan) =>
              existingPlan.month ===
              plan.month
                ? plan
                : existingPlan
          );
        }

        return [
          ...current,
          plan,
        ];
      }
    );
  }

  const [
    selectedBudgetMonth,
    setSelectedBudgetMonth,
  ] = useState(() =>
    getCurrentMonth()
  );

  /*
   * =========================================================
   * ROUTING
   * =========================================================
   */

  return (
    <BrowserRouter>
      <AchievementUnlockManager
        netWorth={netWorth}
        portfolio={portfolio}
        goals={goals}
        liabilities={liabilities}
        monthlyBudget={monthlyBudget}
      />
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
                  liabilities={
                    liabilities
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
                  recurringTransactions={
                    recurringTransactions
                  }
                  onAddIncome={
                    handleAddIncome
                  }
                  onDeleteIncome={
                    handleDeleteIncome
                  }
                  onUpdateIncome={
                    handleUpdateIncome
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
                  onAddRecurringTransaction={
                    handleAddRecurringTransaction
                  }
                  onUpdateRecurringTransaction={
                    handleUpdateRecurringTransaction
                  }
                  onToggleRecurringTransaction={
                    handleToggleRecurringTransaction
                  }
                  onDeleteRecurringTransaction={
                    handleDeleteRecurringTransaction
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
              path="/liabilities"
              element={
                <Liabilities
                  liabilities={
                    liabilities
                  }
                  onAddLiability={
                    handleAddLiability
                  }
                  onUpdateLiability={
                    handleUpdateLiability
                  }
                  onDeleteLiability={
                    handleDeleteLiability
                  }
                />
              }
            />

            <Route
              path="/budget"
              element={
                <Budget
                  budget={
                    monthlyBudget
                  }
                  budgetPlans={
                    budgetPlans
                  }
                  selectedMonth={
                    selectedBudgetMonth
                  }
                  onChangeMonth={
                    setSelectedBudgetMonth
                  }
                  onSavePlan={
                    handleSaveBudgetPlan
                  }
                />
              }
            />

            <Route
  path="/analytics"
  element={
    <Analytics
      monthlyBudget={
        monthlyBudget
      }
      netWorthHistory={
        netWorthHistory
      }
      netWorth={
        netWorth
      }
    />
  }
/>

<Route
  path="/achievements"
  element={
    <Achievements
      netWorth={netWorth}
      portfolio={portfolio}
      goals={goals}
      liabilities={liabilities}
      monthlyBudget={monthlyBudget}
    />
  }
/>

<Route
  path="/simulator"
  element={
    <Simulator
      netWorth={netWorth}
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

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getDayFromDate(
  date: string
) {
  const day =
    Number(
      date.split("-")[2]
    );

  return day;
}

function getCurrentMonth() {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

/*
 * Date.now() samo w sobie jest prawie
 * wystarczające, ale oddzielamy przestrzeń
 * ID transakcji i reguł.
 */

function createTransactionId() {
  return (
    Date.now() * 10 +
    Math.floor(
      Math.random() * 5
    )
  );
}

function createRuleId() {
  return (
    Date.now() * 10 +
    5 +
    Math.floor(
      Math.random() * 5
    )
  );
}

export default App;