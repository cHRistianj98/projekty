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
import { FreedomEngine } from "./pages/FreedomEngine";
import { MonthlyReview } from "./pages/MonthlyReview";
import { AchievementUnlockManager } from "./features/achievements/AchievementUnlockManager";
import { upsertMonthlySnapshot } from "./features/review/monthlySnapshot";

import { initialMonthlyBudget } from "./data/monthlyBudget";
import { initialNetWorthHistory } from "./data/netWorthHistory";
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
import { goalApi } from "./api/goalApi";
import { assetApi } from "./api/assetApi";
import { authApi } from "./api/authApi";
import { Login } from "./pages/Login";
import type { Liability } from "./types/Liability";
import type { NetWorthSnapshot } from "./types/NetWorthHistory";
import type { MonthlyBudgetPlan } from "./types/Budget";
import type { MonthlySnapshot } from "./types/MonthlySnapshot";

import type {
  RecurringTransaction,
} from "./types/RecurringTransaction";

function App() {
  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const [isAuthenticated, setIsAuthenticated] = useState(() => authApi.isLoggedIn());
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => authApi.isLoggedIn());

  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    if (!authApi.getToken()) {
      setIsCheckingAuth(false);
      return;
    }

    let cancelled = false;

    async function checkAuth() {
      try {
        const user = await authApi.me();

        if (!cancelled) {
          setCurrentUserEmail(user.email);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Zapisana sesja jest nieważna:", error);
        authApi.removeToken();

        if (!cancelled) {
          setCurrentUserEmail("");
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setIsCheckingAuth(false);
      }
    }

    void checkAuth();
    return () => { cancelled = true; };
  }, []);

  async function handleLogin(email: string, password: string) {
    const response = await authApi.login(email, password);
    authApi.saveToken(response.token);

    try {
      const user = await authApi.me();
      setCurrentUserEmail(user.email);
      setIsAuthenticated(true);
    } catch (error) {
      authApi.removeToken();
      throw error;
    }
  }

  function handleLogout() {
    authApi.removeToken();
    setCurrentUserEmail("");
    setGoals([]);
    setPortfolio([]);
    setIsAuthenticated(false);
  }

  /*
   * =========================================================
   * PORTFOLIO
   * =========================================================
   */

  const [portfolio, setPortfolio] = useState<Asset[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPortfolio([]);
      return;
    }

    let cancelled = false;

    async function loadAssets() {
      try {
        const loadedAssets = await assetApi.getAll();

        if (!cancelled) {
          setPortfolio(loadedAssets);
        }
      } catch (error) {
        console.error("Nie udało się pobrać aktywów z backendu:", error);
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const totalAssets =
    calculateNetWorth(
      portfolio
    );

  async function handleAddAsset(
    asset: Asset
  ) {
    try {
      const createdAsset = await assetApi.create(asset);

      setPortfolio((current) => [
        ...current,
        createdAsset,
      ]);
    } catch (error) {
      console.error("Nie udało się dodać aktywa:", error);
      window.alert("Nie udało się zapisać aktywa w backendzie.");
    }
  }

  async function handleUpdateAsset(
    updatedAsset: Asset
  ) {
    try {
      const savedAsset = await assetApi.update(
        updatedAsset.id,
        updatedAsset
      );

      setPortfolio((current) =>
        current.map((asset) =>
          asset.id === savedAsset.id
            ? savedAsset
            : asset
        )
      );
    } catch (error) {
      console.error("Nie udało się zaktualizować aktywa:", error);
      window.alert("Nie udało się zaktualizować aktywa w backendzie.");
    }
  }

  async function handleDeleteAsset(
    id: number
  ) {
    try {
      await assetApi.remove(id);

      setPortfolio((current) =>
        current.filter((asset) => asset.id !== id)
      );
    } catch (error) {
      console.error("Nie udało się usunąć aktywa:", error);
      window.alert("Nie udało się usunąć aktywa z backendu.");
    }
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
   * GOALS — SPRING BOOT API
   * =========================================================
   */

  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setGoals([]);
      return;
    }

    let cancelled = false;

    async function loadGoals() {
      try {
        const loadedGoals = await goalApi.getAll();

        if (!cancelled) {
          setGoals(loadedGoals);
        }
      } catch (error) {
        console.error("Nie udało się pobrać celów z backendu:", error);
      }
    }

    void loadGoals();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handleAddGoal(goal: Goal) {
    try {
      const createdGoal = await goalApi.create(goal);

      setGoals((current) => [
        ...current,
        createdGoal,
      ]);
    } catch (error) {
      console.error("Nie udało się dodać celu:", error);
      window.alert("Nie udało się zapisać celu w backendzie.");
    }
  }

  async function handleUpdateGoal(updatedGoal: Goal) {
    try {
      const savedGoal = await goalApi.update(
        updatedGoal.id,
        updatedGoal
      );

      setGoals((current) =>
        current.map((goal) =>
          goal.id === savedGoal.id
            ? savedGoal
            : goal
        )
      );
    } catch (error) {
      console.error("Nie udało się zaktualizować celu:", error);
      window.alert("Nie udało się zaktualizować celu w backendzie.");
    }
  }

  async function handleDeleteGoal(id: number) {
    try {
      await goalApi.remove(id);

      setGoals((current) =>
        current.filter((goal) => goal.id !== id)
      );
    } catch (error) {
      console.error("Nie udało się usunąć celu:", error);
      window.alert("Nie udało się usunąć celu z backendu.");
    }
  }

  /*
   * =========================================================
   * MONTHLY REVIEW SNAPSHOTS
   * =========================================================
   */

  const [
    monthlySnapshots,
    setMonthlySnapshots,
  ] = useState<MonthlySnapshot[]>(() => {
    const saved = localStorage.getItem(
      "freedom-monthly-snapshots"
    );

    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(
      "freedom-monthly-snapshots",
      JSON.stringify(monthlySnapshots)
    );
  }, [monthlySnapshots]);

  function handleCloseMonth(
    snapshot: MonthlySnapshot
  ) {
    setMonthlySnapshots((current) =>
      upsertMonthlySnapshot(
        current,
        snapshot
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
   * DEV DEMO DATA
   * =========================================================
   */

  async function handleLoadDemoData() {
    const shouldLoad = window.confirm(
      "Załadować dane demo? Obecne dane finansowe zostaną zastąpione."
    );

    if (!shouldLoad) {
      return;
    }

    try {
      await Promise.all(
        goals.map((goal) => goalApi.remove(goal.id))
      );

      await Promise.all(
        portfolio.map((asset) => assetApi.remove(asset.id))
      );

      const createdDemoGoals = await Promise.all(
        demoGoals.map((goal) => goalApi.create(goal))
      );

      const createdDemoPortfolio = await Promise.all(
        demoPortfolio.map((asset) => assetApi.create(asset))
      );

      setPortfolio(createdDemoPortfolio);
      setLiabilities(demoLiabilities);
      setGoals(createdDemoGoals);
      setMonthlyBudget(demoMonthlyBudget);
      setNetWorthHistory(demoNetWorthHistory);
      setMonthlySnapshots([]);
      setRecurringTransactions(demoRecurringTransactions);

      // Budget plans zostawiamy puste w demo, żeby nie mieszać planu z realnym cashflow.
      setBudgetPlans([]);

      window.alert(
        "Dane demo załadowane. Cele i aktywa zostały zapisane w PostgreSQL."
      );
    } catch (error) {
      console.error("Nie udało się załadować danych demo:", error);
      window.alert("Nie udało się załadować danych demo.");
    }
  }

  /*
   * =========================================================
   * ROUTING
   * =========================================================
   */

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b16] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-400" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Initializing Freedom</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
          netWorth={netWorth}
          portfolio={portfolio}
          goals={goals}
          liabilities={liabilities}
          monthlyBudget={monthlyBudget}
          userEmail={currentUserEmail}
          onLogout={handleLogout}
        />

        <button
          type="button"
          onClick={handleLoadDemoData}
          className="
            fixed
            bottom-5
            right-5
            z-[90]
            rounded-2xl
            border
            border-violet-500/30
            bg-violet-500/15
            px-4
            py-3
            text-xs
            font-black
            uppercase
            tracking-[0.12em]
            text-violet-300
            shadow-2xl
            backdrop-blur
            transition
            hover:bg-violet-500/25
          "
          title="Zastąp obecne dane zestawem testowym"
        >
          DEV: Load demo data
        </button>

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
                  monthlySnapshots={
                    monthlySnapshots
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
  path="/review"
  element={
    <MonthlyReview
      netWorth={netWorth}
      portfolio={portfolio}
      goals={goals}
      liabilities={liabilities}
      monthlyBudget={monthlyBudget}
      netWorthHistory={netWorthHistory}
      monthlySnapshots={monthlySnapshots}
      onCloseMonth={handleCloseMonth}
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
  path="/freedom"
  element={
    <FreedomEngine
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
 * DEMO DATASET 1.0
 * =========================================================
 *
 * Profil testowy:
 * - 295 000 zł aktywów
 * - 32 000 zł zobowiązań
 * - ok. 263 000 zł net worth
 * - 42 000 zł płynnej poduszki
 * - 6 miesięcy historii
 * - dodatni, ale nie absurdalny cashflow
 */

const demoPortfolio: Asset[] = [
  {
    id: 91001,
    name: "Konto oszczędnościowe",
    value: 42_000,
    color: "#3b82f6",
    category: "cash",
  },
  {
    id: 91002,
    name: "ETF MSCI World",
    value: 135_000,
    color: "#10b981",
    category: "stocks",
  },
  {
    id: 91003,
    name: "Obligacje skarbowe",
    value: 30_000,
    color: "#f59e0b",
    category: "stocks",
  },
  {
    id: 91004,
    name: "Bitcoin",
    value: 28_000,
    color: "#f97316",
    category: "crypto",
  },
  {
    id: 91005,
    name: "Ethereum",
    value: 17_000,
    color: "#6366f1",
    category: "crypto",
  },
  {
    id: 91006,
    name: "Kapitał w biznesie",
    value: 18_000,
    color: "#8b5cf6",
    category: "business",
  },
  {
    id: 91007,
    name: "Samochód",
    value: 25_000,
    color: "#64748b",
    category: "vehicle",
  },
];

const demoLiabilities: Liability[] = [
  {
    id: 92001,
    name: "Kredyt gotówkowy",
    originalAmount: 45_000,
    remainingAmount: 24_000,
    monthlyPayment: 1_350,
    principalPayment: 1_170,
    interestPayment: 180,
    interestRate: 8.9,
  },
  {
    id: 92002,
    name: "Raty 0% — elektronika",
    originalAmount: 12_000,
    remainingAmount: 8_000,
    monthlyPayment: 1_000,
    principalPayment: 1_000,
    interestPayment: 0,
    interestRate: 0,
  },
];

const demoGoals: Goal[] = [
  {
    id: 93001,
    name: "BMW / fundusz samochodowy",
    currentAmount: 28_000,
    targetAmount: 100_000,
    monthlyContribution: 2_000,
    targetDate: "2028-06-01",
    color: "#3b82f6",
  },
  {
    id: 93002,
    name: "Wkład własny na dom",
    currentAmount: 45_000,
    targetAmount: 250_000,
    monthlyContribution: 3_000,
    targetDate: "2030-12-01",
    color: "#10b981",
  },
  {
    id: 93003,
    name: "Poduszka 50K",
    currentAmount: 42_000,
    targetAmount: 50_000,
    monthlyContribution: 1_000,
    targetDate: "2027-03-01",
    color: "#f59e0b",
  },
];

const demoMonthlyBudget: MonthlyBudget = {
  incomes: [
    { id: 94001, name: "Praca / B2B", amount: 15_000, recurring: true, date: "2026-04-10", recurringRuleId: 96001 },
    { id: 94002, name: "Praca / B2B", amount: 15_000, recurring: true, date: "2026-05-10", recurringRuleId: 96001 },
    { id: 94003, name: "Praca / B2B", amount: 15_000, recurring: true, date: "2026-06-10", recurringRuleId: 96001 },
    { id: 94004, name: "Praca / B2B", amount: 16_000, recurring: true, date: "2026-07-10", recurringRuleId: 96001 },
    { id: 94005, name: "Praca / B2B", amount: 16_000, recurring: true, date: "2026-08-10", recurringRuleId: 96001 },
    { id: 94006, name: "Praca / B2B", amount: 16_000, recurring: true, date: "2026-09-10", recurringRuleId: 96001 },
    { id: 94007, name: "Premia / dodatkowe zlecenie", amount: 3_500, recurring: false, date: "2026-06-22" },
    { id: 94008, name: "Dodatkowe zlecenie", amount: 2_500, recurring: false, date: "2026-09-18" },
  ],
  expenses: [
    { id: 95001, name: "Mieszkanie", amount: 2_400, category: "fixed", recurring: true, date: "2026-04-05", recurringRuleId: 96002 },
    { id: 95002, name: "Jedzenie", amount: 1_850, category: "living", recurring: false, date: "2026-04-18" },
    { id: 95003, name: "Transport", amount: 850, category: "living", recurring: false, date: "2026-04-24" },
    { id: 95004, name: "Rata kredytu", amount: 1_350, category: "fixed", recurring: true, date: "2026-04-15", recurringRuleId: 96003 },
    { id: 95005, name: "Rozrywka / inne", amount: 900, category: "living", recurring: false, date: "2026-04-27" },

    { id: 95006, name: "Mieszkanie", amount: 2_400, category: "fixed", recurring: true, date: "2026-05-05", recurringRuleId: 96002 },
    { id: 95007, name: "Jedzenie", amount: 1_950, category: "living", recurring: false, date: "2026-05-18" },
    { id: 95008, name: "Transport", amount: 780, category: "living", recurring: false, date: "2026-05-24" },
    { id: 95009, name: "Rata kredytu", amount: 1_350, category: "fixed", recurring: true, date: "2026-05-15", recurringRuleId: 96003 },
    { id: 95010, name: "Zakupy / inne", amount: 1_020, category: "living", recurring: false, date: "2026-05-27" },

    { id: 95011, name: "Mieszkanie", amount: 2_400, category: "fixed", recurring: true, date: "2026-06-05", recurringRuleId: 96002 },
    { id: 95012, name: "Jedzenie", amount: 2_050, category: "living", recurring: false, date: "2026-06-18" },
    { id: 95013, name: "Transport", amount: 900, category: "living", recurring: false, date: "2026-06-24" },
    { id: 95014, name: "Rata kredytu", amount: 1_350, category: "fixed", recurring: true, date: "2026-06-15", recurringRuleId: 96003 },
    { id: 95015, name: "Wyjazd", amount: 1_600, category: "living", recurring: false, date: "2026-06-27" },

    { id: 95016, name: "Mieszkanie", amount: 2_400, category: "fixed", recurring: true, date: "2026-07-05", recurringRuleId: 96002 },
    { id: 95017, name: "Jedzenie", amount: 1_900, category: "living", recurring: false, date: "2026-07-18" },
    { id: 95018, name: "Transport", amount: 820, category: "living", recurring: false, date: "2026-07-24" },
    { id: 95019, name: "Rata kredytu", amount: 1_350, category: "fixed", recurring: true, date: "2026-07-15", recurringRuleId: 96003 },
    { id: 95020, name: "Sport / rozrywka", amount: 1_130, category: "living", recurring: false, date: "2026-07-27" },

    { id: 95021, name: "Mieszkanie", amount: 2_400, category: "fixed", recurring: true, date: "2026-08-05", recurringRuleId: 96002 },
    { id: 95022, name: "Jedzenie", amount: 2_100, category: "living", recurring: false, date: "2026-08-18" },
    { id: 95023, name: "Transport", amount: 880, category: "living", recurring: false, date: "2026-08-24" },
    { id: 95024, name: "Rata kredytu", amount: 1_350, category: "fixed", recurring: true, date: "2026-08-15", recurringRuleId: 96003 },
    { id: 95025, name: "Wyjazdy / inne", amount: 1_370, category: "living", recurring: false, date: "2026-08-27" },

    { id: 95026, name: "Mieszkanie", amount: 2_400, category: "fixed", recurring: true, date: "2026-09-05", recurringRuleId: 96002 },
    { id: 95027, name: "Jedzenie", amount: 2_000, category: "living", recurring: false, date: "2026-09-18" },
    { id: 95028, name: "Transport", amount: 900, category: "living", recurring: false, date: "2026-09-24" },
    { id: 95029, name: "Rata kredytu", amount: 1_350, category: "fixed", recurring: true, date: "2026-09-15", recurringRuleId: 96003 },
    { id: 95030, name: "Sport / rozrywka", amount: 1_250, category: "living", recurring: false, date: "2026-09-26" },
  ],
};

const demoNetWorthHistory: NetWorthSnapshot[] = [
  { id: 97001, date: "2026-04-30", value: 208_000 },
  { id: 97002, date: "2026-05-31", value: 216_500 },
  { id: 97003, date: "2026-06-30", value: 228_000 },
  { id: 97004, date: "2026-07-31", value: 239_500 },
  { id: 97005, date: "2026-08-31", value: 251_000 },
  { id: 97006, date: "2026-09-27", value: 263_000 },
];

const demoRecurringTransactions: RecurringTransaction[] = [
  {
    id: 96001,
    type: "income",
    name: "Praca / B2B",
    amount: 16_000,
    dayOfMonth: 10,
    startDate: "2026-04-10",
    active: true,
  },
  {
    id: 96002,
    type: "expense",
    name: "Mieszkanie",
    amount: 2_400,
    category: "fixed",
    dayOfMonth: 5,
    startDate: "2026-04-05",
    active: true,
  },
  {
    id: 96003,
    type: "expense",
    name: "Rata kredytu",
    amount: 1_350,
    category: "fixed",
    dayOfMonth: 15,
    startDate: "2026-04-15",
    active: true,
  },
];

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