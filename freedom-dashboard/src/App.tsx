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
import { FinancialTimeline } from "./pages/FinancialTimeline";
import { AchievementUnlockManager } from "./features/achievements/AchievementUnlockManager";


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
import { marketPriceApi } from "./api/marketPriceApi";
import { goalAllocationApi } from "./api/goalAllocationApi";
import { liabilityApi } from "./api/liabilityApi";
import { authApi } from "./api/authApi";
import { transactionApi } from "./api/transactionApi";
import { recurringTransactionApi } from "./api/recurringTransactionApi";
import { budgetApi } from "./api/budgetApi";
import { monthlySnapshotApi } from "./api/monthlySnapshotApi";
import { netWorthHistoryApi } from "./api/netWorthHistoryApi";
import { Login } from "./pages/Login";
import type { Liability } from "./types/Liability";
import type { NetWorthSnapshot } from "./types/NetWorthHistory";
import type { MonthlyBudgetPlan } from "./types/Budget";
import type { MonthlySnapshot } from "./types/MonthlySnapshot";
import { loadSyntheticDemoData } from "./dev/demoData";

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
    setLiabilities([]);
    setMonthlyBudget({ incomes: [], expenses: [] });
    setRecurringTransactions([]);
    setBudgetPlans([]);
    setMonthlySnapshots([]);
    setNetWorthHistory([]);
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

    async function refreshAssetsWithMarketPrices() {
      try {
        await marketPriceApi.refreshMetalAssets();
      } catch (marketError) {
        console.warn("Nie udało się odświeżyć notowań metali, zostawiam ostatnie zapisane wartości:", marketError);
      }

      try {
        const loadedAssets = await marketPriceApi.refreshCryptoAssets();
        if (!cancelled) setPortfolio(loadedAssets);
      } catch (cryptoError) {
        console.warn("Nie udało się odświeżyć notowań krypto, używam ostatnich zapisanych wartości:", cryptoError);
        try {
          const loadedAssets = await assetApi.getAll();
          if (!cancelled) setPortfolio(loadedAssets);
        } catch (error) {
          console.error("Nie udało się pobrać aktywów z backendu:", error);
        }
      }

      try {
        const loadedAssets = await marketPriceApi.refreshStockAssets();
        if (!cancelled) setPortfolio(loadedAssets);
      } catch (stockError) {
        console.warn("Nie udało się odświeżyć notowań akcji/ETF, używam ostatnich zapisanych wartości:", stockError);
      }
    }

    void refreshAssetsWithMarketPrices();
    const timer = window.setInterval(() => {
      void refreshAssetsWithMarketPrices();
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function refreshFxCashPrices() {
      try {
        const loadedAssets = await marketPriceApi.refreshFxAssets();
        if (!cancelled) setPortfolio(loadedAssets);
      } catch (error) {
        console.warn("Nie udało się odświeżyć kursów walut NBP; zostawiam ostatnie zapisane wartości:", error);
      }
    }

    void refreshFxCashPrices();
    const timer = window.setInterval(() => {
      void refreshFxCashPrices();
    }, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function refreshRealEstatePrices() {
      try {
        const loadedAssets = await marketPriceApi.refreshRealEstateAssets();
        if (!cancelled) setPortfolio(loadedAssets);
      } catch (error) {
        console.warn("Nie udało się odświeżyć wycen nieruchomości; zostawiam ostatnie zapisane wartości:", error);
      }
    }

    void refreshRealEstatePrices();
    const timer = window.setInterval(() => {
      void refreshRealEstatePrices();
    }, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  async function refreshPortfolio() {
    const loadedAssets = await assetApi.getAll();
    setPortfolio(loadedAssets);
  }

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
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  /*
   * =========================================================
   * LIABILITIES — SPRING BOOT API
   * =========================================================
   */

  const [liabilities, setLiabilities] = useState<Liability[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLiabilities([]);
      return;
    }

    let cancelled = false;

    async function loadLiabilities() {
      try {
        const loadedLiabilities = await liabilityApi.getAll();

        if (!cancelled) {
          setLiabilities(loadedLiabilities);
        }
      } catch (error) {
        console.error("Nie udało się pobrać zobowiązań z backendu:", error);
      }
    }

    void loadLiabilities();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handleAddLiability(liability: Liability) {
    try {
      const createdLiability = await liabilityApi.create(liability);

      setLiabilities((current) => [
        ...current,
        createdLiability,
      ]);
    } catch (error) {
      console.error("Nie udało się dodać zobowiązania:", error);
      window.alert("Nie udało się zapisać zobowiązania w backendzie.");
    }
  }

  async function handleUpdateLiability(updatedLiability: Liability) {
    try {
      const savedLiability = await liabilityApi.update(
        updatedLiability.id,
        updatedLiability
      );

      setLiabilities((current) =>
        current.map((liability) =>
          liability.id === savedLiability.id
            ? savedLiability
            : liability
        )
      );
    } catch (error) {
      console.error("Nie udało się zaktualizować zobowiązania:", error);
      window.alert("Nie udało się zaktualizować zobowiązania w backendzie.");
    }
  }

  async function handleDeleteLiability(id: number) {
    try {
      await liabilityApi.remove(id);

      setLiabilities((current) =>
        current.filter((liability) => liability.id !== id)
      );
    } catch (error) {
      console.error("Nie udało się usunąć zobowiązania:", error);
      window.alert("Nie udało się usunąć zobowiązania z backendu.");
    }
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

  async function refreshGoals() {
    const refreshedGoals = await goalApi.getAll();
    setGoals(refreshedGoals);
  }

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

  async function handleAllocateGoalMoney(
    goalId: number,
    request: {
      amount: number;
      mode: "ALLOCATE_EXISTING" | "TRANSFER_AND_ALLOCATE";
      sourceAssetId?: number | null;
      targetAssetId: number;
    }
  ) {
    try {
      await goalAllocationApi.allocate(
        goalId,
        request
      );

      // Backend wykonuje całość w jednej transakcji:
      // allocation + ewentualny transfer assetów + currentAmount celu.
      // Po sukcesie odświeżamy oba źródła prawdy.
      const [
        refreshedGoals,
        refreshedAssets,
      ] = await Promise.all([
        goalApi.getAll(),
        assetApi.getAll(),
      ]);

      setGoals(refreshedGoals);
      setPortfolio(refreshedAssets);
    } catch (error) {
      console.error(
        "Nie udało się zaalokować pieniędzy do celu:",
        error
      );
      throw error;
    }
  }


  async function handleReleaseGoalMoney(goalId:number,assetId:number,amount:number){
    await goalAllocationApi.release(goalId,assetId,amount);
    const [refreshedGoals,refreshedAssets]=await Promise.all([goalApi.getAll(),assetApi.getAll()]);
    setGoals(refreshedGoals); setPortfolio(refreshedAssets);
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
   * MONTHLY REVIEW SNAPSHOTS — SPRING BOOT API
   * =========================================================
   */

  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMonthlySnapshots([]);
      return;
    }

    let cancelled = false;

    async function loadMonthlySnapshots() {
      try {
        const loaded = await monthlySnapshotApi.getAll();
        if (!cancelled) setMonthlySnapshots(loaded);
      } catch (error) {
        console.error("Nie udało się pobrać snapshotów z backendu:", error);
      }
    }

    void loadMonthlySnapshots();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function handleCloseMonth(month: string) {
    try {
      const created = await monthlySnapshotApi.closeMonth(month);

      setMonthlySnapshots((current) => [
        created,
        ...current.filter((snapshot) => snapshot.month !== created.month),
      ]);
    } catch (error) {
      console.error("Nie udało się zamknąć miesiąca:", error);
      window.alert(
        "Nie udało się zamknąć miesiąca. Być może ten miesiąc jest już zamknięty."
      );
      throw error;
    }
  }

  /*
   * =========================================================
   * NET WORTH HISTORY — SPRING BOOT API
   * =========================================================
   */

  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNetWorthHistory([]);
      return;
    }

    let cancelled = false;

    async function loadNetWorthHistory() {
      try {
        const loaded = await netWorthHistoryApi.getAll();
        if (!cancelled) setNetWorthHistory(loaded);
      } catch (error) {
        console.error("Nie udało się pobrać historii net worth:", error);
      }
    }

    void loadNetWorthHistory();
    return () => { cancelled = true; };
  }, [isAuthenticated]);


  /*
   * =========================================================
   * CASHFLOW — SPRING BOOT API
   * =========================================================
   */

  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget>({
    incomes: [],
    expenses: [],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setMonthlyBudget({ incomes: [], expenses: [] });
      return;
    }

    let cancelled = false;

    async function loadTransactions() {
      try {
        const loaded = await transactionApi.getAll();
        if (!cancelled) setMonthlyBudget(loaded);
      } catch (error) {
        console.error("Nie udało się pobrać transakcji z backendu:", error);
      }
    }

    void loadTransactions();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function refreshTransactions() {
    setMonthlyBudget(await transactionApi.getAll());
  }

  async function handleDataImported() {
    await Promise.all([
      refreshTransactions(),
      refreshPortfolio(),
    ]);
  }

  /*
   * =========================================================
   * RECURRING TRANSACTIONS — SPRING BOOT API
   * =========================================================
   */

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRecurringTransactions([]);
      return;
    }

    let cancelled = false;

    async function loadRecurringTransactions() {
      try {
        const loaded = await recurringTransactionApi.getAll();
        if (!cancelled) setRecurringTransactions(loaded);
      } catch (error) {
        console.error("Nie udało się pobrać reguł cyklicznych:", error);
      }
    }

    void loadRecurringTransactions();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  /*
   * =========================================================
   * EXPENSE CRUD
   * =========================================================
   */

  async function handleAddExpense(expense: Expense) {
    try {
      if (expense.recurringRuleId !== undefined) {
        const created = await transactionApi.createExpense(expense);
        setMonthlyBudget((current) => ({
          ...current,
          expenses: [...current.expenses, created],
        }));
        await Promise.all([refreshPortfolio(), refreshGoals()]);
        return;
      }

      if (!expense.recurring) {
        const created = await transactionApi.createExpense(expense);
        setMonthlyBudget((current) => ({
          ...current,
          expenses: [...current.expenses, created],
        }));
        await Promise.all([refreshPortfolio(), refreshGoals()]);
        return;
      }

      const newRule = await recurringTransactionApi.create({
        ...expense,
        id: 0,
        type: "expense",
        dayOfMonth: getDayFromDate(expense.date),
        startDate: expense.date,
        active: true,
      });

      const created = await transactionApi.createExpense({
        ...expense,
        id: 0,
        recurring: true,
        recurringRuleId: newRule.id,
      });

      setRecurringTransactions((current) => [...current, newRule]);
      setMonthlyBudget((current) => ({
        ...current,
        expenses: [...current.expenses, created],
      }));
      await Promise.all([refreshPortfolio(), refreshGoals()]);
    } catch (error) {
      console.error("Nie udało się dodać wydatku:", error);
      window.alert("Nie udało się zapisać wydatku w backendzie.");
    }
  }

  async function handleDeleteExpense(id: number) {
    try {
      await transactionApi.remove(id);
      setMonthlyBudget((current) => ({
        ...current,
        expenses: current.expenses.filter((expense) => expense.id !== id),
      }));
      await Promise.all([refreshPortfolio(), refreshGoals()]);
    } catch (error) {
      console.error("Nie udało się usunąć wydatku:", error);
    }
  }

  async function handleUpdateExpense(updatedExpense: Expense) {
    try {
      const saved = await transactionApi.updateExpense(updatedExpense);
      setMonthlyBudget((current) => ({
        ...current,
        expenses: current.expenses.map((expense) =>
          expense.id === saved.id ? saved : expense
        ),
      }));
      await Promise.all([refreshPortfolio(), refreshGoals()]);
    } catch (error) {
      console.error("Nie udało się zaktualizować wydatku:", error);
    }
  }

  /*
   * =========================================================
   * INCOME CRUD
   * =========================================================
   */

  async function handleAddIncome(income: Income) {
    try {
      if (income.recurringRuleId !== undefined) {
        const created = await transactionApi.createIncome(income);
        setMonthlyBudget((current) => ({
          ...current,
          incomes: [...current.incomes, created],
        }));
        await refreshPortfolio();
        return;
      }

      if (!income.recurring) {
        const created = await transactionApi.createIncome(income);
        setMonthlyBudget((current) => ({
          ...current,
          incomes: [...current.incomes, created],
        }));
        await refreshPortfolio();
        return;
      }

      const newRule = await recurringTransactionApi.create({
        id: 0,
        type: "income",
        name: income.name,
        amount: income.amount,
        dayOfMonth: getDayFromDate(income.date),
        startDate: income.date,
        active: true,
      });

      const created = await transactionApi.createIncome({
        ...income,
        id: 0,
        recurring: true,
        recurringRuleId: newRule.id,
      });

      setRecurringTransactions((current) => [...current, newRule]);
      setMonthlyBudget((current) => ({
        ...current,
        incomes: [...current.incomes, created],
      }));
      await refreshPortfolio();
    } catch (error) {
      console.error("Nie udało się dodać przychodu:", error);
      window.alert("Nie udało się zapisać przychodu w backendzie.");
    }
  }

  async function handleDeleteIncome(id: number) {
    try {
      await transactionApi.remove(id);
      setMonthlyBudget(await transactionApi.getAll());
      await refreshPortfolio();
    } catch (error) {
      console.error("Nie udało się usunąć przychodu:", error);
    }
  }

  async function handleUpdateIncome(updatedIncome: Income) {
    try {
      await transactionApi.updateIncome(updatedIncome);
      setMonthlyBudget(await transactionApi.getAll());
      await refreshPortfolio();
    } catch (error) {
      console.error("Nie udało się zaktualizować przychodu:", error);
    }
  }

  /*
   * =========================================================
   * RECURRING CRUD
   * =========================================================
   */

  async function handleAddRecurringTransaction(rule: RecurringTransaction) {
    try {
      const created = await recurringTransactionApi.create(rule);
      setRecurringTransactions((current) => [...current, created]);
    } catch (error) {
      console.error("Nie udało się dodać reguły cyklicznej:", error);
    }
  }

  async function handleUpdateRecurringTransaction(updatedRule: RecurringTransaction) {
    try {
      const saved = await recurringTransactionApi.update(updatedRule);
      setRecurringTransactions((current) =>
        current.map((rule) => rule.id === saved.id ? saved : rule)
      );
    } catch (error) {
      console.error("Nie udało się zaktualizować reguły cyklicznej:", error);
    }
  }

  async function handleToggleRecurringTransaction(id: number) {
    const currentRule = recurringTransactions.find((rule) => rule.id === id);
    if (!currentRule) return;

    await handleUpdateRecurringTransaction({
      ...currentRule,
      active: !currentRule.active,
    });
  }

  async function handleDeleteRecurringTransaction(id: number) {
    try {
      await recurringTransactionApi.remove(id);
      setRecurringTransactions((current) =>
        current.filter((rule) => rule.id !== id)
      );
    } catch (error) {
      console.error("Nie udało się usunąć reguły cyklicznej:", error);
    }
  }

  /*
   * =========================================================
   * BUDGET PLANS — SPRING BOOT API
   * =========================================================
   */

  const [budgetPlans, setBudgetPlans] = useState<MonthlyBudgetPlan[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setBudgetPlans([]);
      return;
    }

    let cancelled = false;

    async function loadBudgetPlans() {
      try {
        const loaded = await budgetApi.getAll();
        if (!cancelled) setBudgetPlans(loaded);
      } catch (error) {
        console.error("Nie udało się pobrać planów budżetowych:", error);
      }
    }

    void loadBudgetPlans();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function handleSaveBudgetPlan(plan: MonthlyBudgetPlan) {
    try {
      const saved = await budgetApi.save(plan);
      setBudgetPlans((current) => {
        const exists = current.some((item) => item.month === saved.month);
        return exists
          ? current.map((item) => item.month === saved.month ? saved : item)
          : [...current, saved];
      });
    } catch (error) {
      console.error("Nie udało się zapisać planu budżetowego:", error);
      window.alert("Nie udało się zapisać planu budżetowego.");
    }
  }

  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(() => getCurrentMonth());

  /*
   * =========================================================
   * DEV DEMO DATA
   * =========================================================
   */

  const [isLoadingDemoData, setIsLoadingDemoData] = useState(false);

  async function handleLoadDemoData() {
    if (isLoadingDemoData) return;
    const shouldLoad = window.confirm(
      "Załadować rozbudowany syntetyczny profil testowy?\n\n" +
      "Loader utworzy kilka portfeli, aktywa, 5 celów ze zdjęciami, 2 kredyty, budżety oraz 6 miesięcy przychodów i wydatków.\n\n" +
      "Obecne edytowalne dane na tym koncie zostaną zastąpione. Najlepiej używać tej funkcji na osobnym koncie testowym."
    );

    if (!shouldLoad) return;

    setIsLoadingDemoData(true);

    try {
      const result = await loadSyntheticDemoData();

      setPortfolio(result.assets);
      setLiabilities(result.liabilities);
      setGoals(result.goals);
      setMonthlyBudget(result.monthlyBudget);
      setRecurringTransactions(result.recurringTransactions);
      setNetWorthHistory(result.netWorthHistory);
      setMonthlySnapshots(result.monthlySnapshots);
      setBudgetPlans(result.budgetPlans);

      const warningText = result.warnings.length > 0
        ? `\n\nUwagi:\n• ${result.warnings.join("\n• ")}`
        : "";

      window.alert(
        `Gotowe. Załadowano syntetyczne dane testowe:\n` +
        `• ${result.stats.portfolios} portfeli\n` +
        `• ${result.stats.assets} aktywów\n` +
        `• ${result.stats.goals} celów\n` +
        `• ${result.stats.liabilities} kredyty / zobowiązania\n` +
        `• ${result.stats.incomes} przychodów\n` +
        `• ${result.stats.expenses} wydatków\n` +
        `• ${result.stats.closedMonths} nowych zamkniętych miesięcy` +
        warningText
      );
    } catch (error) {
      console.error("Nie udało się załadować rozbudowanych danych demo:", error);
      window.alert(
        `Nie udało się załadować danych demo.\n\n${
          error instanceof Error ? error.message : "Nieznany błąd"
        }`
      );
    } finally {
      setIsLoadingDemoData(false);
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

        {import.meta.env.DEV && <button
          type="button"
          onClick={handleLoadDemoData}
          disabled={isLoadingDemoData}
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
            disabled:cursor-wait
            disabled:opacity-70
          "
          title="Zastąp obecne dane zestawem testowym"
        >
          {isLoadingDemoData ? "DEV: Loading demo…" : "DEV: Load demo data"}
        </button>}

        <div className="freedom-content">
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
                  assets={portfolio}
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
                  onDataImported={
                    handleDataImported
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
                  onPortfolioChanged={refreshPortfolio}
                  onTransactionsChanged={async () => {
                    setMonthlyBudget(await transactionApi.getAll());
                  }}
                  goals={goals}
                  monthlySnapshots={monthlySnapshots}
                  onReleaseMoney={handleReleaseGoalMoney}
                  onGoalsChanged={async () => {
                    await refreshGoals();
                  }}
                />
              }
            />

            <Route
              path="/goals"
              element={
                <Goals
                  goals={goals}
                  portfolio={portfolio}
                  onAddGoal={
                    handleAddGoal
                  }
                  onUpdateGoal={
                    handleUpdateGoal
                  }
                  onDeleteGoal={
                    handleDeleteGoal
                  }
                  onAllocateMoney={
                    handleAllocateGoalMoney
                  }
                  onReleaseMoney={handleReleaseGoalMoney}
                  onGoalsChanged={async () => {
                    await refreshGoals();
                  }}
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
                  portfolio={portfolio}
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
      monthlyBudget={monthlyBudget}
      netWorthHistory={netWorthHistory}
      netWorth={netWorth}
      portfolio={portfolio}
      goals={goals}
      liabilities={liabilities}
      monthlySnapshots={monthlySnapshots}
    />
  }
/>


<Route
  path="/timeline"
  element={
    <FinancialTimeline
      netWorth={netWorth}
      monthlyBudget={monthlyBudget}
      netWorthHistory={netWorthHistory}
      monthlySnapshots={monthlySnapshots}
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

export default App;