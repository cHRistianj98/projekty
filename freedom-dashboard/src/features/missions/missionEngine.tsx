import type { ReactNode } from "react";
import {
  Flame,
  Landmark,
  Rocket,
  ShieldCheck,
  Target,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import type { Asset } from "../../types/Asset";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
import {
  getAchievements,
  type Achievement,
} from "../achievements/achievementEngine";
import { calculateFreedomEngine } from "../freedom/freedomEngine";

export type MissionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "GROWTH";
export type MissionUnit = "money" | "percent" | "months" | "count";

export type FreedomMission = {
  id: string;
  title: string;
  description: string;
  priority: MissionPriority;
  current: number;
  target: number;
  progress: number;
  unit: MissionUnit;
  status: "ACTIVE" | "COMPLETE";
  icon: ReactNode;
  accent: "rose" | "amber" | "blue" | "cyan" | "violet" | "emerald";
  footer: string;
  achievement?: Achievement;
};

export type MissionEngineInput = {
  netWorth: number;
  portfolio: Asset[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export function getFreedomMissions(input: MissionEngineInput): FreedomMission[] {
  const engine = calculateFreedomEngine(input);

  const achievements = getAchievements({
    ...input,
    goals: [],
  });

  const candidates: FreedomMission[] = [];

  // 1. Fundament: płynna poduszka.
  if (engine.safetyMonths < 6) {
    const target = Math.max(engine.averageExpenses * 6, 1);
    candidates.push(
      createMission({
        id: "safety-shield",
        title: "Build The Shield",
        description: "Zbuduj płynną poduszkę równą 6 miesiącom średnich wydatków.",
        priority: engine.safetyMonths < 3 ? "CRITICAL" : "HIGH",
        current: engine.liquidAssets,
        target,
        unit: "money",
        icon: <ShieldCheck size={22} />,
        accent: engine.safetyMonths < 3 ? "rose" : "amber",
        footer: `Masz ${engine.safetyMonths.toFixed(1)} mies. bezpieczeństwa`,
      })
    );
  }

  // 2. Dług: jeżeli zobowiązania są istotne względem aktywów, redukujemy je.
  const totalDebt = input.liabilities.reduce(
    (sum, liability) => sum + Math.max(liability.remainingAmount, 0),
    0
  );

  const grossAssets = input.portfolio.reduce(
    (sum, asset) => sum + Math.max(asset.value, 0),
    0
  );

  const debtRatio = grossAssets > 0 ? (totalDebt / grossAssets) * 100 : 0;

  if (totalDebt > 0 && debtRatio >= 10) {
    const targetDebt = grossAssets * 0.1;
    const amountToReduce = Math.max(totalDebt - targetDebt, 0);

    candidates.push(
      createReductionMission({
        id: "debt-attack",
        title: "Debt Attack",
        description: "Zredukuj zobowiązania poniżej 10% wartości aktywów brutto.",
        priority: debtRatio >= 30 ? "CRITICAL" : "HIGH",
        current: totalDebt,
        target: targetDebt,
        initialGap: Math.max(amountToReduce, 1),
        unit: "money",
        icon: <TrendingDown size={22} />,
        accent: debtRatio >= 30 ? "rose" : "amber",
        footer: `Dług stanowi ${debtRatio.toFixed(1)}% aktywów brutto`,
      })
    );
  }

  // 3. Inwestowanie: po zabezpieczeniu fundamentów.
  if (engine.investmentRatio < 50) {
    candidates.push(
      createMission({
        id: "investor-mode",
        title: "Investor Mode",
        description: "Zwiększ udział kapitału inwestycyjnego do 50% aktywów brutto.",
        priority: engine.safetyMonths >= 6 ? "MEDIUM" : "GROWTH",
        current: engine.investmentRatio,
        target: 50,
        unit: "percent",
        icon: <WalletCards size={22} />,
        accent: "violet",
        footer: `${formatMoney(engine.investedAssets)} pracuje jako kapitał inwestycyjny`,
      })
    );
  }

  // 4. Cashflow: aktywna misja, gdy średnia jest słaba.
  if (engine.averageSurplus <= 0) {
    candidates.push(
      createMission({
        id: "positive-cashflow",
        title: "Turn Cashflow Green",
        description: "Doprowadź rolling cashflow do dodatniej wartości.",
        priority: "CRITICAL",
        current: Math.max(engine.averageSurplus, 0),
        target: Math.max(engine.averageExpenses * 0.1, 1_000),
        unit: "money",
        icon: <Flame size={22} />,
        accent: "rose",
        footer: `Rolling ${engine.rollingMonths}M: ${formatSignedMoney(engine.averageSurplus)}`,
      })
    );
  } else {
    candidates.push(
      createMission({
        id: "cashflow-streak",
        title: "Keep The Machine Running",
        description: "Utrzymuj dodatni cashflow i wysoką stopę oszczędności.",
        priority: "GROWTH",
        current: Math.min(engine.savingsRate, 50),
        target: 50,
        unit: "percent",
        icon: <Flame size={22} />,
        accent: "cyan",
        footer: `${engine.savingsRate.toFixed(1)}% rolling savings rate`,
      })
    );
  }

  // 5. Zawsze pokazujemy kolejny realny milestone majątku.
  if (engine.nextMilestone) {
    const wealthAchievement = achievements.find(
      (achievement) =>
        achievement.category === "wealth" &&
        !achievement.unlocked &&
        achievement.target === engine.nextMilestone?.value
    );

    candidates.push(
      createMission({
        id: `wealth-${engine.nextMilestone.value}`,
        title: `Next Milestone — ${engine.nextMilestone.name}`,
        description: `Osiągnij ${formatMoney(engine.nextMilestone.value)} majątku netto.`,
        priority: "GROWTH",
        current: input.netWorth,
        target: engine.nextMilestone.value,
        unit: "money",
        icon: <Rocket size={22} />,
        accent: "blue",
        footer: wealthAchievement
          ? `Reward → ${wealthAchievement.name} • +${wealthAchievement.xp} XP`
          : `Brakuje ${formatMoney(engine.amountToNextMilestone)}`,
        achievement: wealthAchievement,
      })
    );
  }

  // 6. Gdy fundamenty są świetne, dajemy misję FREE zamiast pustego slotu.
  if (candidates.length < 3 && input.netWorth < engine.freedomTarget) {
    candidates.push(
      createMission({
        id: "freedom-target",
        title: "Road To FREE",
        description: "Buduj majątek w kierunku głównego celu FREEDOM.",
        priority: "GROWTH",
        current: input.netWorth,
        target: engine.freedomTarget,
        unit: "money",
        icon: <Target size={22} />,
        accent: "emerald",
        footer: `${engine.progressToFreedom.toFixed(2)}% głównego celu`,
      })
    );
  }

  return candidates
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority))
    .slice(0, 3);
}

function createMission(
  data: Omit<FreedomMission, "progress" | "status">
): FreedomMission {
  const safeCurrent = Math.max(data.current, 0);
  const progress =
    data.target > 0 ? Math.min((safeCurrent / data.target) * 100, 100) : 0;

  return {
    ...data,
    current: safeCurrent,
    progress,
    status: progress >= 100 ? "COMPLETE" : "ACTIVE",
  };
}

function createReductionMission({
  initialGap,
  ...data
}: Omit<FreedomMission, "progress" | "status"> & { initialGap: number }): FreedomMission {
  const remainingGap = Math.max(data.current - data.target, 0);
  const progress =
    remainingGap <= 0
      ? 100
      : Math.max(0, Math.min(100, (1 - remainingGap / initialGap) * 100));

  return {
    ...data,
    progress,
    status: remainingGap <= 0 ? "COMPLETE" : "ACTIVE",
  };
}

function priorityWeight(priority: MissionPriority) {
  return {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    GROWTH: 3,
  }[priority];
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("pl-PL")} zł`;
}

function formatSignedMoney(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${Math.round(value).toLocaleString("pl-PL")} zł`;
}
