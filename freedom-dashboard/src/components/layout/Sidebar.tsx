import {
  House,
  Wallet,
  ChartNoAxesCombined,
  Target,
  PiggyBank,
  Landmark,
  ChartPie,
  Calculator,
  Trophy,
  BrainCircuit,
  Mountain,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import {
  calculatePlayerLevel,
  calculateTotalAchievementXp,
  getAchievements,
} from "../../features/achievements/achievementEngine";

import type { MonthlyBudget } from "../../types/Cashflow";
import type { Asset } from "../../types/Asset";
import type { Goal } from "../../types/Goal";
import type { Liability } from "../../types/Liability";

const menuItems = [
  {
    name: "Dashboard",
    icon: House,
    path: "/",
  },
  {
    name: "Freedom Engine",
    icon: BrainCircuit,
    path: "/freedom",
  },
  {
    name: "Finanse",
    icon: Wallet,
    path: "/finances",
  },
  {
    name: "Inwestycje",
    icon: ChartNoAxesCombined,
    path: "/investments",
  },
  {
    name: "Cele",
    icon: Target,
    path: "/goals",
  },
  {
    name: "Budżet",
    icon: PiggyBank,
    path: "/budget",
  },
  {
    name: "Zobowiązania",
    icon: Landmark,
    path: "/liabilities",
  },
  {
    name: "Analizy",
    icon: ChartPie,
    path: "/analytics",
  },
  {
    name: "Symulator",
    icon: Calculator,
    path: "/simulator",
  },
  {
    name: "Osiągnięcia",
    icon: Trophy,
    path: "/achievements",
  },
];

type SidebarProps = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export function Sidebar({
  netWorth,
  portfolio,
  goals,
  liabilities,
  monthlyBudget,
}: SidebarProps) {
  const achievements = getAchievements({
    netWorth,
    portfolio,
    goals,
    liabilities,
    monthlyBudget,
  });

  const totalXp = calculateTotalAchievementXp(achievements);
  const playerLevel = calculatePlayerLevel(totalXp);

  return (
    <aside
      className="
        fixed left-0 top-0
        flex h-screen w-64
        flex-col
        border-r border-slate-800
        bg-[#08111f]
        p-5
      "
    >
      {/* LOGO */}

      <div className="mb-10 flex items-center gap-3">
        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-xl
            bg-blue-600
          "
        >
          <Mountain size={28} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-wider">
            FREEDOM
          </h1>

          <p className="text-xs text-slate-500">
            Twoja gra finansowa
          </p>
        </div>
      </div>

      {/* MENU */}

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `
                flex w-full items-center gap-3
                rounded-xl
                px-4 py-3
                text-left text-sm
                transition

                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon size={19} />

              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* PLAYER LEVEL — XP IS THE SINGLE SOURCE OF TRUTH */}

      <div
        className="
          mt-auto
          rounded-2xl
          border border-slate-800
          bg-slate-900
          p-4
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">
              PLAYER LEVEL {playerLevel.level}
            </div>

            <div className="mt-1 font-semibold">
              {playerLevel.name}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-blue-400">
              {playerLevel.progress.toFixed(0)}%
            </div>

            <div className="mt-1 text-[10px] text-slate-600">
              {totalXp.toLocaleString("pl-PL")} XP total
            </div>
          </div>
        </div>

        <div
          className="
            mt-4
            h-2
            overflow-hidden
            rounded-full
            bg-slate-800
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-blue-600
              to-cyan-400
              transition-all
              duration-500
            "
            style={{
              width: `${playerLevel.progress}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>
            {playerLevel.currentXp.toLocaleString("pl-PL")} XP
          </span>

          <span>
            {playerLevel.requiredXp.toLocaleString("pl-PL")} XP
          </span>
        </div>

        {playerLevel.remainingXp > 0 ? (
          <div
            className="
              mt-3
              border-t
              border-slate-800
              pt-3
              text-xs
              text-slate-500
            "
          >
            Do następnego poziomu:{" "}
            <span className="font-semibold text-blue-400">
              {playerLevel.remainingXp.toLocaleString("pl-PL")} XP
            </span>
          </div>
        ) : (
          <div
            className="
              mt-3
              border-t
              border-slate-800
              pt-3
              text-xs
              font-semibold
              text-amber-400
            "
          >
            🏆 Maksymalny Player Level
          </div>
        )}

        <div
          className="
            mt-3
            border-t
            border-slate-800
            pt-3
            text-[10px]
            leading-4
            text-slate-600
          "
        >
          Level rośnie z XP za osiągnięcia. Majątek ma osobną ścieżkę
          milestone&apos;ów.
        </div>
      </div>
    </aside>
  );
}