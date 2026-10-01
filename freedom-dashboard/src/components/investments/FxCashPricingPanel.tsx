import { RefreshCw } from "lucide-react";

import type { CashCurrency } from "../../types/Asset";
import type { FxQuote } from "../../api/marketPriceApi";

const currencies: Array<{ code: Exclude<CashCurrency, "PLN">; label: string; symbol: string }> = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "CHF", label: "Frank", symbol: "CHF" },
  { code: "USD", label: "Dolar", symbol: "$" },
  { code: "CZK", label: "Korona czeska", symbol: "Kč" },
];

type Props = {
  enabled: boolean;
  onToggle: () => void;
  currency: Exclude<CashCurrency, "PLN">;
  onCurrencyChange: (currency: Exclude<CashCurrency, "PLN">) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  quote: FxQuote | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

export function FxCashPricingPanel({
  enabled,
  onToggle,
  currency,
  onCurrencyChange,
  quantity,
  onQuantityChange,
  quote,
  loading,
  error,
  onRefresh,
}: Props) {
  const amount = Number(quantity);
  const estimated = quote && Number.isFinite(amount) && amount > 0
    ? quote.ratePln * amount
    : null;

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[.06] to-slate-950/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-white">Gotówka w walucie obcej</div>
          <div className="mt-1 text-xs text-slate-500">Domyślnie aktywo jest w PLN. Włącz, aby trzymać EUR, CHF, USD albo CZK i wyceniać je automatycznie.</div>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          onClick={onToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-cyan-500" : "bg-slate-700"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {!enabled ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
          PLN — wartość wpisujesz ręcznie, bez przeliczania kursu.
        </div>
      ) : (
        <>
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Waluta</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {currencies.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onCurrencyChange(item.code)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${currency === item.code ? "border-cyan-400/55 bg-cyan-400/10 text-cyan-100" : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">{item.code}</span>
                    <span className="text-sm font-black opacity-70">{item.symbol}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-500">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Ilość</span>
              <div className="relative">
                <input
                  type="number"
                  min="0.000000000001"
                  step="0.01"
                  value={quantity}
                  onChange={(event) => onQuantityChange(event.target.value)}
                  placeholder="np. 1000"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3.5 pr-16 text-base font-bold text-white outline-none transition focus:border-cyan-400/70"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">{currency}</span>
              </div>
            </label>

            <div className="self-end">
              <button
                type="button"
                disabled={loading}
                onClick={onRefresh}
                className="flex h-[50px] cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/65 px-4 text-xs font-black text-slate-300 transition hover:border-cyan-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Odśwież
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-xs">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={13} className="animate-spin" />Pobieranie kursu NBP…</div>
            ) : error ? (
              <div className="text-rose-300">{error}</div>
            ) : quote ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-slate-500">Kurs średni NBP</span>
                  <div className="mt-1 font-black text-white">1 {quote.currency} = {quote.ratePln.toLocaleString("pl-PL", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} zł</div>
                </div>
                <div>
                  <span className="text-slate-500">Wartość w PLN</span>
                  <div className="mt-1 font-black text-cyan-300">{estimated == null ? "—" : `${estimated.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`}</div>
                </div>
                <div>
                  <span className="text-slate-500">Tabela</span>
                  <div className="mt-1 font-black text-white">{quote.effectiveDate}</div>
                  <div className="mt-0.5 text-[10px] text-slate-600">{quote.tableNo}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500">Wybierz walutę, aby pobrać kurs.</div>
            )}
          </div>

          <div className="text-[10px] leading-relaxed text-slate-600">Źródło: Narodowy Bank Polski, tabela A kursów średnich. Backend cache’uje kurs maksymalnie przez 60 minut.</div>
        </>
      )}
    </div>
  );
}
