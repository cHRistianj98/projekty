import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { marketPriceApi, type CryptoQuote, type CryptoSearchResult } from "../../api/marketPriceApi";

export type CryptoSelection = {
  id: string;
  symbol: string;
  name: string;
};

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selection: CryptoSelection;
  onSelectionChange: (selection: CryptoSelection) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  quote: CryptoQuote | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

const presets: CryptoSelection[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "usd-coin", symbol: "USDC", name: "USDC" },
  { id: "nosana", symbol: "NOS", name: "Nosana" },
  { id: "peaq-2", symbol: "PEAQ", name: "peaq" },
  { id: "origintrail", symbol: "TRAC", name: "OriginTrail" },
  { id: "clearpool", symbol: "CPOOL", name: "Clearpool" },
];

function money(value: number): string {
  if (Math.abs(value) < 1) {
    return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 8 })} zł`;
  }
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;
}

export function CryptoPricingPanel({
  enabled,
  onEnabledChange,
  selection,
  onSelectionChange,
  quantity,
  onQuantityChange,
  quote,
  loading,
  error,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<CryptoSearchResult[]>([]);

  async function search() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearchError("");
    try {
      setResults(await marketPriceApi.searchCrypto(query.trim()));
    } catch (cause) {
      setResults([]);
      setSearchError(cause instanceof Error ? cause.message : "Nie udało się wyszukać tokenu.");
    } finally {
      setSearching(false);
    }
  }

  const numericQuantity = Number(quantity);
  const estimated = quote && Number.isFinite(numericQuantity) && numericQuantity > 0
    ? quote.pricePln * numericQuantity
    : null;

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[.07] via-slate-950/20 to-cyan-500/[.04] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-white">Live pricing krypto</div>
          <div className="mt-1 text-xs text-slate-500">CoinGecko · kurs w PLN · globalne odświeżanie co 10 minut.</div>
        </div>
        <button type="button" onClick={() => onEnabledChange(!enabled)} className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-emerald-500" : "bg-slate-700"}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">Twoje krypto / moonshoty</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((coin) => {
                const active = selection.id === coin.id;
                return (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => onSelectionChange(coin)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-violet-400/60 bg-violet-500/12 text-violet-100" : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"}`}
                  >
                    <div className="text-sm font-black">{coin.symbol}</div>
                    <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{coin.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">Wybrany token</div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3">
                <div className="font-black text-white">{selection.symbol || "—"}</div>
                <div className="mt-1 text-xs text-slate-500">{selection.name || "Wybierz token"} · ID: {selection.id || "—"}</div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">Ilość</div>
              <input
                type="number"
                min="0.000000000001"
                step="any"
                value={quantity}
                onChange={(e) => onQuantityChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 font-semibold text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-400">Aktualne notowanie</div>
              <button type="button" disabled={loading || !selection.id} onClick={onRefresh} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-black text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Odśwież
              </button>
            </div>
            {error ? (
              <div className="mt-3 text-xs font-semibold text-rose-300">{error}</div>
            ) : quote ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div><div className="text-[10px] uppercase tracking-wider text-slate-600">1 {selection.symbol}</div><div className="mt-1 font-black text-white">{money(quote.pricePln)}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-600">USD</div><div className="mt-1 font-black text-white">{quote.priceUsd == null ? "—" : `$${quote.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 8 })}`}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-600">24h</div><div className={`mt-1 font-black ${(quote.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{quote.change24h == null ? "—" : `${quote.change24h >= 0 ? "+" : ""}${quote.change24h.toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-600">Wartość</div><div className="mt-1 font-black text-violet-200">{estimated == null ? "—" : money(estimated)}</div></div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-600">Wybierz token, aby pobrać cenę.</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/35 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">Inny token z CoinGecko</div>
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void search(); } }} placeholder="np. TAO, LINK, Render, IO..." className="min-w-0 flex-1 rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-violet-500" />
              <button type="button" onClick={() => void search()} disabled={searching || query.trim().length < 2} className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 text-xs font-black text-violet-200 disabled:opacity-50">
                <Search size={14}/>{searching ? "..." : "Szukaj"}
              </button>
            </div>
            {searchError && <div className="mt-2 text-xs text-rose-300">{searchError}</div>}
            {results.length > 0 && (
              <div className="mt-2 grid gap-1.5">
                {results.slice(0, 8).map((coin) => (
                  <button key={coin.id} type="button" onClick={() => { onSelectionChange({ id: coin.id, symbol: coin.symbol, name: coin.name }); setResults([]); setQuery(""); }} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/45 px-3 py-2 text-left hover:border-slate-700">
                    <div><span className="font-black text-white">{coin.symbol}</span><span className="ml-2 text-xs text-slate-500">{coin.name}</span></div>
                    <span className="text-[10px] text-slate-600">{coin.marketCapRank ? `#${coin.marketCapRank}` : coin.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
