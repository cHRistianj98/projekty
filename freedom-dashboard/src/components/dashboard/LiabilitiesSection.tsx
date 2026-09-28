import { ArrowRight, Car, CreditCard, Home, Landmark, Percent, ReceiptText, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Liability, LiabilityType } from "../../types/Liability";

type Props = { liabilities: Liability[] };

const money = (value: number) => `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;

const typeMeta: Record<LiabilityType, { label: string; icon: typeof Landmark; image: string }> = {
  MORTGAGE: { label: "Hipoteka", icon: Home, image: "linear-gradient(135deg, rgba(14,165,233,.28), rgba(2,6,23,.92)), radial-gradient(circle at 75% 20%, rgba(56,189,248,.30), transparent 35%)" },
  CASH_LOAN: { label: "Kredyt gotówkowy", icon: Landmark, image: "linear-gradient(135deg, rgba(239,68,68,.24), rgba(2,6,23,.94)), radial-gradient(circle at 80% 20%, rgba(251,146,60,.28), transparent 35%)" },
  CAR_LOAN: { label: "Auto", icon: Car, image: "linear-gradient(135deg, rgba(59,130,246,.28), rgba(2,6,23,.94)), radial-gradient(circle at 78% 18%, rgba(96,165,250,.32), transparent 35%)" },
  LEASING: { label: "Leasing", icon: Car, image: "linear-gradient(135deg, rgba(139,92,246,.28), rgba(2,6,23,.94)), radial-gradient(circle at 78% 18%, rgba(167,139,250,.30), transparent 35%)" },
  INSTALLMENTS: { label: "Raty", icon: ReceiptText, image: "linear-gradient(135deg, rgba(245,158,11,.25), rgba(2,6,23,.94)), radial-gradient(circle at 78% 18%, rgba(251,191,36,.28), transparent 35%)" },
  CREDIT_CARD: { label: "Karta", icon: CreditCard, image: "linear-gradient(135deg, rgba(236,72,153,.24), rgba(2,6,23,.94)), radial-gradient(circle at 78% 18%, rgba(244,114,182,.28), transparent 35%)" },
  OTHER: { label: "Inne", icon: WalletCards, image: "linear-gradient(135deg, rgba(100,116,139,.28), rgba(2,6,23,.94)), radial-gradient(circle at 78% 18%, rgba(148,163,184,.22), transparent 35%)" },
};

export function LiabilitiesSection({ liabilities }: Props) {
  const navigate = useNavigate();
  const total = liabilities.reduce((sum, item) => sum + item.remainingAmount, 0);
  const monthly = liabilities.reduce((sum, item) => sum + item.monthlyPayment, 0);
  const interest = liabilities.reduce((sum, item) => sum + (item.interestPayment ?? 0), 0);
  const visible = [...liabilities].sort((a, b) => b.remainingAmount - a.remainingAmount).slice(0, 3);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Debt Control</p>
          <h2 className="mt-2 text-lg font-black text-white">Zobowiązania</h2>
          <p className="mt-1 text-xs text-slate-500">Najważniejsze długi, koszt rat i postęp spłaty.</p>
        </div>
        <button onClick={() => navigate("/liabilities")} className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300">Zobacz wszystkie <ArrowRight size={15} /></button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniMetric label="Pozostały dług" value={money(total)} />
        <MiniMetric label="Raty / miesiąc" value={money(monthly)} />
        <MiniMetric label="Odsetki w ratach" value={money(interest)} accent />
      </div>

      {visible.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          {visible.map((liability) => {
            const type = liability.type ?? "OTHER";
            const meta = typeMeta[type];
            const Icon = meta.icon;
            const paid = Math.max(liability.originalAmount - liability.remainingAmount, 0);
            const progress = liability.originalAmount > 0 ? Math.min((paid / liability.originalAmount) * 100, 100) : 0;
            return (
              <button key={liability.id} type="button" onClick={() => navigate("/liabilities")} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-0 text-left transition hover:-translate-y-0.5 hover:border-slate-700">
                <div className="relative h-24 overflow-hidden border-b border-white/5" style={{ backgroundImage: meta.image }}>
                  <div className="absolute -right-4 -top-5 opacity-15 transition group-hover:scale-110 group-hover:opacity-25"><Icon size={120} strokeWidth={1.1} /></div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4 pt-10">
                    <span className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300 backdrop-blur">{meta.label}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-black text-white">{liability.name}</p><p className="mt-1 text-[11px] text-slate-500">Pozostało {money(liability.remainingAmount)}</p></div>
                    <div className="text-right"><p className="font-black text-white">{money(liability.monthlyPayment)}</p><p className="text-[10px] text-slate-600">/ miesiąc</p></div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-2 flex justify-between text-[10px] font-semibold"><span className="text-emerald-400">Spłacono {progress.toFixed(1)}%</span><span className="flex items-center gap-1 text-slate-500"><Percent size={10} /> {liability.interestRate}%</span></div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 p-8 text-center"><p className="font-black text-emerald-300">Zero zobowiązań. Piękny widok 😎</p></div>
      )}
    </section>
  );
}

function MiniMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{label}</p><p className={`mt-2 text-lg font-black ${accent ? "text-amber-400" : "text-white"}`}>{value}</p></div>;
}
