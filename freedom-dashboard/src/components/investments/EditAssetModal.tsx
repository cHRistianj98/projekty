import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pencil, RefreshCw, X } from "lucide-react";

import type {
  Asset,
  AssetCategory,
  AssetIconKey,
  CashCurrency,
  MetalSymbol,
  MetalUnit,
  RealEstateValuationMode,
  RealEstateMarketSegment,
} from "../../types/Asset";
import { assetCategoryLabels, defaultAssetIconByCategory, getAssetCategory, getAssetIconKey } from "../../types/Asset";
import { marketPriceApi, type CryptoQuote, type FxQuote, type MetalQuote, type RealEstateQuote } from "../../api/marketPriceApi";
import { AssetIcon, assetIconOptions } from "./assetIcons";
import { RealEstateValuationPanel } from "./RealEstateValuationPanel";
import { RetailBondValuationPanel, calculateRetailBondValuation } from "./RetailBondValuationPanel";
import { CryptoPricingPanel, type CryptoSelection } from "./CryptoPricingPanel";
import { FxCashPricingPanel } from "./FxCashPricingPanel";

type EditAssetModalProps = {
  asset: Asset;
  onClose: () => void;
  onUpdate: (asset: Asset) => Promise<void>;
};

const availableColors = ["#3b82f6", "#10b981", "#f59e0b", "#f97316", "#6366f1", "#a855f7", "#ec4899", "#64748b", "#d4af37", "#c0c0c0"];
const categories = Object.keys(assetCategoryLabels) as AssetCategory[];
const GRAMS_PER_OUNCE = 31.1034768;

