import { useEffect, useMemo, useState, type ComponentType } from "react";

import {
  Banknote,
  CalendarDays,
  Car,
  CreditCard,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  House,
  PiggyBank,
  Plus,
  Pencil,
  Repeat2,
  ShoppingBasket,
  Trash2,
  Sparkles,
  FileUp,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { AddIncomeModal } from "../components/finances/AddIncomeModal";
import { EditIncomeModal } from "../components/finances/EditIncomeModal";

import { AddExpenseModal } from "../components/dashboard/AddExpenseModal";
import { EditExpenseModal } from "../components/finances/EditExpenseModal";

import { CategoryMiniImage } from "../components/categories/CategoryMiniImage";

import { RecurringTransactionsSection } from "../components/finances/RecurringTransactionsSection";
import { AddRecurringTransactionModal } from "../components/finances/AddRecurringTransactionModal";
import { EditRecurringTransactionModal } from "../components/finances/EditRecurringTransactionModal";
import { MyFinanceImportModal } from "../components/finances/MyFinanceImportModal";
import { CashflowAiPromptModal } from "../components/finances/CashflowAiPromptModal";
import { CashSourcePicker } from "../components/finances/CashSourcePicker";

import type {
  Expense,
  ExpenseCategory,
  Income,
  MonthlyBudget,
} from "../types/Cashflow";

import type {
  RecurringTransaction,
} from "../types/RecurringTransaction";
import type { Asset } from "../types/Asset";
import { getAssetCategory } from "../types/Asset";
import type { PortfolioWallet } from "../types/Portfolio";
import type { Goal } from "../types/Goal";
import { portfolioApi } from "../api/portfolioApi";
import { useLanguage } from "../i18n/LanguageContext";
import { localizedCategoryName } from "../i18n/categoryNames";

type FinancesProps = {
  budget: MonthlyBudget;
  assets: Asset[];
  goals: Goal[];

  recurringTransactions:
    RecurringTransaction[];

  onAddIncome: (
    income: Income
  ) => void;

  onDeleteIncome: (
    id: number
  ) => void;

  onUpdateIncome: (
    income: Income
  ) => Promise<void> | void;

  onAddExpense: (
    expense: Expense
  ) => void;

  onDeleteExpense: (
    id: number
  ) => void;

  onUpdateExpense: (
    expense: Expense
  ) => Promise<void> | void;

  onAddRecurringTransaction: (
    rule: RecurringTransaction
  ) => void;

  onUpdateRecurringTransaction: (
    rule: RecurringTransaction
  ) => void;

  onToggleRecurringTransaction: (
    id: number
  ) => void;

  onDeleteRecurringTransaction: (
    id: number
  ) => void;

  onDataImported: () => Promise<void> | void;
};

const categories = [
  {
    category:
      "fixed" as ExpenseCategory,

    title: "Koszty stałe",
    subtitle: "Rachunki, dom i wszystkie cykliczne obciążenia.",

    icon: House,

    color: "text-rose-300",
    iconRing: "ring-rose-400/20",
    iconBg: "bg-rose-400/12",
    border: "border-rose-500/15 hover:border-rose-400/30",
    coverGradient: "from-[#261118] via-[#15101a] to-[#08111f]",
    coverGlow: "bg-rose-400/18",
    watermark: "text-rose-200/[0.08]",
    chipTone: "border-rose-400/20 bg-rose-400/[0.10] text-rose-200",
    coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
  },

  {
    category:
      "living" as ExpenseCategory,

    title: "Życie",
    subtitle: "Codzienność, jedzenie, transport i to co dzieje się tu i teraz.",

    icon: ShoppingBasket,

    color: "text-amber-300",
    iconRing: "ring-amber-400/20",
    iconBg: "bg-amber-400/12",
    border: "border-amber-500/15 hover:border-amber-400/30",
    coverGradient: "from-[#251d0f] via-[#171410] to-[#08111f]",
    coverGlow: "bg-amber-400/18",
    watermark: "text-amber-200/[0.08]",
    chipTone: "border-amber-400/20 bg-amber-400/[0.10] text-amber-200",
    coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80",
  },

  {
    category:
      "investment" as ExpenseCategory,

    title: "Inwestycje",
    subtitle: "Zakupy aktywów, dopłaty i budowanie przyszłej wartości.",

    icon:
      ChartNoAxesCombined,

    color: "text-sky-300",
    iconRing: "ring-sky-400/20",
    iconBg: "bg-sky-400/12",
    border: "border-sky-500/15 hover:border-sky-400/30",
    coverGradient: "from-[#0d1a29] via-[#0b1220] to-[#08111f]",
    coverGlow: "bg-sky-400/18",
    watermark: "text-sky-200/[0.08]",
    chipTone: "border-sky-400/20 bg-sky-400/[0.10] text-sky-200",
    coverImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80",
  },

  {
    category:
      "goal" as ExpenseCategory,

    title: "Cele",
    subtitle: "Wydatki powiązane z planami, marzeniami i większymi projektami.",

    icon: Car,

    color: "text-violet-300",
    iconRing: "ring-violet-400/20",
    iconBg: "bg-violet-400/12",
    border: "border-violet-500/15 hover:border-violet-400/30",
    coverGradient: "from-[#171128] via-[#111121] to-[#08111f]",
    coverGlow: "bg-violet-400/18",
    watermark: "text-violet-200/[0.08]",
    chipTone: "border-violet-400/20 bg-violet-400/[0.10] text-violet-200",
    coverImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

export function Finances({
  budget,
  assets,
  goals,
  recurringTransactions,
  onAddIncome,
  onDeleteIncome,
  onUpdateIncome,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
  onAddRecurringTransaction,
  onUpdateRecurringTransaction,
  onToggleRecurringTransaction,
  onDeleteRecurringTransaction,
  onDataImported,
}: FinancesProps) {
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);

  const [
    isAddExpenseOpen,
    setIsAddExpenseOpen,
  ] = useState(false);

  const [
    isAddIncomeOpen,
    setIsAddIncomeOpen,
  ] = useState(false);

  const [
    isAddRecurringOpen,
    setIsAddRecurringOpen,
  ] = useState(false);

  const [
    isImportOpen,
    setIsImportOpen,
  ] = useState(false);

  const [
    isAiPromptOpen,
    setIsAiPromptOpen,
  ] = useState(false);

  const [
    editingExpense,
    setEditingExpense,
  ] =
    useState<Expense | null>(
      null
    );

  const [
    editingIncome,
    setEditingIncome,
  ] =
    useState<Income | null>(
      null
    );

  const [
    editingRecurringRule,
    setEditingRecurringRule,
  ] =
    useState<RecurringTransaction | null>(
      null
    );

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth()
  );

  const [wallets, setWallets] = useState<PortfolioWallet[]>([]);

  useEffect(() => {
    let cancelled = false;
    portfolioApi.getAll()
      .then((rows) => { if (!cancelled) setWallets(rows); })
      .catch(() => { if (!cancelled) setWallets([]); });
    return () => { cancelled = true; };
  }, [assets]);

  const walletById = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets]
  );

  const cashAssets = useMemo(
    () => assets
      .filter((asset) => asset.systemCash || getAssetCategory(asset) === "cash")
      .sort((a, b) => {
        if (a.systemCash !== b.systemCash) return a.systemCash ? -1 : 1;
        const walletA = walletById.get(a.portfolioId ?? -1)?.name ?? "";
        const walletB = walletById.get(b.portfolioId ?? -1)?.name ?? "";
        return walletA.localeCompare(walletB, "pl") || a.name.localeCompare(b.name, "pl");
      }),
    [assets, walletById]
  );

  const monthlyIncomes =
    budget.incomes.filter(
      (income) =>
        isTransactionInMonth(
          income.date,
          selectedMonth
        )
    );

  const monthlyExpenses =
    budget.expenses.filter(
      (expense) =>
        isTransactionInMonth(
          expense.date,
          selectedMonth
        )
    );

  const income =
    monthlyIncomes.reduce(
      (
        sum,
        incomeItem
      ) =>
        sum +
        incomeItem.amount,
      0
    );

  const totalExpenses =
    monthlyExpenses.reduce(
      (sum, expense) =>
        sum +
        expense.amount,
      0
    );

  const available =
    income -
    totalExpenses;

  const savingsRate =
    income > 0
      ? (available /
          income) *
        100
      : 0;

  function changeMonth(
    offset: number
  ) {
    const [year, month] =
      selectedMonth
        .split("-")
        .map(Number);

    const date =
      new Date(
        year,
        month - 1 +
          offset,
        1
      );

    const nextMonth =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    setSelectedMonth(
      nextMonth
    );
  }

  function handleBookRule(
    rule: RecurringTransaction
  ) {
    const date =
      createDateForMonth(
        selectedMonth,
        rule.dayOfMonth
      );

    if (
      rule.type ===
      "income"
    ) {
      onAddIncome({
        id: Date.now(),

        name: rule.name,

        amount:
          rule.amount,

        recurring: true,

        date,

        recurringRuleId:
          rule.id,

        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        categoryIconKey: rule.categoryIconKey,
        categoryColor: rule.categoryColor,
        categoryGroup: rule.categoryGroup,
      });

      return;
    }

    onAddExpense({
      id: Date.now(),

      name: rule.name,

      amount:
        rule.amount,

      category:
        rule.category ??
        "fixed",

      recurring: true,

      date,

      recurringRuleId:
        rule.id,

      categoryId: rule.categoryId,
      categoryName: rule.categoryName,
      categoryIconKey: rule.categoryIconKey,
      categoryColor: rule.categoryColor,
      categoryGroup: rule.categoryGroup,
    });
  }

  const monthLabel =
    formatMonth(
      selectedMonth,
      locale
    );

  return (
    <main className="min-h-screen bg-[#050b16] p-8">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Freedom
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {ui("Finanse", "Finances")}
          </h1>

          <p className="mt-2 text-slate-500">
            {ui("Zarządzaj miesięcznymi przepływami pieniężnymi.", "Manage your monthly cashflow.")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
            <button
              type="button"
              onClick={() =>
                changeMonth(-1)
              }
              className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <div className="min-w-44 text-center">
              <p className="text-sm font-semibold capitalize">
                {monthLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                changeMonth(1)
              }
              className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsAiPromptOpen(true)
            }
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] px-4 py-3 text-sm font-semibold text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/12 hover:text-white"
          >
            <Sparkles size={18} />
            {ui("Analiza AI", "AI analysis")}
          </button>

          <button
            type="button"
            onClick={() =>
              setIsImportOpen(true)
            }
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white"
          >
            <FileUp size={18} />
            {ui("Import z Finanse", "Import from Finanse")}
          </button>

          <button
            type="button"
            onClick={() =>
              setIsAddExpenseOpen(
                true
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus size={18} />

            {ui("Dodaj wydatek", "Add expense")}
          </button>
        </div>
      </div>

      {/* SUMMARY */}

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={ui("Dochód", "Income")}
          value={income}
          color="text-emerald-300"
          subtitle={ui(`${monthlyIncomes.length} źródeł`, `${monthlyIncomes.length} sources`)}
          icon={WalletCards}
          accent="emerald"
          eyebrow={ui("DOCHÓD", "INCOME")}
        />

        <SummaryCard
          label={ui("Wydatki i alokacje", "Expenses & allocations")}
          value={totalExpenses}
          color="text-rose-300"
          subtitle={ui(`${monthlyExpenses.length} pozycji`, `${monthlyExpenses.length} items`)}
          icon={CreditCard}
          accent="rose"
          eyebrow={ui("WYDATKI", "OUTFLOW")}
        />

        <SummaryCard
          label={ui("Wolne środki", "Free cash")}
          value={available}
          color={available >= 0 ? "text-sky-300" : "text-red-300"}
          subtitle={available >= 0 ? ui("Kapitał gotowy do alokacji", "Capital ready to allocate") : ui("Miesiąc na minusie", "Month below zero")}
          icon={available >= 0 ? PiggyBank : TrendingDown}
          accent={available >= 0 ? "sky" : "rose"}
          eyebrow={ui("DOSTĘPNE", "AVAILABLE")}
        />

        <SummaryCard
          label={ui("Stopa oszczędności", "Savings rate")}
          value={savingsRate}
          color={savingsRate >= 50 ? "text-emerald-300" : "text-amber-300"}
          subtitle={ui("Cel: minimum 50%", "Target: minimum 50%")} 
          suffix="%"
          decimals={1}
          icon={savingsRate >= 50 ? TrendingUp : Target}
          accent={savingsRate >= 50 ? "emerald" : "amber"}
          eyebrow={ui("STOPA OSZCZĘDNOŚCI", "SAVINGS RATE")}
          progress={Math.max(0, Math.min(100, savingsRate))}
        />
      </section>

      {/* RECURRING */}

      <RecurringTransactionsSection
        rules={
          recurringTransactions
        }
        selectedMonth={
          selectedMonth
        }
        incomes={
          budget.incomes
        }
        expenses={
          budget.expenses
        }
        onAddRule={() =>
          setIsAddRecurringOpen(
            true
          )
        }
        onEditRule={
          setEditingRecurringRule
        }
        onBookRule={
          handleBookRule
        }
        onToggleRule={
          onToggleRecurringTransaction
        }
        onDeleteRule={
          onDeleteRecurringTransaction
        }
      />

      {/* INCOMES */}

      <section className="group relative mt-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/75 shadow-[0_14px_40px_rgba(0,0,0,0.16)] transition hover:border-emerald-400/35">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-[#0d2a21] via-[#0b1725] to-[#08111f]" />
        <div className="pointer-events-none absolute -right-6 top-1 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />
        <Banknote className="pointer-events-none absolute right-4 top-4 h-20 w-20 text-emerald-200/[0.08]" />

        <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Banknote size={24} className="text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                {ui("Przychody", "Income")}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {ui(`Wpływy z pracy, działalności i innych źródeł w ${monthLabel.toLowerCase()}.`, `Income from work, business and other sources in ${monthLabel}.`)}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/90">
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1">
                  {monthlyIncomes.length} {language === "pl" ? polishCountWord(monthlyIncomes.length, "źródło", "źródła", "źródeł") : monthlyIncomes.length === 1 ? "source" : "sources"}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-slate-300">
                  {ui("Śledzenie wpływów", "Income tracking")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="text-lg font-black text-emerald-300 sm:text-xl">
              +
              {income.toLocaleString(
                locale
              )}{" "}
              {language === "pl" ? "zł" : "PLN"}
            </span>

            <button
              type="button"
              onClick={() =>
                setIsAddIncomeOpen(
                  true
                )
              }
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <Plus size={16} />

              {ui("Dodaj", "Add")}
            </button>
          </div>
        </div>

        {monthlyIncomes.length ===
        0 ? (
          <EmptyRows
            text={ui(`Brak przychodów w ${monthLabel}.`, `No income in ${monthLabel}.`)}
          />
        ) : (
          monthlyIncomes
            .slice()
            .sort(
              (a, b) =>
                getTransactionDate(
                  b.date
                ).localeCompare(
                  getTransactionDate(
                    a.date
                  )
                )
            )
            .map(
              (
                incomeItem
              ) => (
                <TransactionVisualRow
                  key={incomeItem.id}
                  name={incomeItem.name}
                  amount={incomeItem.amount}
                  date={incomeItem.date}
                  recurring={incomeItem.recurring}
                  categoryName={localizedCategoryName(incomeItem.categoryName ?? "Przychód", language)}
                  categoryIconKey={incomeItem.categoryIconKey ?? "Wallet"}
                  categoryColor={incomeItem.categoryColor ?? "#10b981"}
                  tone="income"
                  currentAssetId={incomeItem.assetId}
                  cashAssets={cashAssets}
                  wallets={wallets}
                  onSourceChange={async (assetId) => {
                    if (assetId === incomeItem.assetId) return;
                    await onUpdateIncome({ ...incomeItem, assetId });
                  }}
                  onEdit={() => setEditingIncome(incomeItem)}
                  onDelete={() => onDeleteIncome(incomeItem.id)}
                />
              )
            )
        )}
      </section>

      {/* EXPENSE CATEGORIES */}

      <div className="mt-8 space-y-6">
        {categories.map(
          (config) => {
            const categoryExpenses =
              monthlyExpenses.filter(
                (expense) =>
                  expense.category ===
                  config.category
              );

            const categoryTotal =
              categoryExpenses.reduce(
                (
                  sum,
                  expense
                ) =>
                  sum +
                  expense.amount,
                0
              );

            const Icon =
              config.icon;

            return (
              <section
                key={
                  config.category
                }
                className={`group relative overflow-hidden rounded-2xl border bg-slate-900/75 shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition ${config.border}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
                  <img
                    src={config.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-35 saturate-[0.9]"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.coverGradient}`} />
                </div>
                <div className={`pointer-events-none absolute -right-7 top-1 h-28 w-28 rounded-full ${config.coverGlow} blur-2xl`} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/10 via-transparent to-slate-900/45" />
                <Icon className={`pointer-events-none absolute right-4 top-3 h-20 w-20 ${config.watermark}`} />

                <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconBg} ring-1 ${config.iconRing}`}>
                      <Icon size={24} className={config.color} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">
                        {
                          ui(config.title, financeCategoryTitleEn(config.category))
                        }
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {ui(config.subtitle, financeCategorySubtitleEn(config.category))}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                        <span className={`rounded-full border px-2.5 py-1 ${config.chipTone}`}>
                          {categoryExpenses.length} {ui("pozycji", "items")}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-slate-300">
                          {monthLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-lg font-black text-slate-100 sm:text-xl">
                    {categoryTotal.toLocaleString(
                      locale
                    )}{" "}
                    {language === "pl" ? "zł" : "PLN"}
                  </span>
                </div>

                <div>
                  {categoryExpenses.length ===
                  0 ? (
                    <EmptyRows
                      text={ui(`Brak pozycji w kategorii „${config.title}”.`, `No items in “${financeCategoryTitleEn(config.category)}”.`)}
                    />
                  ) : (
                    categoryExpenses
                      .slice()
                      .sort(
                        (
                          a,
                          b
                        ) =>
                          getTransactionDate(
                            b.date
                          ).localeCompare(
                            getTransactionDate(
                              a.date
                            )
                          )
                      )
                      .map(
                        (
                          expense
                        ) => (
                          <TransactionVisualRow
                            key={expense.id}
                            name={expense.name}
                            amount={expense.amount}
                            date={expense.date}
                            recurring={expense.recurring}
                            categoryName={localizedCategoryName(expense.categoryName ?? config.title, language)}
                            categoryIconKey={expense.categoryIconKey ?? fallbackIconKey(config.category)}
                            categoryColor={expense.categoryColor ?? fallbackCategoryColor(config.category)}
                            tone="expense"
                            goal={expense.goalId ? goals.find((goal) => goal.id === expense.goalId) : undefined}
                            currentAssetId={expense.assetId}
                            cashAssets={cashAssets}
                            wallets={wallets}
                            onSourceChange={async (assetId) => {
                              if (assetId === expense.assetId) return;
                              await onUpdateExpense({ ...expense, assetId });
                            }}
                            onEdit={() => setEditingExpense(expense)}
                            onDelete={() => onDeleteExpense(expense.id)}
                          />
                        )
                      )
                  )}
                </div>
              </section>
            );
          }
        )}
      </div>

      {/* ADD EXPENSE */}

      {isAddExpenseOpen && (
        <AddExpenseModal
          assets={cashAssets}
          wallets={wallets}
          onClose={() =>
            setIsAddExpenseOpen(
              false
            )
          }
          onAdd={
            onAddExpense
          }
        />
      )}

      {/* EDIT EXPENSE */}

      {editingExpense && (
        <EditExpenseModal
          expense={
            editingExpense
          }
          assets={cashAssets}
          wallets={wallets}
          onClose={() =>
            setEditingExpense(
              null
            )
          }
          onSave={(
            expense
          ) => {
            onUpdateExpense(
              expense
            );

            setEditingExpense(
              null
            );
          }}
        />
      )}

      {/* ADD INCOME */}

      {isAddIncomeOpen && (
        <AddIncomeModal
          assets={cashAssets}
          wallets={wallets}
          onClose={() =>
            setIsAddIncomeOpen(
              false
            )
          }
          onAdd={
            onAddIncome
          }
        />
      )}

      {/* EDIT INCOME */}

      {editingIncome && (
        <EditIncomeModal
          income={
            editingIncome
          }
          assets={cashAssets}
          wallets={wallets}
          onClose={() =>
            setEditingIncome(
              null
            )
          }
          onSave={(
            income
          ) => {
            onUpdateIncome(
              income
            );

            setEditingIncome(
              null
            );
          }}
        />
      )}

      {/* ADD RECURRING */}

      {isAddRecurringOpen && (
        <AddRecurringTransactionModal
          onClose={() =>
            setIsAddRecurringOpen(
              false
            )
          }
          onAdd={
            onAddRecurringTransaction
          }
        />
      )}

      {/* EDIT RECURRING */}

      {editingRecurringRule && (
        <EditRecurringTransactionModal
          rule={
            editingRecurringRule
          }
          onClose={() =>
            setEditingRecurringRule(
              null
            )
          }
          onSave={(
            rule
          ) => {
            onUpdateRecurringTransaction(
              rule
            );

            setEditingRecurringRule(
              null
            );
          }}
        />
      )}


      {isAiPromptOpen && (
        <CashflowAiPromptModal
          budget={budget}
          anchorMonth={selectedMonth}
          onClose={() => setIsAiPromptOpen(false)}
        />
      )}

      <MyFinanceImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={onDataImported}
      />
    </main>
  );
}


type TransactionVisualRowProps = {
  name: string;
  amount: number;
  date?: string;
  recurring: boolean;
  categoryName: string;
  categoryIconKey: string;
  categoryColor: string;
  tone: "income" | "expense";
  goal?: Goal;
  currentAssetId?: number;
  cashAssets: Asset[];
  wallets: PortfolioWallet[];
  onSourceChange: (assetId: number) => Promise<void> | void;
  onEdit: () => void;
  onDelete: () => void;
};

function TransactionVisualRow({
  name,
  amount,
  date,
  recurring,
  categoryName,
  categoryIconKey,
  categoryColor,
  tone,
  goal,
  currentAssetId,
  cashAssets,
  wallets,
  onSourceChange,
  onEdit,
  onDelete,
}: TransactionVisualRowProps) {
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const amountClass =
    tone === "income"
      ? "text-emerald-300"
      : "text-slate-100";

  return (
    <div className="group flex items-center gap-4 border-b border-slate-800/80 px-5 py-4 last:border-b-0 transition hover:bg-white/[0.025]">
      <CategoryMiniImage
        name={categoryName}
        iconKey={categoryIconKey}
        color={categoryColor}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-bold text-slate-100">
            {name}
          </span>

          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              borderColor: `${categoryColor}35`,
              backgroundColor: `${categoryColor}12`,
              color: categoryColor,
            }}
          >
            {categoryName}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />
            {formatTransactionDate(date, locale, language)}
          </span>

          <span>•</span>

          <span className="flex items-center gap-1">
            {recurring && <Repeat2 size={12} />}
            {recurring ? ui("Powtarzalny", "Recurring") : ui("Jednorazowy", "One-off")}
          </span>

          <span>•</span>
          <CashSourcePicker
            assets={cashAssets}
            wallets={wallets}
            value={currentAssetId}
            onChange={onSourceChange}
            variant="compact"
          />

          {goal && (
            <>
              <span>•</span>
              <div
                className="inline-flex min-w-0 items-center gap-2 rounded-xl border bg-slate-950/65 px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                style={{ borderColor: `${goal.color || "#8b5cf6"}45` }}
                title={`${ui("Powiązany cel", "Linked goal")}: ${goal.name}`}
              >
                {goal.imageUrl ? (
                  <img
                    src={goal.imageUrl}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-lg border border-white/10 object-cover"
                    style={{ objectPosition: goalImagePosition(goal.imagePosition) }}
                  />
                ) : (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `${goal.color || "#8b5cf6"}35`,
                      backgroundColor: `${goal.color || "#8b5cf6"}16`,
                      color: goal.color || "#c4b5fd",
                    }}
                  >
                    <Target size={13} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
                    {ui("Cel", "Goal")}
                  </span>
                  <span className="block max-w-[190px] truncate text-[11px] font-bold text-violet-200">
                    {goal.name}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className={`min-w-[110px] text-right text-base font-black ${amountClass}`}>
          {tone === "income" ? "+" : ""}
          {amount.toLocaleString(locale)} {language === "pl" ? "zł" : "PLN"}
        </div>

        <button
          type="button"
          onClick={onEdit}
          title={ui("Edytuj", "Edit")}
          className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"
        >
          <Pencil size={17} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          title={ui("Usuń", "Delete")}
          className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function formatTransactionDate(date: string | undefined, locale: "pl-PL" | "en-US", language: "pl" | "en") {
  if (!date) return language === "pl" ? "Brak daty" : "No date";

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(Number(year), Number(month) - 1, Number(day), 12));
}

function goalImagePosition(position?: Goal["imagePosition"]) {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  return "center center";
}

function polishCountWord(value: number, one: string, few: string, many: string) {
  if (value === 1) return one;
  const lastTwo = value % 100;
  const last = value % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}

function fallbackIconKey(category: ExpenseCategory) {
  switch (category) {
    case "fixed":
      return "House";
    case "investment":
      return "TrendingUp";
    case "goal":
      return "Target";
    default:
      return "ShoppingBasket";
  }
}

function fallbackCategoryColor(category: ExpenseCategory) {
  switch (category) {
    case "fixed":
      return "#fb7185";
    case "investment":
      return "#60a5fa";
    case "goal":
      return "#a78bfa";
    default:
      return "#fbbf24";
  }
}

type SummaryCardProps = {
  label: string;
  value: number;
  color: string;
  subtitle: string;
  suffix?: string;
  decimals?: number;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: "emerald" | "rose" | "sky" | "amber";
  eyebrow: string;
  progress?: number;
};

const summaryAccent = {
  emerald: {
    border: "border-emerald-500/20",
    glow: "bg-emerald-400/10",
    icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
    bar: "bg-emerald-400",
  },
  rose: {
    border: "border-rose-500/20",
    glow: "bg-rose-400/10",
    icon: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
    bar: "bg-rose-400",
  },
  sky: {
    border: "border-sky-500/20",
    glow: "bg-sky-400/10",
    icon: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
    bar: "bg-sky-400",
  },
  amber: {
    border: "border-amber-500/20",
    glow: "bg-amber-400/10",
    icon: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    bar: "bg-amber-400",
  },
};

function SummaryCard({
  label,
  value,
  color,
  subtitle,
  suffix = " zł",
  decimals = 0,
  icon: Icon,
  accent,
  eyebrow,
  progress,
}: SummaryCardProps) {
  const { language, locale } = useLanguage();
  const palette = summaryAccent[accent];
  const effectiveSuffix = suffix === " zł" ? (language === "pl" ? " zł" : " PLN") : suffix;

  return (
    <div className={`group relative min-h-[180px] overflow-hidden rounded-2xl border ${palette.border} bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#07111f] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-600`}>
      <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full ${palette.glow} blur-3xl transition duration-500 group-hover:scale-125`} />
      <Icon className="pointer-events-none absolute -bottom-7 -right-4 h-32 w-32 rotate-[-10deg] text-white/[0.035] transition duration-500 group-hover:scale-110 group-hover:text-white/[0.055]" />

      <div className="relative z-[1] flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
              {eyebrow}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              {label}
            </div>
          </div>

          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${palette.icon} shadow-lg`}>
            <Icon size={21} />
          </div>
        </div>

        <div className="mt-6">
          <div className={`text-[2rem] font-black leading-none tracking-tight ${color}`}>
            {value.toLocaleString(locale, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {effectiveSuffix}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={13} className="opacity-70" />
            <span>{subtitle}</span>
          </div>

          {progress !== undefined && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <span>{language === "pl" ? "Postęp" : "Progress"}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${palette.bar} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyRows({
  text,
}: {
  text: string;
}) {
  return (
    <div className="px-5 py-8 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

function getCurrentMonth() {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getTransactionDate(
  date?: string
) {
  return date ?? "";
}

function isTransactionInMonth(
  date:
    | string
    | undefined,

  month: string
) {
  if (date) {
    return date.startsWith(
      month
    );
  }

  /*
   * Stare rekordy zapisane przed
   * dodaniem pola date pokazujemy
   * tylko w bieżącym miesiącu.
   */
  return (
    month ===
    getCurrentMonth()
  );
}

function createDateForMonth(
  month: string,
  dayOfMonth: number
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const lastDay =
    new Date(
      year,
      monthNumber,
      0
    ).getDate();

  const safeDay =
    Math.min(
      dayOfMonth,
      lastDay
    );

  return `${month}-${String(
    safeDay
  ).padStart(2, "0")}`;
}


function financeCategoryTitleEn(category: ExpenseCategory) {
  switch (category) {
    case "fixed": return "Fixed costs";
    case "living": return "Living";
    case "investment": return "Investments";
    case "goal": return "Goals";
  }
}

function financeCategorySubtitleEn(category: ExpenseCategory) {
  switch (category) {
    case "fixed": return "Bills, home and all recurring charges.";
    case "living": return "Everyday life, food, transport and current spending.";
    case "investment": return "Asset purchases, contributions and building future value.";
    case "goal": return "Expenses linked to plans, dreams and larger projects.";
  }
}

function formatMonth(
  month: string,
  locale: string
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber - 1,
      1
    );

  return date.toLocaleDateString(
    locale,
    {
      month: "long",
      year: "numeric",
    }
  );
}