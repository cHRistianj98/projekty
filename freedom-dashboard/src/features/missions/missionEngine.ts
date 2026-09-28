import { createElement, type ReactNode } from "react";
import { Banknote, Landmark, Target, TrendingUp } from "lucide-react";

import type { Asset } from "../../types/Asset";
import type { Goal, GoalPriority } from "../../types/Goal";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
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

export function getFreedomMissions(input: MissionEngineInput): FreedomMission[] {
  const engine = calculateFreedomEngine(input);

  const activeGoals = input.goals
    .filter((goal) => goal.targetAmount > goal.currentAmount)
    .sort(compareGoals);

  const goalMissions = activeGoals.map(toGoalMission);

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
    title: "Debt Attack",
    description: "Zredukuj kosztowne zobowiązania i odzyskaj większą część miesięcznego cashflow.",
    current: totalDebt,
    target: debtTarget,
    progress: debtNeedsAttention
      ? clamp(((totalDebt - debtTarget) <= 0 ? 1 : 1 - (totalDebt - debtTarget) / Math.max(totalDebt, 1)) * 100)
      : 100,
    footer: debtNeedsAttention
      ? `Do poziomu 10% aktywów brutto brakuje redukcji o ${formatMoney(totalDebt - debtTarget)}.`
      : "Poziom długu mieści się w limicie Engine.",
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
    title: "Keep The Machine Running",
    description: "Utrzymuj dodatni rolling cashflow i wysoką stopę oszczędności.",
    current: Math.max(engine.savingsRate, 0),
    target: cashflowTarget,
    progress: clamp((Math.max(engine.savingsRate, 0) / cashflowTarget) * 100),
    footer: `${engine.savingsRate.toFixed(1)}% rolling savings rate · ${formatSignedMoney(engine.averageSurplus)} / mies.`,
    unit: "percent",
    priority: cashflowComplete ? "GROWTH" : engine.averageSurplus <= 0 ? "CRITICAL" : "GROWTH",
    status: cashflowComplete ? "COMPLETE" : "ACTIVE",
    accent: engine.averageSurplus <= 0 ? "rose" : "cyan",
    icon: createElement(TrendingUp, { size: 20 }),
    source: "CASHFLOW",
  };

  // Missions are an action queue, not a second goals page.
  // Prefer the user's real goals, then fill remaining slots with system health missions.
  const activeQueue: FreedomMission[] = [];
  if (goalMissions[0]) activeQueue.push(goalMissions[0]);
  if (debtNeedsAttention) activeQueue.push(debtMission);
  if (!cashflowComplete) activeQueue.push(cashflowMission);
  if (activeQueue.length < 3 && goalMissions[1]) activeQueue.push(goalMissions[1]);
  if (activeQueue.length < 3 && !activeQueue.some((m) => m.id === debtMission.id)) activeQueue.push(debtMission);
  if (activeQueue.length < 3 && !activeQueue.some((m) => m.id === cashflowMission.id)) activeQueue.push(cashflowMission);

  return activeQueue.slice(0, 3);
}

function toGoalMission(goal: Goal): FreedomMission {
  const target = Math.max(goal.targetAmount, 0);
  const current = Math.max(goal.currentAmount, 0);
  const complete = target > 0 && current >= target;
  const remaining = Math.max(target - current, 0);

  return {
    id: `goal-${goal.id}`,
    title: goal.name,
    description: buildGoalDescription(goal),
    current,
    target,
    progress: target > 0 ? clamp((current / target) * 100) : 0,
    footer: complete
      ? "Cel osiągnięty."
      : `${formatMoney(remaining)} do celu${goal.targetDate ? ` · termin ${formatDate(goal.targetDate)}` : ""}`,
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

function buildGoalDescription(goal: Goal) {
  switch (goal.type) {
    case "EMERGENCY_FUND": return "Twój prawdziwy cel bezpieczeństwa — bez osobnego, sztucznego Safety Shield.";
    case "HOME": return "Buduj kapitał na własną nieruchomość.";
    case "CAR": return "Zbieraj kapitał na samochód bez rozwalania planu finansowego.";
    case "TRAVEL": return "Finansuj podróż z góry zamiast z przyszłego cashflow.";
    default: return "Realny cel z Twojej listy Goals — jego postęp napędza tę misję.";
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

function clamp(value: number) { return Math.min(Math.max(value, 0), 100); }
function formatMoney(value: number) { return `${Math.round(value).toLocaleString("pl-PL")} zł`; }
function formatSignedMoney(value: number) { return `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`; }
function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
