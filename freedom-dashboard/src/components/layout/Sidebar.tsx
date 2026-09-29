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
  ClipboardCheck,
  Mountain,
  LogOut,
  History,
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
    name: "Timeline",
    icon: History,
    path: "/timeline",
  },
  {
    name: "Review",
    icon: ClipboardCheck,
    path: "/review",
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
  userEmail: string;
  onLogout: () => void;
};

export function Sidebar({
  netWorth,
  portfolio,
  goals,
  liabilities,
  monthlyBudget,
  userEmail,
  onLogout,
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
        freedom-sidebar fixed left-0 top-0 z-40
        flex h-dvh w-[196px]
        flex-col
        border-r border-slate-800
        bg-[#08111f]
        p-3
      "
    >
      {/* LOGO */}

      <div className="sidebar-brand mb-6 flex items-center gap-2">
        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            bg-blue-600
          "
        >
          <Mountain size={28} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight">
            FREEDOM
          </h1>

          <p className="text-xs text-slate-500">
            Twoja gra finansowa
          </p>
        </div>
      </div>

      {/* MENU */}

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              title={item.name}
              className={({ isActive }) => `
                flex w-full items-center gap-3
                rounded-xl
                px-3 py-2.5
                text-left text-xs
                transition

                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon size={19} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* PLAYER LEVEL — XP IS THE SINGLE SOURCE OF TRUTH */}

      <div
        className="
          sidebar-player mt-auto
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

      {/* AUTHENTICATED USER */}

      <div
        className="
          sidebar-account mt-3
          rounded-2xl
          border border-slate-800
          bg-[#0a1525]
          p-3
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl
              border border-violet-500/20
              bg-violet-500/10
              text-xs font-black uppercase
              text-violet-300
            "
          >
            {userEmail.charAt(0) || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="
                text-[10px] font-black uppercase
                tracking-[0.12em] text-slate-600
              "
            >
              Signed in
            </div>

            <div
              className="
                mt-0.5 truncate
                text-xs font-semibold
                text-slate-300
              "
              title={userEmail}
            >
              {userEmail}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl
              border border-slate-800
              bg-slate-900
              text-slate-500
              transition
              hover:border-red-500/30
              hover:bg-red-500/10
              hover:text-red-300
            "
            title="Wyloguj"
            aria-label="Wyloguj"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}