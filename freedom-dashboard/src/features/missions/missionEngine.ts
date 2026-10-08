import { createElement, type ReactNode } from "react";
import { Banknote, Landmark, Target, TrendingUp } from "lucide-react";

import type { Asset } from "../../types/Asset";
import type { Goal, GoalPriority } from "../../types/Goal";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
import type { AppLanguage } from "../../i18n/LanguageContext";
import { calculateFreedomEngine } from "../freedom/freedomEngine";

export type MissionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "GROWTH";
export type MissionStatus = "ACTIVE" | "COMPLETE";
export type MissionAccent = "rose" | "amber" | "blue" | "cyan" | "violet" | "emerald";
export type MissionUnit = "money" | "percent" | "count";

export type FreedomMission = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  progress: number;
  footer: string;
  unit: MissionUnit;
  priority: MissionPriority;
  status: MissionStatus;
  accent: MissionAccent;
  icon: ReactNode;
  source: "GOAL" | "DEBT" | "CASHFLOW";
  goalId?: number;
  imageUrl?: string;
  imagePosition?: "center" | "top" | "bottom";
};

export type MissionEngineInput = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export function getFreedomMissions(
  input: MissionEngineInput,
  language: AppLanguage = "pl"
): FreedomMission[] {
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const engine = calculateFreedomEngine(input, language);

  const activeGoals = input.goals
    .filter((goal) => goal.targetAmount > goal.currentAmount)
    .sort(compareGoals);

  const goalMissions = activeGoals.map((goal) => toGoalMission(goal, language));

  const totalDebt = input.liabilities.reduce(
    (sum, liability) => sum + Math.max(liability.remainingAmount, 0),
    0
  );
  const grossAssets = input.portfolio.reduce(
    (sum, asset) => sum + Math.max(asset.value, 0),
    0
  );
  const debtTarget = Math.max(grossAssets * 0.1, 0);
  const debtNeedsAttention = totalDebt > debtTarget && totalDebt > 0;

  const debtMission: FreedomMission = {
    id: "system-debt-attack",
    title: ui("Atak na dług", "Debt Attack"),
    description: ui(
      "Zredukuj kosztowne zobowiązania i odzyskaj większą część miesięcznego przepływu pieniężnego.",
      "Reduce expensive liabilities and reclaim more of your monthly cashflow."
    ),
    current: totalDebt,
    target: debtTarget,
    progress: debtNeedsAttention
      ? clamp(((totalDebt - debtTarget) <= 0 ? 1 : 1 - (totalDebt - debtTarget) / Math.max(totalDebt, 1)) * 100)
      : 100,
    footer: debtNeedsAttention
      ? ui(
          `Do poziomu 10% aktywów brutto brakuje redukcji o ${formatMoney(totalDebt - debtTarget, language)}.`,
          `A reduction of ${formatMoney(totalDebt - debtTarget, language)} is needed to reach 10% of gross assets.`
        )
      : ui("Poziom długu mieści się w limicie silnika.", "Debt is within the Engine limit."),
    unit: "money",
    priority: debtNeedsAttention ? "HIGH" : "MEDIUM",
    status: debtNeedsAttention ? "ACTIVE" : "COMPLETE",
    accent: "amber",
    icon: createElement(Landmark, { size: 20 }),
    source: "DEBT",
  };

  const cashflowTarget = 50;
  const cashflowComplete = engine.savingsRate >= cashflowTarget && engine.averageSurplus > 0;
  const cashflowMission: FreedomMission = {
    id: "system-cashflow",
    title: ui("Utrzymaj maszynę w ruchu", "Keep The Machine Running"),
    description: ui(
      "Utrzymuj dodatni średni przepływ pieniężny i wysoką stopę oszczędności.",
      "Maintain positive rolling cashflow and a high savings rate."
    ),
    current: Math.max(engine.savingsRate, 0),
    target: cashflowTarget,
    progress: clamp((Math.max(engine.savingsRate, 0) / cashflowTarget) * 100),
    footer: ui(
      `${engine.savingsRate.toFixed(1)}% średnia stopa oszczędności · ${formatSignedMoney(engine.averageSurplus, language)} / mies.`,
      `${engine.savingsRate.toFixed(1)}% rolling savings rate · ${formatSignedMoney(engine.averageSurplus, language)} / month`
    ),
    unit: "percent",
    priority: cashflowComplete ? "GROWTH" : engine.averageSurplus <= 0 ? "CRITICAL" : "GROWTH",
    status: cashflowComplete ? "COMPLETE" : "ACTIVE",
    accent: engine.averageSurplus <= 0 ? "rose" : "cyan",
    icon: createElement(TrendingUp, { size: 20 }),
    source: "CASHFLOW",
  };

  const activeQueue: FreedomMission[] = [];
  if (goalMissions[0]) activeQueue.push(goalMissions[0]);
  if (debtNeedsAttention) activeQueue.push(debtMission);
  if (!cashflowComplete) activeQueue.push(cashflowMission);
  if (activeQueue.length < 3 && goalMissions[1]) activeQueue.push(goalMissions[1]);
  if (activeQueue.length < 3 && !activeQueue.some((m) => m.id === debtMission.id)) activeQueue.push(debtMission);
  if (activeQueue.length < 3 && !activeQueue.some((m) => m.id === cashflowMission.id)) activeQueue.push(cashflowMission);

  return activeQueue.slice(0, 3);
}

