import { useState } from "react";

import {
  Gem,
  CircleDollarSign,
  Percent,
  Palmtree,
} from "lucide-react";

import { Header } from "../components/layout/Header";
import { MetricCard } from "../components/dashboard/MetricCard";
import { GoalsSection } from "../components/dashboard/GoalsSection";
import { InvestmentSection } from "../components/dashboard/InvestmentSection";
import { LiabilitiesSection } from "../components/dashboard/LiabilitiesSection";
import { CashflowSection } from "../components/dashboard/CashflowSection";
import { AddExpenseModal } from "../components/dashboard/AddExpenseModal";

import {
  calculateSavingsRate,
  sumIncomes,
} from "../utils/cashflow";

import { calculateLevelProgress } from "../utils/levels";

import type {
  Expense,
  MonthlyBudget,
} from "../types/Cashflow";

import type { Asset } from "../types/Asset";
import type { Goal } from "../types/Goal";
import type { Liability } from "../types/Liability";
import type { NetWorthSnapshot } from "../types/NetWorthHistory";

type DashboardProps = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  netWorthHistory: NetWorthSnapshot[];
  monthlyBudget: MonthlyBudget;
  onAddExpense: (
    expense: Expense
  ) => void;
};

export function Dashboard({
  netWorth,
  portfolio,
  goals,
  liabilities,
  netWorthHistory,
  monthlyBudget,
  onAddExpense,
}: DashboardProps) {
  const [
    isAddExpenseOpen,
    setIsAddExpenseOpen,
  ] = useState(false);

  const levelProgress =
    calculateLevelProgress(
      netWorth
    );

  const freedomTarget =
    3_000_000;

  const income =
    sumIncomes(
      monthlyBudget.incomes
    );

  const incomeTarget =
    25_000;

  const savingsRate =
    calculateSavingsRate(
      income,
      monthlyBudget.expenses
    );

  const runway = 38;
  const runwayTarget = 60;

  return (
    <main className="min-h-screen bg-[#050b16] p-8">
      <Header
        level={
          levelProgress
            .currentLevel.level
        }
        levelName={
          levelProgress
            .currentLevel.name
        }
      />

      <p className="mt-5 text-sm italic text-slate-500">
        „Wielkie cele składają
        się z małych,
        powtarzalnych decyzji.”
      </p>

      {/* METRICS */}

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Majątek netto"
          value={`${netWorth.toLocaleString(
            "pl-PL"
          )} zł`}
          subtitle={`Cel: ${freedomTarget.toLocaleString(
            "pl-PL"
          )} zł`}
          progress={
            (netWorth /
              freedomTarget) *
            100
          }
          icon={
            <Gem className="text-blue-400" />
          }
        />

        <MetricCard
          title="Miesięczny dochód netto"
          value={`${income.toLocaleString(
            "pl-PL"
          )} zł`}
          subtitle={`Cel: ${incomeTarget.toLocaleString(
            "pl-PL"
          )} zł`}
          progress={
            (income /
              incomeTarget) *
            100
          }
          icon={
            <CircleDollarSign className="text-emerald-400" />
          }
          progressColor="bg-emerald-500"
        />

        <MetricCard
          title="Stopa oszczędności"
          value={`${savingsRate.toFixed(
            1
          )}%`}
          subtitle="Cel: minimum 50%"
          progress={savingsRate}
          icon={
            <Percent className="text-amber-400" />
          }
          progressColor="bg-amber-500"
        />

        <MetricCard
          title="Freedom runway"
          value={`${runway} miesięcy`}
          subtitle="Minimalne wydatki: ~5 000 zł"
          progress={
            (runway /
              runwayTarget) *
            100
          }
          icon={
            <Palmtree className="text-green-400" />
          }
          progressColor="bg-green-500"
        />
      </section>

      {/* GOALS */}

      <GoalsSection
        goals={goals}
      />

      {/* INVESTMENTS */}

      <InvestmentSection
        portfolio={portfolio}
        history={
          netWorthHistory
        }
      />

      {/* LIABILITIES */}

      <LiabilitiesSection
        liabilities={
          liabilities
        }
      />

      {/* CASHFLOW */}

      <CashflowSection
        budget={monthlyBudget}
        onAddExpenseClick={() =>
          setIsAddExpenseOpen(
            true
          )
        }
      />

      {isAddExpenseOpen && (
        <AddExpenseModal
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
    </main>
  );
}