export function EditAssetModal({ asset, onClose, onUpdate }: EditAssetModalProps) {
  const [name, setName] = useState(asset.name);
  const [value, setValue] = useState(asset.value.toString());
  const [category, setCategory] = useState<AssetCategory>(getAssetCategory(asset));
  const [color, setColor] = useState(asset.color);
  const [iconKey, setIconKey] = useState<AssetIconKey>(getAssetIconKey(asset));

  const [marketPriced, setMarketPriced] = useState(Boolean(asset.marketPriced));
  const [metalSymbol, setMetalSymbol] = useState<MetalSymbol>(asset.metalSymbol ?? "XAU");
  const [metalQuantity, setMetalQuantity] = useState(String(asset.metalQuantity ?? 1));
  const [metalUnit, setMetalUnit] = useState<MetalUnit>(asset.metalUnit ?? "TROY_OUNCE");
  const [quotes, setQuotes] = useState<MetalQuote[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [cryptoSelection, setCryptoSelection] = useState<CryptoSelection>({
    id: asset.cryptoCoinId ?? "bitcoin",
    symbol: asset.cryptoSymbol ?? "BTC",
    name: asset.name || "Bitcoin",
  });
  const [cryptoQuantity, setCryptoQuantity] = useState(String(asset.cryptoQuantity ?? ""));
  const [cryptoQuote, setCryptoQuote] = useState<CryptoQuote | null>(asset.cryptoPricePln != null ? {
    coinId: asset.cryptoCoinId ?? "bitcoin",
    symbol: asset.cryptoSymbol ?? "BTC",
    name: asset.name,
    pricePln: asset.cryptoPricePln,
    priceUsd: asset.cryptoPriceUsd ?? null,
    change24h: asset.cryptoChange24h ?? null,
    updatedAt: asset.cryptoUpdatedAt ?? new Date().toISOString(),
    source: "CoinGecko",
  } : null);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoError, setCryptoError] = useState("");

  const [fxPriced, setFxPriced] = useState(Boolean(asset.fxPriced));
  const [cashCurrency, setCashCurrency] = useState<Exclude<CashCurrency, "PLN">>(asset.cashCurrency && asset.cashCurrency !== "PLN" ? asset.cashCurrency : "EUR");
  const [cashQuantity, setCashQuantity] = useState(String(asset.cashQuantity ?? ""));
  const [fxQuote, setFxQuote] = useState<FxQuote | null>(asset.fxRatePln != null && asset.cashCurrency && asset.cashCurrency !== "PLN" ? {
    currency: asset.cashCurrency,
    currencyName: asset.cashCurrency,
    ratePln: asset.fxRatePln,
    effectiveDate: asset.fxEffectiveDate ?? "",
    tableNo: "NBP",
    fetchedAt: asset.fxUpdatedAt ?? new Date().toISOString(),
    source: "Narodowy Bank Polski — tabela A kursów średnich",
  } : null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState("");

  const [realEstateCity, setRealEstateCity] = useState(asset.realEstateCity ?? "");
  const [realEstateDistrict, setRealEstateDistrict] = useState(asset.realEstateDistrict ?? "");
  const [realEstateAreaSqm, setRealEstateAreaSqm] = useState(String(asset.realEstateAreaSqm ?? ""));
  const [realEstateValuationMode, setRealEstateValuationMode] = useState<RealEstateValuationMode>(asset.realEstateValuationMode ?? "MARKET_MEDIAN");
  const [realEstateMarketSegment, setRealEstateMarketSegment] = useState<RealEstateMarketSegment>(asset.realEstateMarketSegment ?? "ALL");
  const [realEstatePurchasePrice, setRealEstatePurchasePrice] = useState(String(asset.realEstatePurchasePrice ?? ""));
  const [realEstatePurchaseDate, setRealEstatePurchaseDate] = useState(asset.realEstatePurchaseDate ?? "");
  const [realEstateQuote, setRealEstateQuote] = useState<RealEstateQuote | null>(asset.realEstateMedianPriceSqm != null && asset.realEstateAreaSqm != null ? {
    city: asset.realEstateCity ?? "",
    requestedDistrict: asset.realEstateDistrict ?? null,
    resolvedArea: asset.realEstateResolvedArea ?? asset.realEstateDistrict ?? asset.realEstateCity ?? "—",
    scope: asset.realEstateScope ?? "miasto",
    medianPricePerSqm: asset.realEstateMedianPriceSqm,
    areaSqm: asset.realEstateAreaSqm,
    estimatedValue: asset.value,
    estimatedPricePerSqm: asset.realEstateEstimatedPriceSqm ?? asset.realEstateMedianPriceSqm,
    recordCount: asset.realEstateRecordCount ?? null,
    periodFrom: asset.realEstatePeriodFrom ?? null,
    periodTo: asset.realEstatePeriodTo ?? null,
    valuationMode: asset.realEstateValuationMode ?? "MARKET_MEDIAN",
    marketSegment: asset.realEstateMarketSegment ?? "ALL",
    dataMarketSegment: asset.realEstateMarketSegment ?? "ALL",
    purchasePrice: asset.realEstatePurchasePrice ?? null,
    purchaseDate: asset.realEstatePurchaseDate ?? null,
    anchorMedianPricePerSqm: asset.realEstateAnchorMedianPriceSqm ?? null,
    qualityFactor: asset.realEstateQualityFactor ?? null,
    anchorResolvedArea: asset.realEstateAnchorResolvedArea ?? null,
    anchorScope: asset.realEstateAnchorScope ?? null,
    anchorMarketSegment: asset.realEstateMarketSegment ?? null,
    anchorRecordCount: asset.realEstateAnchorRecordCount ?? null,
    anchorPeriodFrom: asset.realEstateAnchorPeriodFrom ?? null,
    anchorPeriodTo: asset.realEstateAnchorPeriodTo ?? null,
    source: "mScanner — dane z Rejestru Cen Nieruchomości (RCN)",
    citation: "mScanner (dane: Rejestr Cen Nieruchomości), https://mscanner.pl",
    fetchedAt: asset.realEstateUpdatedAt ?? new Date().toISOString(),
  } : null);
  const [realEstateLoading, setRealEstateLoading] = useState(false);
  const [realEstateError, setRealEstateError] = useState("");

  const [bondPurchaseValue, setBondPurchaseValue] = useState(String(asset.bondPurchaseValue ?? ""));
  const [bondGrossValue, setBondGrossValue] = useState(String(asset.bondGrossValue ?? ""));

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

  useEffect(() => {
    if (category !== "crypto" || !marketPriced || !cryptoSelection.id) return;
    let cancelled = false;
    setCryptoLoading(true);
    setCryptoError("");
    marketPriceApi.getCryptoQuote(cryptoSelection.id, cryptoSelection.symbol, cryptoSelection.name)
      .then((row) => { if (!cancelled) setCryptoQuote(row); })
      .catch((cause) => { if (!cancelled) { setCryptoQuote(null); setCryptoError(cause instanceof Error ? cause.message : "Nie udało się pobrać ceny krypto."); } })
      .finally(() => { if (!cancelled) setCryptoLoading(false); });
    return () => { cancelled = true; };
  }, [category, marketPriced, cryptoSelection.id, cryptoSelection.symbol, cryptoSelection.name]);

  useEffect(() => {
    if (asset.systemCash || category !== "cash" || !fxPriced) return;
    let cancelled = false;
    setFxLoading(true);
    setFxError("");
    marketPriceApi.getFxQuote(cashCurrency)
      .then((row) => { if (!cancelled) setFxQuote(row); })
      .catch((cause) => { if (!cancelled) { setFxQuote(null); setFxError(cause instanceof Error ? cause.message : "Nie udało się pobrać kursu waluty."); } })
      .finally(() => { if (!cancelled) setFxLoading(false); });
    return () => { cancelled = true; };
  }, [asset.systemCash, category, fxPriced, cashCurrency]);

  const bondValuation = useMemo(() => calculateRetailBondValuation(Number(bondPurchaseValue), Number(bondGrossValue)), [bondPurchaseValue, bondGrossValue]);

  const quote = quotes.find((row) => row.symbol === metalSymbol);
  const estimatedValue = useMemo(() => {
    if (!quote) return asset.value;
    const quantity = Number(metalQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    const ounces = metalUnit === "GRAM" ? quantity / GRAMS_PER_OUNCE : quantity;
    return quote.pricePlnPerTroyOunce * ounces;
  }, [quote, metalQuantity, metalUnit, asset.value]);

  const cryptoEstimatedValue = useMemo(() => {
    if (!cryptoQuote) return asset.value;
    const quantity = Number(cryptoQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    return cryptoQuote.pricePln * quantity;
  }, [cryptoQuote, cryptoQuantity, asset.value]);

  const fxEstimatedValue = useMemo(() => {
    if (!fxQuote) return asset.value;
    const quantity = Number(cashQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    return fxQuote.ratePln * quantity;
  }, [fxQuote, cashQuantity, asset.value]);

  async function refreshFxQuote() {
    setFxLoading(true);
    setFxError("");
    try {
      setFxQuote(await marketPriceApi.getFxQuote(cashCurrency));
    } catch (cause) {
      setFxQuote(null);
      setFxError(cause instanceof Error ? cause.message : "Nie udało się pobrać kursu waluty.");
    } finally {
      setFxLoading(false);
    }
  }

  async function refreshCryptoQuote() {
    if (!cryptoSelection.id) return;
    setCryptoLoading(true);
    setCryptoError("");
    try {
      setCryptoQuote(await marketPriceApi.getCryptoQuote(cryptoSelection.id, cryptoSelection.symbol, cryptoSelection.name));
    } catch (cause) {
      setCryptoQuote(null);
      setCryptoError(cause instanceof Error ? cause.message : "Nie udało się pobrać ceny krypto.");
    } finally {
      setCryptoLoading(false);
    }
  }

  function handleCategoryChange(nextCategory: AssetCategory) {
    setCategory(nextCategory);
    if (!asset.iconKey || iconKey === defaultAssetIconByCategory[category]) {
      setIconKey(defaultAssetIconByCategory[nextCategory]);
    }
    if (nextCategory === "cash" && category !== "cash") {
      setMarketPriced(false);
      setFxPriced(false);
      setCashCurrency("EUR");
      setCashQuantity("");
      setFxQuote(null);
      setColor("#3b82f6");
      setIconKey("landmark");
    } else if (nextCategory === "metals" && category !== "metals") {
      setMarketPriced(true);
      setMetalSymbol("XAU");
      setMetalQuantity("1");
      setMetalUnit("TROY_OUNCE");
      setColor("#d4af37");
      setIconKey("goldBars");
    } else if (nextCategory === "crypto" && category !== "crypto") {
      setMarketPriced(true);
      setCryptoSelection({ id: "bitcoin", symbol: "BTC", name: "Bitcoin" });
      setCryptoQuantity("");
      setCryptoQuote(null);
      setColor("#f59e0b");
      setIconKey("bitcoin");
    } else if (nextCategory === "realEstate" && category !== "realEstate") {
      setMarketPriced(true);
      setColor("#10b981");
      setIconKey("building");
      setRealEstateQuote(null);
    } else if (nextCategory === "bonds" && category !== "bonds") {
      setMarketPriced(false);
      setColor("#0ea5e9");
      setIconKey("scrollText");
      setBondPurchaseValue(asset.bondPurchaseValue != null ? String(asset.bondPurchaseValue) : String(asset.value));
      setBondGrossValue(asset.bondGrossValue != null ? String(asset.bondGrossValue) : String(asset.value));
    } else if (nextCategory !== "metals" && nextCategory !== "crypto" && nextCategory !== "realEstate") {
      setMarketPriced(false);
      if (nextCategory !== "cash") setFxPriced(false);
    }
  }

  async function checkRealEstateQuote() {
    const area = Number(realEstateAreaSqm);
    if (!realEstateCity.trim() || !Number.isFinite(area) || area <= 0) return;
    setRealEstateLoading(true);
    setRealEstateError("");
    try {
      const next = await marketPriceApi.getApartmentQuote(
        realEstateCity.trim(),
        realEstateDistrict.trim(),
        area,
        {
          marketSegment: realEstateMarketSegment,
          valuationMode: realEstateValuationMode,
          ...(realEstateValuationMode === "MARKET_ANCHORED"
            ? {
                purchasePrice: Number(realEstatePurchasePrice),
                purchaseDate: realEstatePurchaseDate,
              }
            : {}),
        },
      );
      setRealEstateQuote(next);
    } catch (cause) {
      setRealEstateQuote(null);
      setRealEstateError(cause instanceof Error ? cause.message : "Nie udało się pobrać wyceny mieszkania.");
    } finally {
      setRealEstateLoading(false);
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
    const liveCrypto = category === "crypto" && marketPriced;
    const liveFxCash = category === "cash" && fxPriced && !asset.systemCash;
    const liveRealEstate = category === "realEstate" && marketPriced;
    const retailBond = category === "bonds";
    const purchaseValue = Number(bondPurchaseValue);
    const grossValue = Number(bondGrossValue);
    const numericValue = retailBond
      ? bondValuation.netValue
      : liveMetal
        ? (estimatedValue ?? asset.value)
        : liveCrypto
          ? (cryptoEstimatedValue ?? asset.value)
        : liveFxCash
          ? (fxEstimatedValue ?? asset.value)
        : liveRealEstate
          ? (realEstateQuote?.estimatedValue ?? asset.value)
          : Number(value);
    const quantity = Number(metalQuantity);
    const cryptoAmount = Number(cryptoQuantity);
    const cashAmount = Number(cashQuantity);
    const area = Number(realEstateAreaSqm);
    if (name.trim() === "" || numericValue < 0 || !Number.isFinite(numericValue)) return;
    if (retailBond && (bondPurchaseValue.trim() === "" || bondGrossValue.trim() === "" || !Number.isFinite(purchaseValue) || purchaseValue <= 0 || !Number.isFinite(grossValue) || grossValue < 0)) {
      setError("Podaj poprawny kapitał początkowy i bieżącą wartość brutto obligacji.");
      return;
    }
    if (liveMetal && (!Number.isFinite(quantity) || quantity <= 0)) {
      setError("Podaj poprawną ilość metalu.");
      return;
    }
    if (liveCrypto && (!cryptoSelection.id || !Number.isFinite(cryptoAmount) || cryptoAmount <= 0)) {
      setError("Wybierz kryptowalutę i podaj poprawną ilość.");
      return;
    }
    if (liveFxCash && (!Number.isFinite(cashAmount) || cashAmount <= 0)) {
      setError("Wybierz walutę i podaj poprawną ilość.");
      return;
    }
    if (liveRealEstate && (!realEstateCity.trim() || !Number.isFinite(area) || area <= 0)) {
      setError("Podaj miasto i poprawny metraż mieszkania.");
      return;
    }
    if (
      liveRealEstate &&
      realEstateValuationMode === "MARKET_ANCHORED" &&
      (!Number.isFinite(Number(realEstatePurchasePrice)) ||
        Number(realEstatePurchasePrice) <= 0 ||
        !realEstatePurchaseDate)
    ) {
      setError("Dla wyceny zakotwiczonej podaj cenę i datę zakupu.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onUpdate({
        ...asset,
        name: name.trim(),
        value: numericValue,
        color,
        category,
        iconKey,
        marketPriced: liveMetal || liveCrypto || liveRealEstate,
        fxPriced: liveFxCash,
        bondPurchaseValue: retailBond ? purchaseValue : undefined,
        bondGrossValue: retailBond ? grossValue : undefined,
        ...(liveMetal ? { metalSymbol, metalQuantity: quantity, metalUnit } : {
          metalSymbol: undefined,
          metalQuantity: undefined,
          metalUnit: undefined,
        }),
        ...(liveCrypto ? {
          cryptoCoinId: cryptoSelection.id,
          cryptoSymbol: cryptoSelection.symbol,
          cryptoQuantity: cryptoAmount,
        } : {
          cryptoCoinId: undefined,
          cryptoSymbol: undefined,
          cryptoQuantity: undefined,
        }),
        ...(liveFxCash ? {
          cashCurrency,
          cashQuantity: cashAmount,
        } : {
          cashCurrency: undefined,
          cashQuantity: undefined,
        }),
        ...(liveRealEstate ? {
          realEstateType: "APARTMENT" as const,
          realEstateCity: realEstateCity.trim(),
          realEstateDistrict: realEstateDistrict.trim() || undefined,
          realEstateAreaSqm: area,
          realEstateValuationMode,
          realEstateMarketSegment,
          ...(realEstateValuationMode === "MARKET_ANCHORED"
            ? {
                realEstatePurchasePrice: Number(realEstatePurchasePrice),
                realEstatePurchaseDate,
              }
            : {
                realEstatePurchasePrice: undefined,
                realEstatePurchaseDate: undefined,
              }),
        } : {
          realEstateType: undefined,
          realEstateCity: undefined,
          realEstateDistrict: undefined,
          realEstateAreaSqm: undefined,
          realEstateValuationMode: undefined,
          realEstateMarketSegment: undefined,
          realEstatePurchasePrice: undefined,
          realEstatePurchaseDate: undefined,
        }),
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
      <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[28px] border bg-[#08111f] shadow-[0_30px_100px_rgba(0,0,0,.65)]" style={{ borderColor: `${color}45`, boxShadow: `0 30px 100px rgba(0,0,0,.65), 0 0 70px ${color}12` }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: `${color}18` }} />

        <div className="relative flex items-center justify-between border-b border-slate-800/80 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white/10" style={{ color, backgroundColor: `${color}18` }}><Pencil size={22} /></div>
            <div><h2 className="text-xl font-black text-white">Edytuj aktywo</h2><p className="mt-1 text-sm text-slate-500">Dopasuj pozycję dokładnie do swojego portfela</p></div>
          </div>
          <button type="button" disabled={saving} onClick={onClose} className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6 p-7">
          {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nazwa aktywa"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></Field>
            {category === "cash" && fxPriced && !asset.systemCash ? (
              <Field label="Wartość w PLN"><div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[.07] px-4 py-3.5"><div className="text-lg font-black text-white">{fxEstimatedValue == null ? "—" : `${fxEstimatedValue.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">{cashCurrency} × średni kurs NBP</div></div></Field>
            ) : category === "metals" && marketPriced ? (
              <Field label="Wartość rynkowa"><div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3.5"><div className="text-lg font-black text-white">{estimatedValue == null ? "—" : `${Math.round(estimatedValue).toLocaleString("pl-PL")} zł`}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">sterowana automatycznie przez cenę spot</div></div></Field>
            ) : category === "crypto" && marketPriced ? (
              <Field label="Wartość rynkowa"><div className="rounded-xl border border-violet-500/20 bg-violet-500/[.07] px-4 py-3.5"><div className="text-lg font-black text-white">{cryptoEstimatedValue == null ? "—" : `${cryptoEstimatedValue.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">{cryptoSelection.symbol} × live cena CoinGecko w PLN</div></div></Field>
            ) : category === "realEstate" && marketPriced ? (
              <Field label="Wartość rynkowa"><div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[.07] px-4 py-3.5"><div className="text-lg font-black text-white">{realEstateQuote ? `${Math.round(realEstateQuote.estimatedValue).toLocaleString("pl-PL")} zł` : `${Math.round(asset.value).toLocaleString("pl-PL")} zł`}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">{realEstateValuationMode === "MARKET_ANCHORED" ? "rynek skorygowany historyczną ceną Twojego lokalu" : "mediana RCN × metraż mieszkania"}</div></div></Field>
            ) : category === "bonds" ? (
              <Field label="Wartość netto po podatku"><div className="rounded-xl border border-sky-500/20 bg-sky-500/[.07] px-4 py-3.5"><div className="text-lg font-black text-emerald-300">{bondValuation.netValue.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</div><div className="mt-1 text-[11px] font-semibold text-slate-500">wartość brutto − 19% od dodatniego zysku</div></div></Field>
            ) : (
              <Field label="Aktualna wartość"><div className="relative"><input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} pr-14`} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">zł</span></div></Field>
            )}
          </div>

          <Field label="Kategoria">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map((item) => <button key={item} type="button" onClick={() => handleCategoryChange(item)} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${category === item ? "border-blue-400/60 bg-blue-500/12 text-blue-200" : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"}`}>{assetCategoryLabels[item]}</button>)}
            </div>
          </Field>

          {category === "cash" && !asset.systemCash && (
            <FxCashPricingPanel
              enabled={fxPriced}
              onToggle={() => setFxPriced((current) => !current)}
              currency={cashCurrency}
              onCurrencyChange={(next) => { setCashCurrency(next); setFxQuote(null); }}
              quantity={cashQuantity}
              onQuantityChange={setCashQuantity}
              quote={fxQuote}
              loading={fxLoading}
              error={fxError}
              onRefresh={refreshFxQuote}
            />
          )}

          {category === "metals" && (
            <div className="space-y-4 rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[.07] to-slate-950/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div><div className="text-sm font-black text-white">Automatyczna wycena metalu</div><div className="mt-1 text-xs text-slate-500">Wartość aktywa aktualizuje się według spot + USD/PLN.</div></div>
                <button type="button" onClick={() => setMarketPriced((current) => !current)} className={`relative h-7 w-12 rounded-full transition ${marketPriced ? "bg-emerald-500" : "bg-slate-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${marketPriced ? "left-6" : "left-1"}`} /></button>
              </div>

              {marketPriced && <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleMetalChange("XAU")} className={`rounded-xl border px-3 py-3 text-left transition ${metalSymbol === "XAU" ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}><div className="font-black">Złoto</div><div className="mt-1 text-[10px] font-bold tracking-wider">XAU</div></button>
                    <button type="button" onClick={() => handleMetalChange("XAG")} className={`rounded-xl border px-3 py-3 text-left transition ${metalSymbol === "XAG" ? "border-slate-300/45 bg-slate-300/10 text-slate-100" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}><div className="font-black">Srebro</div><div className="mt-1 text-[10px] font-bold tracking-wider">XAG</div></button>
                  </div>
                  <div className="grid grid-cols-[1fr_130px] gap-2"><input type="number" min="0.000001" step="0.000001" value={metalQuantity} onChange={(e) => setMetalQuantity(e.target.value)} className={inputClass} /><select value={metalUnit} onChange={(e) => setMetalUnit(e.target.value as MetalUnit)} className={inputClass}><option value="TROY_OUNCE">uncja t.</option><option value="GRAM">gramy</option></select></div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-xs">
                  {quoteLoading ? <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={13} className="animate-spin"/>Pobieranie notowań…</div> : quoteError ? <div className="text-rose-300">{quoteError}</div> : quote ? <div className="grid gap-2 sm:grid-cols-3"><div><span className="text-slate-500">Spot</span><div className="mt-1 font-black text-white">${quote.priceUsdPerTroyOunce.toLocaleString("en-US", { maximumFractionDigits: 2 })} / oz</div></div><div><span className="text-slate-500">USD/PLN</span><div className="mt-1 font-black text-white">{quote.usdPlnRate.toLocaleString("pl-PL", { maximumFractionDigits: 4 })}</div></div><div><span className="text-slate-500">1 oz w PLN</span><div className="mt-1 font-black text-amber-300">{quote.pricePlnPerTroyOunce.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł</div></div></div> : null}
                </div>
              </>}
            </div>
          )}

          {category === "crypto" && (
            <CryptoPricingPanel
              enabled={marketPriced}
              onEnabledChange={(enabled) => { setMarketPriced(enabled); if (!enabled) setCryptoQuote(null); }}
              selection={cryptoSelection}
              onSelectionChange={(next) => { setCryptoSelection(next); setCryptoQuote(null); }}
              quantity={cryptoQuantity}
              onQuantityChange={setCryptoQuantity}
              quote={cryptoQuote}
              loading={cryptoLoading}
              error={cryptoError}
              onRefresh={() => void refreshCryptoQuote()}
            />
          )}

          {category === "realEstate" && (
            <RealEstateValuationPanel
              enabled={marketPriced}
              onEnabledChange={(enabled) => { setMarketPriced(enabled); if (!enabled) setRealEstateQuote(null); }}
              city={realEstateCity}
              onCityChange={(next) => { setRealEstateCity(next); setRealEstateQuote(null); }}
              district={realEstateDistrict}
              onDistrictChange={(next) => { setRealEstateDistrict(next); setRealEstateQuote(null); }}
              areaSqm={realEstateAreaSqm}
              onAreaSqmChange={(next) => { setRealEstateAreaSqm(next); setRealEstateQuote(null); }}
              valuationMode={realEstateValuationMode}
              onValuationModeChange={(next) => { setRealEstateValuationMode(next); setRealEstateQuote(null); }}
              marketSegment={realEstateMarketSegment}
              onMarketSegmentChange={(next) => { setRealEstateMarketSegment(next); setRealEstateQuote(null); }}
              purchasePrice={realEstatePurchasePrice}
              onPurchasePriceChange={(next) => { setRealEstatePurchasePrice(next); setRealEstateQuote(null); }}
              purchaseDate={realEstatePurchaseDate}
              onPurchaseDateChange={(next) => { setRealEstatePurchaseDate(next); setRealEstateQuote(null); }}
              quote={realEstateQuote}
              loading={realEstateLoading}
              error={realEstateError}
              onCheck={() => void checkRealEstateQuote()}
            />
          )}

          {category === "bonds" && (
            <RetailBondValuationPanel
              purchaseValue={bondPurchaseValue}
              onPurchaseValueChange={setBondPurchaseValue}
              grossValue={bondGrossValue}
              onGrossValueChange={setBondGrossValue}
            />
          )}

          <Field label="Ikona"><div className="grid grid-cols-9 gap-2 max-sm:grid-cols-4">{assetIconOptions.map((option) => <button key={option.key} type="button" title={option.label} onClick={() => setIconKey(option.key)} className={`group flex aspect-square cursor-pointer items-center justify-center rounded-xl border transition hover:-translate-y-0.5 ${iconKey === option.key ? "border-white/35 bg-white/10" : "border-slate-800 bg-slate-900/55 hover:border-slate-700"}`} style={iconKey === option.key ? { color, boxShadow: `inset 0 0 22px ${color}18, 0 0 18px ${color}12` } : undefined}><option.icon size={20} className={iconKey === option.key ? "" : "text-slate-500 transition group-hover:text-slate-300"} /></button>)}</div></Field>

          <Field label="Kolor"><div className="flex flex-wrap gap-3">{availableColors.map((item) => <button key={item} type="button" title={item} onClick={() => setColor(item)} className={`h-9 w-9 cursor-pointer rounded-full transition hover:scale-110 ${color === item ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#08111f]" : ""}`} style={{ backgroundColor: item, boxShadow: color === item ? `0 0 22px ${item}70` : undefined }} />)}</div></Field>

          <div className="relative overflow-hidden rounded-2xl border p-4" style={{ borderColor: `${color}38`, background: `linear-gradient(90deg, ${color}18, rgba(15,23,42,.7) 45%, rgba(15,23,42,.5))` }}>
            <div className="flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10" style={{ color, backgroundColor: `${color}22`, boxShadow: `0 8px 25px ${color}20` }}><AssetIcon iconKey={iconKey} size={23} /></div><div className="min-w-0"><div className="truncate font-black text-white">{name || "Aktywo"}</div><div className="mt-1 text-xs font-medium" style={{ color }}>{assetCategoryLabels[category]}</div></div></div><div className="shrink-0 text-lg font-black text-white">{Math.round(category === "cash" && fxPriced && !asset.systemCash
              ? (fxEstimatedValue ?? asset.value)
              : category === "metals" && marketPriced
              ? (estimatedValue ?? asset.value)
              : category === "crypto" && marketPriced
                ? (cryptoEstimatedValue ?? asset.value)
              : category === "realEstate" && marketPriced
                ? (realEstateQuote?.estimatedValue ?? asset.value)
                : category === "bonds"
                  ? bondValuation.netValue
                  : Number(value || 0)).toLocaleString("pl-PL")} zł</div></div>
          </div>

          <div className="flex justify-end gap-3 pt-1"><button type="button" disabled={saving} onClick={onClose} className="cursor-pointer rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800">Anuluj</button><button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500">Zapisz zmiany</button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div><label className="mb-2.5 block text-xs font-black uppercase tracking-[.12em] text-slate-500">{label}</label>{children}</div>; }
const inputClass = "w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";
