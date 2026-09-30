import { Building2, RefreshCw, Sparkles } from "lucide-react";
import type { RealEstateQuote } from "../../api/marketPriceApi";
import type { RealEstateMarketSegment, RealEstateValuationMode } from "../../types/Asset";

const inputClass = "w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

const segmentLabels: Record<RealEstateMarketSegment, string> = {
  ALL: "Cały rynek",
  PRIMARY: "Pierwotny",
  SECONDARY: "Wtórny",
};

export function RealEstateValuationPanel({
  enabled,
  onEnabledChange,
  city,
  onCityChange,
  district,
  onDistrictChange,
  areaSqm,
  onAreaSqmChange,
  valuationMode,
  onValuationModeChange,
  marketSegment,
  onMarketSegmentChange,
  purchasePrice,
  onPurchasePriceChange,
  purchaseDate,
  onPurchaseDateChange,
  quote,
  loading,
  error,
  onCheck,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  city: string;
  onCityChange: (value: string) => void;
  district: string;
  onDistrictChange: (value: string) => void;
  areaSqm: string;
  onAreaSqmChange: (value: string) => void;
  valuationMode: RealEstateValuationMode;
  onValuationModeChange: (value: RealEstateValuationMode) => void;
  marketSegment: RealEstateMarketSegment;
  onMarketSegmentChange: (value: RealEstateMarketSegment) => void;
  purchasePrice: string;
  onPurchasePriceChange: (value: string) => void;
  purchaseDate: string;
  onPurchaseDateChange: (value: string) => void;
  quote: RealEstateQuote | null;
  loading: boolean;
  error: string;
  onCheck: () => void;
}) {
  const anchored = valuationMode === "MARKET_ANCHORED";
  const factorPercent = quote?.qualityFactor != null ? (quote.qualityFactor - 1) * 100 : null;
  const canCheck =
    city.trim().length > 0 &&
    Number(areaSqm) > 0 &&
    (!anchored || (Number(purchasePrice) > 0 && purchaseDate.length > 0));

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[.06] to-slate-950/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <Building2 size={16} className="text-cyan-300"/>
            Automatyczna wycena mieszkania
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Dane transakcyjne RCN przez mScanner. Aktualizacja i cache backendu: 1 godzina.
          </div>
        </div>
        <button
          type="button"
          aria-label="Automatyczna wycena mieszkania"
          onClick={() => onEnabledChange(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-emerald-500" : "bg-slate-700"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {enabled && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onValuationModeChange("MARKET_MEDIAN")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                valuationMode === "MARKET_MEDIAN"
                  ? "border-cyan-400/45 bg-cyan-400/10"
                  : "border-slate-800 bg-slate-900/55"
              }`}
            >
              <div className="text-xs font-black text-white">Mediana rynku</div>
              <div className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Bieżąca mediana RCN × metraż. Najprostsza estymacja.
              </div>
            </button>
            <button
              type="button"
              onClick={() => onValuationModeChange("MARKET_ANCHORED")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                valuationMode === "MARKET_ANCHORED"
                  ? "border-violet-400/45 bg-violet-400/10"
                  : "border-slate-800 bg-slate-900/55"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <Sparkles size={13} className="text-violet-300"/>
                Zakotwiczona w cenie zakupu
              </div>
              <div className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Zachowuje realny premium/discount Twojego lokalu względem rynku z dnia zakupu.
              </div>
            </button>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Segment rynku</div>
            <div className="grid grid-cols-3 gap-2">
              {(["ALL", "PRIMARY", "SECONDARY"] as RealEstateMarketSegment[]).map((segment) => (
                <button
                  key={segment}
                  type="button"
                  onClick={() => onMarketSegmentChange(segment)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                    marketSegment === segment
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                      : "border-slate-800 bg-slate-900/55 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {segmentLabels[segment]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Miasto</span>
              <input value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="np. Wrocław" className={inputClass} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Dzielnica / osiedle</span>
              <input value={district} onChange={(e) => onDistrictChange(e.target.value)} placeholder="np. Klecina" className={inputClass} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Metraż</span>
              <div className="relative">
                <input type="number" min="1" step="0.01" value={areaSqm} onChange={(e) => onAreaSqmChange(e.target.value)} placeholder="64" className={`${inputClass} pr-12`} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">m²</span>
              </div>
            </label>
          </div>

          {anchored && (
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/[.05] p-4">
              <div className="mb-3">
                <div className="text-xs font-black text-violet-100">Kotwica Twojego mieszkania</div>
                <div className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Freedom porówna cenę, którą faktycznie zapłaciłeś, z medianą tego samego obszaru i segmentu z 12 miesięcy kończących się w dniu zakupu.
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Cena zakupu</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => onPurchasePriceChange(e.target.value)}
                      placeholder="np. 750000"
                      className={`${inputClass} pr-12`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">zł</span>
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Data zakupu</span>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => onPurchaseDateChange(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-[11px] leading-relaxed text-slate-500">
              Najpierw szukamy wskazanego osiedla/dzielnicy. Jeśli API musi spaść do całego miasta, karta wyniku pokaże to jawnie.
            </p>
            <button
              type="button"
              onClick={onCheck}
              disabled={loading || !canCheck}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
              {loading ? "Sprawdzam…" : "Sprawdź wycenę"}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-200">
              {error}
            </div>
          )}

          {quote && !error && (
            <div className="rounded-xl border border-cyan-500/15 bg-slate-950/50 p-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Rynek teraz</span>
                  <div className="mt-1 text-lg font-black text-cyan-200">
                    {Math.round(quote.medianPricePerSqm).toLocaleString("pl-PL")} zł/m²
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {segmentLabels[quote.dataMarketSegment ?? quote.marketSegment]}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    {anchored ? "Twoja estymacja" : "Estymacja"}
                  </span>
                  <div className="mt-1 text-lg font-black text-white">
                    {Math.round(quote.estimatedValue).toLocaleString("pl-PL")} zł
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {Math.round(quote.estimatedPricePerSqm).toLocaleString("pl-PL")} zł/m²
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Obszar</span>
                  <div className="mt-1 text-sm font-black text-white">{quote.resolvedArea}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{quote.scope}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Próba</span>
                  <div className="mt-1 text-sm font-black text-white">
                    {quote.recordCount != null ? `${quote.recordCount.toLocaleString("pl-PL")} transakcji` : "brak liczby"}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {quote.periodFrom && quote.periodTo ? `${quote.periodFrom} – ${quote.periodTo}` : "okres wg źródła"}
                  </div>
                </div>
              </div>

              {anchored && quote.qualityFactor != null && quote.anchorMedianPricePerSqm != null && (
                <div className="mt-4 grid gap-3 rounded-xl border border-violet-500/15 bg-violet-500/[.05] p-3 sm:grid-cols-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Cena zakupu</span>
                    <div className="mt-1 text-sm font-black text-white">
                      {Math.round(quote.purchasePrice ?? 0).toLocaleString("pl-PL")} zł
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Rynek przy zakupie</span>
                    <div className="mt-1 text-sm font-black text-white">
                      {Math.round(quote.anchorMedianPricePerSqm).toLocaleString("pl-PL")} zł/m²
                    </div>
                    <div className="mt-1 text-[9px] text-slate-500">
                      {quote.anchorResolvedArea ?? quote.resolvedArea}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Twój premium / discount</span>
                    <div className={`mt-1 text-sm font-black ${factorPercent != null && factorPercent >= 0 ? "text-emerald-300" : "text-amber-300"}`}>
                      {factorPercent == null ? "—" : `${factorPercent >= 0 ? "+" : ""}${factorPercent.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`}
                    </div>
                    <div className="mt-1 text-[9px] text-slate-500">
                      współczynnik {quote.qualityFactor.toLocaleString("pl-PL", { maximumFractionDigits: 3 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Okres kotwicy</span>
                    <div className="mt-1 text-xs font-black text-white">
                      {quote.anchorPeriodFrom && quote.anchorPeriodTo
                        ? `${quote.anchorPeriodFrom} – ${quote.anchorPeriodTo}`
                        : "wg źródła"}
                    </div>
                    <div className="mt-1 text-[9px] text-slate-500">
                      {quote.anchorRecordCount != null ? `${quote.anchorRecordCount} transakcji` : "próba wg źródła"}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 border-t border-slate-800 pt-3 text-[10px] leading-relaxed text-slate-600">
                {quote.citation}. To orientacyjna wycena oparta na agregatach RCN, nie operat szacunkowy.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
