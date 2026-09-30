export const BELKA_TAX_RATE = 0.19;

export function calculateRetailBondValuation(purchaseValue: number, grossValue: number) {
  const safePurchase = Number.isFinite(purchaseValue) && purchaseValue >= 0 ? purchaseValue : 0;
  const safeGross = Number.isFinite(grossValue) && grossValue >= 0 ? grossValue : 0;
  const taxableGain = Math.max(safeGross - safePurchase, 0);
  const taxAmount = taxableGain * BELKA_TAX_RATE;
  const netValue = Math.max(safeGross - taxAmount, 0);
  return { taxableGain, taxAmount, netValue };
}

type Props = {
  purchaseValue: string;
  onPurchaseValueChange: (value: string) => void;
  grossValue: string;
  onGrossValueChange: (value: string) => void;
};

export function RetailBondValuationPanel({
  purchaseValue,
  onPurchaseValueChange,
  grossValue,
  onGrossValueChange,
}: Props) {
  const purchase = Number(purchaseValue);
  const gross = Number(grossValue);
  const valid = purchaseValue.trim() !== "" && grossValue.trim() !== "" && Number.isFinite(purchase) && purchase > 0 && Number.isFinite(gross) && gross >= 0;
  const result = calculateRetailBondValuation(purchase, gross);
  const money = (value: number) => value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4 rounded-2xl border border-sky-500/15 bg-gradient-to-br from-sky-500/[.07] to-slate-950/30 p-4">
      <div>
        <div className="text-sm font-black text-white">Wycena obligacji detalicznych</div>
        <div className="mt-1 text-xs text-slate-500">
          Freedom odejmuje szacowany 19% podatek Belki tylko od dodatniego zysku/odsetek, nie od wpłaconego kapitału.
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Kapitał początkowy</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchaseValue}
              onChange={(event) => onPurchaseValueChange(event.target.value)}
              placeholder="1000"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 pr-12 font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">zł</span>
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Bieżąca wartość brutto</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={grossValue}
              onChange={(event) => onGrossValueChange(event.target.value)}
              placeholder="1200"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 pr-12 font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">zł</span>
          </div>
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <Stat label="Zysk brutto" value={valid ? `${money(result.taxableGain)} zł` : "—"} />
        <Stat label="Podatek 19%" value={valid ? `-${money(result.taxAmount)} zł` : "—"} tone="tax" />
        <Stat label="Wartość brutto" value={valid ? `${money(gross)} zł` : "—"} />
        <Stat label="Wartość netto" value={valid ? `${money(result.netValue)} zł` : "—"} tone="net" />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
        To estymacja wartości po podatku. Nie uwzględnia opłaty za przedterminowy wykup ani odsetek, które zostały już wcześniej wypłacone i opodatkowane.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "tax" | "net" }) {
  const valueClass = tone === "tax" ? "text-rose-300" : tone === "net" ? "text-emerald-300" : "text-white";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
      <div className="text-[10px] font-black uppercase tracking-[.11em] text-slate-600">{label}</div>
      <div className={`mt-1.5 text-sm font-black ${valueClass}`}>{value}</div>
    </div>
  );
}
