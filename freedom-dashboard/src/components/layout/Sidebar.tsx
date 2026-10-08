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
  Settings as SettingsIcon,
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
import { useLanguage, type TranslationKey } from "../../i18n/LanguageContext";

const menuItems: Array<{
  key: TranslationKey;
  icon: typeof House;
  path: string;
}> = [
  { key: "dashboard", icon: House, path: "/" },
  { key: "freedomEngine", icon: BrainCircuit, path: "/freedom" },
  { key: "finances", icon: Wallet, path: "/finances" },
  { key: "investments", icon: ChartNoAxesCombined, path: "/investments" },
  { key: "goals", icon: Target, path: "/goals" },
  { key: "budget", icon: PiggyBank, path: "/budget" },
  { key: "liabilities", icon: Landmark, path: "/liabilities" },
  { key: "analytics", icon: ChartPie, path: "/analytics" },
  { key: "timeline", icon: History, path: "/timeline" },
  { key: "review", icon: ClipboardCheck, path: "/review" },
  { key: "simulator", icon: Calculator, path: "/simulator" },
  { key: "achievements", icon: Trophy, path: "/achievements" },
  { key: "settings", icon: SettingsIcon, path: "/settings" },
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
  const { t, levelName, locale } = useLanguage();

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
            {t("yourFinancialGame")}
          </p>
        </div>
      </div>

      {/* MENU */}

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === "/"}
              title={t(item.key)}
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

              <span>{t(item.key)}</span>
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
              {t("playerLevel").toUpperCase()} {playerLevel.level}
            </div>

            <div className="mt-1 font-semibold">
              {levelName(playerLevel.name)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-blue-400">
              {playerLevel.progress.toFixed(0)}%
            </div>

            <div className="mt-1 text-[10px] text-slate-600">
              {totalXp.toLocaleString(locale)} {t("totalXp")}
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
            {playerLevel.currentXp.toLocaleString(locale)} XP
          </span>

          <span>
            {playerLevel.requiredXp.toLocaleString(locale)} XP
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
            {t("toNextLevel")}:{" "}
            <span className="font-semibold text-blue-400">
              {playerLevel.remainingXp.toLocaleString(locale)} XP
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
            🏆 {t("maxPlayerLevel")}
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
          {t("levelExplanation")}
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
              {t("signedIn")}
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
            title={t("signOut")}
            aria-label={t("signOut")}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}