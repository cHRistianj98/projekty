import { BriefcaseBusiness } from "lucide-react";

import { PortfolioChart } from "./PortfolioChart";
import { NetWorthChart } from "./NetWorthChart";

import type { Asset } from "../../types/Asset";
import type { NetWorthSnapshot } from "../../types/NetWorthHistory";

type InvestmentSectionProps = {
  portfolio: Asset[];
  history: NetWorthSnapshot[];
};

export function InvestmentSection({
  portfolio,
  history,
}: InvestmentSectionProps) {
  return (
    <section className="mt-6">
      <div
        className="
          mb-4
          flex
          items-center
          gap-2
        "
      >
        <BriefcaseBusiness
          size={20}
          className="text-cyan-400"
        />

        <h2
          className="
            text-sm
            font-bold
            uppercase
            tracking-wider
            text-slate-300
          "
        >
          Wykresy majątku
        </h2>
      </div>

      <div
        className="
          grid
          grid-cols-1
          gap-4
          2xl:grid-cols-2
        "
      >
        <PortfolioChart
          portfolio={portfolio}
        />

        <NetWorthChart
          history={history}
        />
      </div>
    </section>
  );
}