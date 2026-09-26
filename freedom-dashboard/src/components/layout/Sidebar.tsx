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
  Mountain,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { calculateLevelProgress } from "../../utils/levels";

const menuItems = [
  {
    name: "Dashboard",
    icon: House,
    path: "/",
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
};

export function Sidebar({
  netWorth,
}: SidebarProps) {
  const levelProgress =
    calculateLevelProgress(netWorth);

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

      {/* LEVEL */}

      <div
        className="
          mt-auto
          rounded-2xl
          border border-slate-800
          bg-slate-900
          p-4
        "
      >
        {/* LEVEL NUMBER */}

        <div className="text-xs text-slate-500">
          LEVEL {levelProgress.currentLevel.level}
        </div>

        {/* LEVEL NAME */}

        <div className="mt-1 flex items-center justify-between">
          <span className="font-semibold">
            {levelProgress.currentLevel.name}
          </span>

          <span className="text-xs font-semibold text-blue-400">
            {levelProgress.progress.toFixed(0)}%
          </span>
        </div>

        {/* PROGRESS BAR */}

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
              bg-blue-500
              transition-all
              duration-500
            "
            style={{
              width: `${levelProgress.progress}%`,
            }}
          />
        </div>

        {/* CURRENT / TARGET */}

        <div
          className="
            mt-2
            flex
            justify-between
            text-xs
            text-slate-500
          "
        >
          <span>
            {netWorth.toLocaleString("pl-PL")} zł
          </span>

          <span>
            {levelProgress.targetAmount !== null
              ? `${levelProgress.targetAmount.toLocaleString(
                  "pl-PL"
                )} zł`
              : "FREE"}
          </span>
        </div>

        {/* NEXT LEVEL */}

        {levelProgress.nextLevel && (
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
            Do{" "}
            <span className="font-medium text-slate-300">
              {levelProgress.nextLevel.name}
            </span>
            :{" "}
            <span className="font-semibold text-blue-400">
              {levelProgress.remainingAmount.toLocaleString(
                "pl-PL"
              )}{" "}
              zł
            </span>
          </div>
        )}

        {/* FINAL LEVEL */}

        {!levelProgress.nextLevel && (
          <div
            className="
              mt-3
              border-t
              border-slate-800
              pt-3
              text-xs
              font-semibold
              text-emerald-400
            "
          >
            🏆 Finansowa wolność osiągnięta
          </div>
        )}
      </div>
    </aside>
  );
}