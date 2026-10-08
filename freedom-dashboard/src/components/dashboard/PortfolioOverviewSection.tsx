import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, PieChart, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { portfolioApi } from "../../api/portfolioApi";
import type { Asset } from "../../types/Asset";
import type { PortfolioWallet } from "../../types/Portfolio";
import { DashboardSectionLink } from "./DashboardSectionLink";
import { useLanguage } from "../../i18n/LanguageContext";

type Props = {
  assets: Asset[];
};


export function PortfolioOverviewSection({ assets }: Props) {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const money = (value: number) => `${value.toLocaleString(locale, { maximumFractionDigits: 2 })} zł`;
  const [wallets, setWallets] = useState<PortfolioWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    portfolioApi.getAll()
      .then(data => { if (!cancelled) setWallets(data); })
      .catch(() => { if (!cancelled) setWallets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assets]);

  const realWallets = useMemo(
    () => wallets
      .filter(wallet => wallet.type !== "GOALS")
      .sort((a, b) => b.grossValue - a.grossValue),
    [wallets],
  );

  const visible = realWallets;
  const total = realWallets.reduce((sum, wallet) => sum + wallet.grossValue, 0);

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-[#0a1728] via-[#081321] to-[#07101c] p-6 shadow-xl shadow-black/10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <WalletCards size={19} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t("portfolioStructure")}</p>
          </div>
          <h2 className="mt-2 text-xl font-black text-white">{t("managePortfolios") === "Manage portfolios" ? "Portfolios" : "Portfele"}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("managePortfolios") === "Manage portfolios" ? "All investment strategies and their current value." : "Wszystkie strategie inwestycyjne i ich aktualna wartość."}</p>
        </div>
        <DashboardSectionLink onClick={() => navigate("/investments")}>
          {t("managePortfolios")}
        </DashboardSectionLink>
      </div>

      {loading ? (
        <div className="mt-5 flex min-h-40 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/30 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin"/> {t("managePortfolios") === "Manage portfolios" ? "Loading portfolios…" : "Pobieranie portfeli…"}
        </div>
      ) : visible.length ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {visible.map(wallet => {
            const walletAssets = assets.filter(asset => asset.portfolioId === wallet.id);
            const progress = wallet.targetAmount && wallet.targetAmount > 0
              ? Math.min(wallet.grossValue / wallet.targetAmount * 100, 100)
              : null;
            const share = total > 0 ? wallet.grossValue / total * 100 : 0;
            return (
              <button
                key={wallet.id}
                type="button"
                onClick={() => navigate("/investments")}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#091525] text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-950/15"
              >
                <div className="relative h-28 overflow-hidden border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-slate-950">
                  {wallet.imageUrl ? (
                    <img
                      src={wallet.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      style={{ objectPosition: wallet.imagePosition ?? "center" }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(34,211,238,.22),transparent_36%),linear-gradient(135deg,rgba(14,116,144,.18),rgba(2,6,23,.9))]"/>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091525] via-[#091525]/20 to-black/5"/>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-white drop-shadow-lg">{wallet.name}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-slate-300/80">{walletAssets.length} {t("managePortfolios") === "Manage portfolios" ? "assets" : "aktywów"}</p>
                    </div>
                    <span className="rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-black text-cyan-200 backdrop-blur">{share.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{t("managePortfolios") === "Manage portfolios" ? "Value" : "Wartość"}</p>
                      <p className="mt-1 text-xl font-black text-white">{money(wallet.grossValue)}</p>
                    </div>
                    {wallet.allocatedOut > 0 && (
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-wider text-violet-400">{t("managePortfolios") === "Manage portfolios" ? "Reserve" : "Rezerwa"}</p>
                        <p className="mt-1 text-xs font-black text-violet-300">{money(wallet.allocatedOut)}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${progress ?? Math.min(share, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600">
                    <span>{wallet.targetAmount ? `Cel ${money(wallet.targetAmount)}` : "Bez kwoty docelowej"}</span>
                    <span className="inline-flex items-center gap-1 text-slate-500"><PieChart size={11}/>{progress == null ? "—" : `${progress.toFixed(0)}%`}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <button type="button" onClick={() => navigate("/investments")} className="mt-5 w-full rounded-2xl border border-dashed border-cyan-500/20 bg-cyan-500/5 p-8 text-center text-sm font-semibold text-cyan-300">
          Dodaj pierwszy portfel →
        </button>
      )}
    </section>
  );
}
