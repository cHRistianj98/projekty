import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

import type { CashCurrency } from "../../types/Asset";
import type { StockQuote } from "../../api/marketPriceApi";

export type StockSelection = {
  name: string;
  symbol: string;
  currency: CashCurrency;
};

const presets: StockSelection[] = [
  // Pozycje z Twojego portfela / GPW
  { name: "Dino Polska", symbol: "DNP.WA", currency: "PLN" },
  { name: "XTB", symbol: "XTB.WA", currency: "PLN" },
  { name: "Beta ETF mWIG40TR", symbol: "ETFBM40TR.WA", currency: "PLN" },
  { name: "Beta ETF sWIG80TR", symbol: "ETFBS80TR.WA", currency: "PLN" },
  { name: "Beta ETF WIG20TR", symbol: "ETFBW20TR.WA", currency: "PLN" },
  { name: "BETA ETF Obligacji 6M", symbol: "ETFBCASH.WA", currency: "PLN" },

  // ETF-y z Twojego portfela
  // LSE / USD — dokładnie te warianty widoczne u Ciebie w brokerze
  { name: "iShares Core MSCI World (LSE USD)", symbol: "IWDA.L", currency: "USD" },
  { name: "iShares Core MSCI EM IMI (LSE USD)", symbol: "EIMI.L", currency: "USD" },

  // Alternatywne notowania Xetra / EUR
  { name: "iShares Core MSCI World (Xetra EUR)", symbol: "EUNL.DE", currency: "EUR" },
  { name: "iShares Core S&P 500", symbol: "SXR8.DE", currency: "EUR" },
  { name: "iShares Core MSCI EM IMI (Xetra EUR)", symbol: "IS3N.DE", currency: "EUR" },
  { name: "iShares USD Treasury Bond 20+yr (Acc)", symbol: "DTLA.L", currency: "USD" },
  { name: "iShares USD Treasury Bond 20+yr (Dist)", symbol: "IDTL.L", currency: "USD" },

  // Akcje z Twojego portfela
  { name: "3M", symbol: "MMM", currency: "USD" },
  { name: "AT&T", symbol: "T", currency: "USD" },
  { name: "British American Tobacco ADR", symbol: "BTI", currency: "USD" },
  { name: "British American Tobacco (Xetra)", symbol: "BMT.DE", currency: "EUR" },
  { name: "Coca-Cola", symbol: "KO", currency: "USD" },
  { name: "McDonald's", symbol: "MCD", currency: "USD" },
  { name: "Colgate-Palmolive", symbol: "CL", currency: "USD" },
  { name: "Hormel Foods", symbol: "HRL", currency: "USD" },
  { name: "Medical Properties Trust", symbol: "MPT", currency: "USD" },
  { name: "PayPal", symbol: "PYPL", currency: "USD" },
  { name: "PepsiCo", symbol: "PEP", currency: "USD" },
  { name: "Sportradar", symbol: "SRAD", currency: "USD" },
  { name: "VF Corp", symbol: "VFC", currency: "USD" },
];

const currencies: CashCurrency[] = ["PLN", "USD", "EUR", "GBP", "CHF"];

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selection: StockSelection;
  onSelectionChange: (selection: StockSelection) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  averageBuyPrice: string;
  onAverageBuyPriceChange: (value: string) => void;
  buyFxRatePln: string;
  onBuyFxRatePlnChange: (value: string) => void;
  quote: StockQuote | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