function toGoalMission(goal: Goal, language: AppLanguage): FreedomMission {
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const target = Math.max(goal.targetAmount, 0);
  const current = Math.max(goal.currentAmount, 0);
  const complete = target > 0 && current >= target;
  const remaining = Math.max(target - current, 0);

  return {
    id: `goal-${goal.id}`,
    title: goal.name,
    description: buildGoalDescription(goal, language),
    current,
    target,
    progress: target > 0 ? clamp((current / target) * 100) : 0,
    footer: complete
      ? ui("Cel osiągnięty.", "Goal reached.")
      : ui(
          `${formatMoney(remaining, language)} do celu${goal.targetDate ? ` · termin ${formatDate(goal.targetDate, language)}` : ""}`,
          `${formatMoney(remaining, language)} to goal${goal.targetDate ? ` · deadline ${formatDate(goal.targetDate, language)}` : ""}`
        ),
    unit: "money",
    priority: mapGoalPriority(goal.priority),
    status: complete ? "COMPLETE" : "ACTIVE",
    accent: goal.type === "EMERGENCY_FUND" ? "cyan" : goal.priority === "HIGH" ? "violet" : "blue",
    icon: createElement(goal.type === "EMERGENCY_FUND" ? Banknote : Target, { size: 20 }),
    source: "GOAL",
    goalId: goal.id,
    imageUrl: goal.imageUrl,
    imagePosition: goal.imagePosition,
  };
}

function buildGoalDescription(goal: Goal, language: AppLanguage) {
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  switch (goal.type) {
    case "EMERGENCY_FUND":
      return ui(
        "Twój prawdziwy cel bezpieczeństwa — bez osobnej, sztucznej poduszki systemowej.",
        "Your real safety goal — without a separate artificial system shield."
      );
    case "HOME":
      return ui("Buduj kapitał na własną nieruchomość.", "Build capital for your own home.");
    case "CAR":
      return ui(
        "Zbieraj kapitał na samochód bez rozwalania planu finansowego.",
        "Build your car fund without breaking the financial plan."
      );
    case "TRAVEL":
      return ui(
        "Finansuj podróż z góry zamiast z przyszłego przepływu pieniężnego.",
        "Fund the trip upfront instead of using future cashflow."
      );
    default:
      return ui(
        "Realny cel z Twojej listy celów — jego postęp napędza tę misję.",
        "A real goal from your Goals list — its progress drives this mission."
      );
  }
}

function compareGoals(a: Goal, b: Goal) {
  const priority = (value?: GoalPriority) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[value ?? "MEDIUM"]);
  const priorityDiff = priority(a.priority) - priority(b.priority);
  if (priorityDiff !== 0) return priorityDiff;
  if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
  if (a.targetDate) return -1;
  if (b.targetDate) return 1;
  return a.id - b.id;
}

function mapGoalPriority(priority?: GoalPriority): MissionPriority {
  if (priority === "HIGH") return "HIGH";
  if (priority === "LOW") return "GROWTH";
  return "MEDIUM";
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function formatMoney(value: number, language: AppLanguage) {
  return new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatSignedMoney(value: number, language: AppLanguage) {
  return `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value), language)}`;
}

function formatDate(value: string, language: AppLanguage) {
  return new Intl.DateTimeFormat(language === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
