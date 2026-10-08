import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowRight, LoaderCircle, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { portfolioApi } from "../../api/portfolioApi";
import type { Asset } from "../../types/Asset";
import type { PortfolioWallet } from "../../types/Portfolio";
import { useLanguage } from "../../i18n/LanguageContext";

type PortfolioChartProps = {
  portfolio: Asset[];
};

type WalletSlice = {
  wallet: PortfolioWallet;
  assets: Asset[];
  value: number;
};

export function PortfolioChart({ portfolio }: PortfolioChartProps) {
  const navigate = useNavigate();
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 2,
    }).format(value);

  const [wallets, setWallets] = useState<PortfolioWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portfolioApi.getAll()
      .then((rows) => {
        if (!cancelled) setWallets(rows);
      })
      .catch(() => {
        if (!cancelled) setWallets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [portfolio]);

  const walletSlices = useMemo<WalletSlice[]>(() => {
    return wallets
      .filter((wallet) => wallet.type !== "GOALS")
      .map((wallet) => {
        const assets = portfolio
          .filter((asset) => asset.portfolioId === wallet.id)
          .sort((a, b) => b.value - a.value);
        return {
          wallet,
          assets,
          value: assets.reduce((sum, asset) => sum + asset.value, 0),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [portfolio, wallets]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <WalletCards size={17} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              {ui("Struktura portfeli", "Portfolio structure")}
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {ui(
              "Każdy portfel osobno — bez mieszania wszystkich aktywów w jednym wykresie.",
              "Each portfolio is shown separately — assets are not mixed into one chart."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/investments")}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          {ui("Inwestycje", "Investments")} <ArrowRight size={13} />
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" /> {ui("Pobieranie portfeli…", "Loading portfolios…")}
        </div>
      ) : walletSlices.length === 0 ? (
        <div className="flex min-h-44 items-center justify-center text-sm text-slate-500">
          {ui("Brak portfeli do wyświetlenia.", "No portfolios to display.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {walletSlices.map(({ wallet, assets, value }) => {
            const positiveAssets = assets.filter((asset) => asset.value > 0);
            const topAssets = assets.slice(0, 4);
            return (
              <button
                key={wallet.id}
                type="button"
                onClick={() => navigate("/investments")}
                className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#081421] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-500/25 hover:bg-[#0a1828]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: wallet.color }}
                      />
                      <h3 className="truncate text-sm font-black text-white">{wallet.name}</h3>
                      {wallet.systemPortfolio && (
                        <span className="rounded-md border border-blue-400/20 bg-blue-400/10 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-blue-300">
                          SYSTEM
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {assets.length} {language === "pl"
                        ? assets.length === 1 ? "aktywo" : "aktywów"
                        : assets.length === 1 ? "asset" : "assets"}
                    </p>
                  </div>
                  <strong className="shrink-0 text-base font-black text-white">{money(value)}</strong>
                </div>

                <div className="mt-3 grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3">
                  <div className="relative h-[92px] w-[92px]">
                    {positiveAssets.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={positiveAssets}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={27}
                            outerRadius={41}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {positiveAssets.map((asset) => (
                              <Cell key={asset.id} fill={asset.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(raw) => money(Number(raw))}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid #334155",
                              borderRadius: "10px",
                              color: "#fff",
                              fontSize: "11px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-2 rounded-full border-[10px] border-slate-800" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-2">
                    {topAssets.map((asset) => {
                      const share = value > 0 && asset.value > 0 ? asset.value / value * 100 : null;
                      const unallocatedDeficit = asset.systemCash && asset.value < 0;
                      return (
                        <div key={asset.id} className="flex min-w-0 items-center gap-2 text-[11px]">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: asset.color }} />
                          <span className="min-w-0 flex-1 truncate text-slate-300" title={asset.name}>
                            {asset.systemCash ? ui("Środki nierozdzielone", "Unallocated funds") : asset.name}
                          </span>
                          {unallocatedDeficit ? (
                            <span className="shrink-0 font-black text-amber-300">{money(asset.value)}</span>
                          ) : (
                            <>
                              {share != null && (
                                <span className="shrink-0 text-slate-600">{share.toFixed(1)}%</span>
                              )}
                              <span className="shrink-0 font-bold text-slate-200">{money(asset.value)}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {assets.length > 4 && (
                      <p className="pt-0.5 text-[10px] font-semibold text-slate-600">
                        + {assets.length - 4} {ui("pozostałych aktywów", "more assets")}
                      </p>
                    )}
                    {!assets.length && (
                      <p className="text-[11px] text-slate-600">{ui("Portfel jest pusty.", "The portfolio is empty.")}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
