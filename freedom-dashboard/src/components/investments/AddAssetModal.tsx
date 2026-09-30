import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

import type {
  Asset,
  AssetCategory,
  AssetIconKey,
  MetalSymbol,
  MetalUnit,
} from "../../types/Asset";
import {
  assetCategoryLabels,
  defaultAssetIconByCategory,
} from "../../types/Asset";
import { marketPriceApi, type MetalQuote } from "../../api/marketPriceApi";
import { AssetIcon, assetIconOptions } from "./assetIcons";

type AddAssetModalProps = {
  onClose: () => void;
  onAdd: (asset: Asset) => Promise<void>;
};

const availableColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#f97316",
  "#6366f1", "#a855f7", "#ec4899", "#64748b",
  "#d4af37", "#c0c0c0",
];

const categories = Object.keys(assetCategoryLabels) as AssetCategory[];
const GRAMS_PER_OUNCE = 31.1034768;

export function AddAssetModal({ onClose, onAdd }: AddAssetModalProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<AssetCategory>("cash");
  const [color, setColor] = useState("#3b82f6");
  const [iconKey, setIconKey] = useState<AssetIconKey>("landmark");

  const [marketPriced, setMarketPriced] = useState(false);
  const [metalSymbol, setMetalSymbol] = useState<MetalSymbol>("XAU");
  const [metalQuantity, setMetalQuantity] = useState("1");
  const [metalUnit, setMetalUnit] = useState<MetalUnit>("TROY_OUNCE");
  const [quotes, setQuotes] = useState<MetalQuote[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (category !== "metals" || !marketPriced) return;
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError("");
    marketPriceApi.getMetalQuotes()
      .then((rows) => { if (!cancelled) setQuotes(rows); })
      .catch((cause) => { if (!cancelled) setQuoteError(cause instanceof Error ? cause.message : "Nie udało się pobrać notowań."); })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [category, marketPriced]);

  const quote = quotes.find((row) => row.symbol === metalSymbol);
  const estimatedValue = useMemo(() => {
    if (!quote) return null;
    const quantity = Number(metalQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    const ounces = metalUnit === "GRAM" ? quantity / GRAMS_PER_OUNCE : quantity;
    return quote.pricePlnPerTroyOunce * ounces;
  }, [quote, metalQuantity, metalUnit]);

  function handleCategoryChange(nextCategory: AssetCategory) {
    setCategory(nextCategory);
    setIconKey(defaultAssetIconByCategory[nextCategory]);
    if (nextCategory === "metals") {
      setMarketPriced(true);
      setMetalSymbol("XAU");
      setMetalQuantity("1");
      setMetalUnit("TROY_OUNCE");
      setColor("#d4af37");
      setIconKey("goldBars");
    } else {
      setMarketPriced(false);
    }
  }

  function handleMetalChange(symbol: MetalSymbol) {
    setMetalSymbol(symbol);
    if (symbol === "XAU") {
      setColor("#d4af37");
      setIconKey("goldBars");
    } else {
      setColor("#c0c0c0");
      setIconKey("silverCoin");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const liveMetal = category === "metals" && marketPriced;
    const numericValue = liveMetal ? (estimatedValue ?? 0) : Number(value);
    const quantity = Number(metalQuantity);

    if (name.trim() === "" || numericValue < 0 || !Number.isFinite(numericValue)) return;
    if (liveMetal && (!Number.isFinite(quantity) || quantity <= 0)) {
      setError("Podaj poprawną ilość metalu.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onAdd({
        id: Date.now(),
        name: name.trim(),
        value: numericValue,
        color,
        category,
        iconKey,
        marketPriced: liveMetal,
        ...(liveMetal ? {
          metalSymbol,
          metalQuantity: quantity,
          metalUnit,
        } : {}),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się zapisać aktywa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020611]/80 p-4 backdrop-blur-md">
      <div
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[28px] border bg-[#08111f] shadow-[0_30px_100px_rgba(0,0,0,.65)]"
        style={{ borderColor: `${color}45`, boxShadow: `0 30px 100px rgba(0,0,0,.65), 0 0 70px ${color}12` }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: `${color}18` }} />

        <div className="relative flex items-center justify-between border-b border-slate-800/80 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white/10" style={{ color, backgroundColor: `${color}18` }}>
              <Sparkles size={23} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Dodaj aktywo</h2>
              <p className="mt-1 text-sm text-slate-500">Zbuduj kolejną pozycję swojego portfela</p>
            </div>
          </div>
          <button type="button" disabled={saving} onClick={onClose} className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6 p-7">
          {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nazwa aktywa">
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={category === "metals" ? "np. Uncja złota" : "np. S&P 500 ETF"} className={inputClass} />
            </Field>
            {category === "metals" && marketPriced ? (
              <Field label="Wartość rynkowa">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3.5">
                  <div className="text-lg font-black text-white">{estimatedValue == null ? "—" : `${Math.round(estimatedValue).toLocaleString("pl-PL")} zł`}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500">liczona automatycznie z ceny spot</div>
                </div>
              </Field>
            ) : (
              <Field label="Aktualna wartość">
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="50000" className={`${inputClass} pr-14`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">zł</span>
                </div>
              </Field>
            )}
          </div>

          <Field label="Kategoria">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map((item) => (
                <button key={item} type="button" onClick={() => handleCategoryChange(item)} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${category === item ? "border-blue-400/60 bg-blue-500/12 text-blue-200" : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"}`}>
                  {assetCategoryLabels[item]}
                </button>
              ))}
            </div>
          </Field>

          {category === "metals" && (
            <div className="space-y-4 rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[.07] to-slate-950/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-white">Automatyczna wycena metalu</div>
                  <div className="mt-1 text-xs text-slate-500">Gold API + USD/PLN. Odświeżanie maks. raz na 10 minut.</div>
                </div>
                <button type="button" onClick={() => setMarketPriced((current) => !current)} className={`relative h-7 w-12 rounded-full transition ${marketPriced ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${marketPriced ? "left-6" : "left-1"}`} />
                </button>
              </div>

              {marketPriced && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleMetalChange("XAU")} className={`rounded-xl border px-3 py-3 text-left transition ${metalSymbol === "XAU" ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
                        <div className="font-black">Złoto</div><div className="mt-1 text-[10px] font-bold tracking-wider">XAU</div>
                      </button>
                      <button type="button" onClick={() => handleMetalChange("XAG")} className={`rounded-xl border px-3 py-3 text-left transition ${metalSymbol === "XAG" ? "border-slate-300/45 bg-slate-300/10 text-slate-100" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}>
                        <div className="font-black">Srebro</div><div className="mt-1 text-[10px] font-bold tracking-wider">XAG</div>
                      </button>
                    </div>
                    <div className="grid grid-cols-[1fr_130px] gap-2">
                      <input type="number" min="0.000001" step="0.000001" value={metalQuantity} onChange={(e) => setMetalQuantity(e.target.value)} className={inputClass} />
                      <select value={metalUnit} onChange={(e) => setMetalUnit(e.target.value as MetalUnit)} className={inputClass}>
                        <option value="TROY_OUNCE">uncja t.</option>
                        <option value="GRAM">gramy</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-xs">
                    {quoteLoading ? (
                      <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={13} className="animate-spin"/>Pobieranie notowań…</div>
                    ) : quoteError ? (
                      <div className="text-rose-300">{quoteError}</div>
                    ) : quote ? (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div><span className="text-slate-500">Spot</span><div className="mt-1 font-black text-white">${quote.priceUsdPerTroyOunce.toLocaleString("en-US", { maximumFractionDigits: 2 })} / oz</div></div>
                        <div><span className="text-slate-500">USD/PLN</span><div className="mt-1 font-black text-white">{quote.usdPlnRate.toLocaleString("pl-PL", { maximumFractionDigits: 4 })}</div></div>
                        <div><span className="text-slate-500">1 oz w PLN</span><div className="mt-1 font-black text-amber-300">{quote.pricePlnPerTroyOunce.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł</div></div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          )}

          <Field label="Ikona">
            <div className="grid grid-cols-9 gap-2 max-sm:grid-cols-4">
              {assetIconOptions.map((option) => (
                <button key={option.key} type="button" title={option.label} onClick={() => setIconKey(option.key)} className={`group flex aspect-square cursor-pointer items-center justify-center rounded-xl border transition hover:-translate-y-0.5 ${iconKey === option.key ? "border-white/35 bg-white/10" : "border-slate-800 bg-slate-900/55 hover:border-slate-700"}`} style={iconKey === option.key ? { color, boxShadow: `inset 0 0 22px ${color}18, 0 0 18px ${color}12` } : undefined}>
                  <option.icon size={20} className={iconKey === option.key ? "" : "text-slate-500 transition group-hover:text-slate-300"} />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Kolor">
            <div className="flex flex-wrap gap-3">
              {availableColors.map((item) => <button key={item} type="button" title={item} onClick={() => setColor(item)} className={`h-9 w-9 cursor-pointer rounded-full transition hover:scale-110 ${color === item ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#08111f]" : ""}`} style={{ backgroundColor: item, boxShadow: color === item ? `0 0 22px ${item}70` : undefined }} />)}
            </div>
          </Field>

          <div className="relative overflow-hidden rounded-2xl border p-4" style={{ borderColor: `${color}38`, background: `linear-gradient(90deg, ${color}18, rgba(15,23,42,.7) 45%, rgba(15,23,42,.5))` }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10" style={{ color, backgroundColor: `${color}22`, boxShadow: `0 8px 25px ${color}20` }}><AssetIcon iconKey={iconKey} size={23} /></div>
                <div className="min-w-0"><div className="truncate font-black text-white">{name || "Nowe aktywo"}</div><div className="mt-1 text-xs font-medium" style={{ color }}>{assetCategoryLabels[category]}</div></div>
              </div>
              <div className="shrink-0 text-lg font-black text-white">{Math.round(category === "metals" && marketPriced ? (estimatedValue ?? 0) : Number(value || 0)).toLocaleString("pl-PL")} zł</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" disabled={saving} onClick={onClose} className="cursor-pointer rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800">Anuluj</button>
            <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500">Dodaj aktywo</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="mb-2.5 block text-xs font-black uppercase tracking-[.12em] text-slate-500">{label}</label>{children}</div>;
}

const inputClass = "w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";