function money(value: number) {
  return `${value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
}

export function StockPricingPanel({
  enabled,
  onEnabledChange,
  selection,
  onSelectionChange,
  quantity,
  onQuantityChange,
  averageBuyPrice,
  onAverageBuyPriceChange,
  buyFxRatePln,
  onBuyFxRatePlnChange,
  quote,
  loading,
  error,
  onRefresh,
}: Props) {
  const qty = Number(quantity);
  const avg = Number(averageBuyPrice);
  const enteredBuyFx = Number(buyFxRatePln);

  const currentFx = quote?.fxRatePln ?? (selection.currency === "PLN" ? 1 : 0);
  const purchaseFx = selection.currency === "PLN"
    ? 1
    : Number.isFinite(enteredBuyFx) && enteredBuyFx > 0
      ? enteredBuyFx
      : currentFx;

  const gross = quote && Number.isFinite(qty) && qty > 0
    ? quote.price * qty * quote.fxRatePln
    : null;

  const cost = Number.isFinite(avg) && avg > 0 && Number.isFinite(qty) && qty > 0 && purchaseFx > 0
    ? avg * qty * purchaseFx
    : null;

  const pnl = gross != null && cost != null ? gross - cost : null;
  const tax = pnl != null ? Math.max(pnl, 0) * 0.19 : null;
  const net = gross != null && tax != null ? gross - tax : null;

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[.06] to-slate-950/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-white">Live pricing akcji / ETF</div>
          <div className="mt-1 text-xs text-slate-500">
            Yahoo Finance + kurs NBP. Wartość aktywa pokazujemy jako szacowaną wartość likwidacyjną netto: cena rynkowa minus 19% od dodatniego niezrealizowanego zysku.
          </div>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-emerald-500" : "bg-slate-700"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {!enabled ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
          Wartość wpisujesz ręcznie. Włącz live pricing, aby podać ticker, ilość i średnią cenę zakupu.
        </div>
      ) : (
        <>
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Twoje / popularne instrumenty</div>
            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {presets.map((item) => (
                <button
                  key={`${item.symbol}-${item.name}`}
                  type="button"
                  onClick={() => onSelectionChange(item)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    selection.symbol.toUpperCase() === item.symbol
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <div className="truncate text-xs font-black">{item.symbol}</div>
                  <div className="mt-1 truncate text-[9px] font-semibold text-slate-500">{item.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.3fr_.7fr]">
            <label>
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Symbol Yahoo Finance / ticker</span>
              <input
                value={selection.symbol}
                onChange={(event) => onSelectionChange({ ...selection, symbol: event.target.value.toUpperCase() })}
                placeholder="np. DNP.WA, XTB.WA, MMM, SXR8.DE, DTLA.L"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3.5 font-bold text-white outline-none focus:border-emerald-400/70"
              />
              <div className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                Możesz wpisać symbol Yahoo Finance. GPW używa końcówki .WA (np. DNP.WA), USA zwykle bez sufiksu (MMM, KO), Xetra .DE, a Londyn .L. Backend zachowuje zgodność ze starymi symbolami Stooq (.US/.PL/.UK).
              </div>
            </label>

            <label>
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Waluta notowania</span>
              <select
                value={selection.currency}
                onChange={(event) => onSelectionChange({ ...selection, currency: event.target.value as CashCurrency })}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3.5 font-bold text-white outline-none focus:border-emerald-400/70"
              >
                {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Ilość akcji / jednostek</span>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(event) => onQuantityChange(event.target.value)}
                placeholder="np. 12.5"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3.5 font-bold text-white outline-none focus:border-emerald-400/70"
              />
            </label>

            <label>
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Średnia cena zakupu / szt.</span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={averageBuyPrice}
                  onChange={(event) => onAverageBuyPriceChange(event.target.value)}
                  placeholder="np. 95.40"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3.5 pr-16 font-bold text-white outline-none focus:border-emerald-400/70"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">{selection.currency}</span>
              </div>
            </label>
          </div>

          {selection.currency !== "PLN" && (
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
                Średni kurs zakupu {selection.currency}/PLN — opcjonalnie
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={buyFxRatePln}
                onChange={(event) => onBuyFxRatePlnChange(event.target.value)}
                placeholder={quote ? `domyślnie ${quote.fxRatePln.toFixed(4)}` : "np. 4.10"}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-4 py-3.5 font-bold text-white outline-none focus:border-emerald-400/70"
              />
              <div className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                Jeśli zostawisz puste, przy pierwszym zapisie użyjemy bieżącego kursu NBP jako orientacyjnej bazy i zapamiętamy go. To nadal tylko estymacja podatkowa, nie wyliczenie PIT.
              </div>
            </label>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-xs">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={13} className="animate-spin" />Pobieranie notowania…</div>
            ) : error ? (
              <div className="text-rose-300">{error}</div>
            ) : quote ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-white">{quote.name || selection.name}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">{quote.symbol} · {quote.currency}</div>
                  </div>
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-[10px] font-black text-slate-300 hover:text-white"
                  >
                    <RefreshCw size={12} /> Odśwież
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <span className="text-slate-500">Cena</span>
                    <div className="mt-1 font-black text-white">{quote.price.toLocaleString("pl-PL", { maximumFractionDigits: 6 })} {quote.currency}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Kurs do PLN</span>
                    <div className="mt-1 font-black text-white">{quote.fxRatePln.toLocaleString("pl-PL", { maximumFractionDigits: 4 })}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Zmiana</span>
                    <div className={`mt-1 flex items-center gap-1 font-black ${(quote.changePercent ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {(quote.changePercent ?? 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {quote.changePercent == null ? "—" : `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Notowanie</span>
                    <div className="mt-1 font-black text-white">{quote.marketDate ?? "—"}</div>
                    <div className="text-[10px] text-slate-600">{quote.marketTime ?? ""}</div>
                  </div>
                </div>

                <div className="grid gap-2 border-t border-slate-800 pt-3 sm:grid-cols-5">
                  <Metric label="Brutto" value={gross == null ? "—" : money(gross)} />
                  <Metric label="Koszt bazowy" value={cost == null ? "—" : money(cost)} />
                  <Metric label="Zysk / strata" value={pnl == null ? "—" : money(pnl)} tone={pnl != null && pnl >= 0 ? "good" : "bad"} />
                  <Metric label="Podatek 19%" value={tax == null ? "—" : `-${money(tax)}`} tone="warn" />
                  <Metric label="Netto do NW" value={net == null ? "—" : money(net)} tone="good" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 text-slate-500">
                <span>Podaj symbol i pobierz notowanie.</span>
                <button type="button" onClick={onRefresh} className="rounded-lg border border-slate-700 px-3 py-2 text-[10px] font-black text-slate-300">Sprawdź</button>
              </div>
            )}
          </div>

          <div className="text-[10px] leading-relaxed text-slate-600">
            Źródło ceny: Yahoo Finance (nieoficjalny endpoint chart, notowania mogą być opóźnione). Dla instrumentów w walucie obcej przeliczenie do PLN korzysta z kursu średniego NBP. Notowania mogą być opóźnione zależnie od rynku. Podatek 19% jest tylko konserwatywną estymacją wartości netto pozycji; faktyczny podatek rozliczasz od zrealizowanych wyników i z uwzględnieniem całego roku podatkowego.
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  const className = tone === "good"
    ? "text-emerald-300"
    : tone === "bad"
      ? "text-rose-300"
      : tone === "warn"
        ? "text-amber-300"
        : "text-white";

  return (
    <div>
      <div className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{label}</div>
      <div className={`mt-1 font-black ${className}`}>{value}</div>
    </div>
  );
}
