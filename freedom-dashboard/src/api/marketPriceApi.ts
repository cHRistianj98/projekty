import { authApi } from "./authApi";
import { fromBackendAsset } from "./assetApi";
import type { Asset, CashCurrency, MetalSymbol, RealEstateMarketSegment, RealEstateValuationMode } from "../types/Asset";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type MetalQuote = {
  symbol: MetalSymbol;
  name: string;
  priceUsdPerTroyOunce: number;
  usdPlnRate: number;
  pricePlnPerTroyOunce: number;
  metalUpdatedAt: string;
  fxDate: string;
};


export type FxQuote = {
  currency: CashCurrency;
  currencyName: string;
  ratePln: number;
  change24hPercent?: number | null;
  change1mPercent?: number | null;
  effectiveDate: string;
  tableNo: string;
  fetchedAt: string;
  source: string;
  provider?: string | null;
  symbol?: string | null;
  quotedAt?: string | null;
  intraday?: boolean;
  fallback?: boolean;
};

export type CryptoQuote = {
  coinId: string;
  symbol: string;
  name: string;
  pricePln: number;
  priceUsd?: number | null;
  change24h?: number | null;
  change1m?: number | null;
  updatedAt: string;
  source: string;
};

export type CryptoSearchResult = {
  id: string;
  symbol: string;
  name: string;
  marketCapRank?: number | null;
  thumb?: string | null;
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  currency: CashCurrency;
  fxRatePln: number;
  pricePln: number;
  previousClose?: number | null;
  changePercent?: number | null;
  previousClosePln?: number | null;
  monthBasePrice?: number | null;
  monthBasePricePln?: number | null;
  change24hPlnPercent?: number | null;
  change1mPlnPercent?: number | null;
  marketDate?: string | null;
  marketTime?: string | null;
  fetchedAt: string;
  source: string;
};

export type RealEstateQuote = {
  city: string;
  requestedDistrict?: string | null;
  resolvedArea: string;
  scope: "miasto" | "dzielnica" | "osiedle" | "miasto-history" | string;
  medianPricePerSqm: number;
  areaSqm: number;
  estimatedValue: number;
  estimatedPricePerSqm: number;
  recordCount?: number | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  valuationMode: RealEstateValuationMode;
  marketSegment: RealEstateMarketSegment;
  dataMarketSegment: RealEstateMarketSegment;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  anchorMedianPricePerSqm?: number | null;
  qualityFactor?: number | null;
  anchorResolvedArea?: string | null;
  anchorScope?: string | null;
  anchorMarketSegment?: RealEstateMarketSegment | null;
  anchorRecordCount?: number | null;
  anchorPeriodFrom?: string | null;
  anchorPeriodTo?: string | null;
  source: string;
  citation: string;
  fetchedAt: string;
};

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return { Authorization: `Bearer ${token}` };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  return response.json();
}

export const marketPriceApi = {
  async getMetalQuotes(): Promise<MetalQuote[]> {
    const rows = await handle<MetalQuote[]>(
      await fetch(`${API_URL}/api/market/metals/quotes`, { headers: headers() })
    );
    return rows.map((row) => ({
      ...row,
      priceUsdPerTroyOunce: Number(row.priceUsdPerTroyOunce),
      usdPlnRate: Number(row.usdPlnRate),
      pricePlnPerTroyOunce: Number(row.pricePlnPerTroyOunce),
    }));
  },

  async refreshMetalAssets(): Promise<Asset[]> {
    const rows = await handle<any[]>(
      await fetch(`${API_URL}/api/market/metals/refresh`, {
        method: "POST",
        headers: headers(),
      })
    );
    return rows.map(fromBackendAsset);
  },

  async getFxQuote(currency: CashCurrency, fresh = false): Promise<FxQuote> {
    const params = new URLSearchParams({ currency, fresh: String(fresh) });
    const row = await handle<FxQuote>(
      await fetch(`${API_URL}/api/market/fx/quote?${params.toString()}`, { headers: headers() })
    );
    return {
      ...row,
      ratePln: Number(row.ratePln),
      change24hPercent: row.change24hPercent == null ? null : Number(row.change24hPercent),
      change1mPercent: row.change1mPercent == null ? null : Number(row.change1mPercent),
    };
  },

  async getFxQuotes(): Promise<FxQuote[]> {
    const rows = await handle<FxQuote[]>(
      await fetch(`${API_URL}/api/market/fx/quotes`, { headers: headers() })
    );
    return rows.map((row) => ({
      ...row,
      ratePln: Number(row.ratePln),
      change24hPercent: row.change24hPercent == null ? null : Number(row.change24hPercent),
      change1mPercent: row.change1mPercent == null ? null : Number(row.change1mPercent),
    }));
  },

  async refreshFxAssets(): Promise<Asset[]> {
    const rows = await handle<any[]>(
      await fetch(`${API_URL}/api/market/fx/refresh`, {
        method: "POST",
        headers: headers(),
      })
    );
    return rows.map(fromBackendAsset);
  },

  async getStockQuote(symbol: string, currency: CashCurrency): Promise<StockQuote> {
    const params = new URLSearchParams({ symbol, currency });
    const row = await handle<StockQuote>(
      await fetch(`${API_URL}/api/market/stocks/quote?${params.toString()}`, { headers: headers() })
    );
    return {
      ...row,
      price: Number(row.price),
      fxRatePln: Number(row.fxRatePln),
      pricePln: Number(row.pricePln),
      previousClose: row.previousClose == null ? null : Number(row.previousClose),
      changePercent: row.changePercent == null ? null : Number(row.changePercent),
      previousClosePln: row.previousClosePln == null ? null : Number(row.previousClosePln),
      monthBasePrice: row.monthBasePrice == null ? null : Number(row.monthBasePrice),
      monthBasePricePln: row.monthBasePricePln == null ? null : Number(row.monthBasePricePln),
      change24hPlnPercent: row.change24hPlnPercent == null ? null : Number(row.change24hPlnPercent),
      change1mPlnPercent: row.change1mPlnPercent == null ? null : Number(row.change1mPlnPercent),
    };
  },

  async refreshStockAssets(): Promise<Asset[]> {
    const rows = await handle<any[]>(
      await fetch(`${API_URL}/api/market/stocks/refresh`, {
        method: "POST",
        headers: headers(),
      })
    );
    return rows.map(fromBackendAsset);
  },

  async getCryptoQuote(coinId: string, symbol?: string, name?: string): Promise<CryptoQuote> {
    const params = new URLSearchParams({ coinId });
    if (symbol) params.set("symbol", symbol);
    if (name) params.set("name", name);
    const row = await handle<CryptoQuote>(
      await fetch(`${API_URL}/api/market/crypto/quote?${params.toString()}`, { headers: headers() })
    );
    return {
      ...row,
      pricePln: Number(row.pricePln),
      priceUsd: row.priceUsd == null ? null : Number(row.priceUsd),
      change24h: row.change24h == null ? null : Number(row.change24h),
      change1m: row.change1m == null ? null : Number(row.change1m),
    };
  },

  async searchCrypto(query: string): Promise<CryptoSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return handle<CryptoSearchResult[]>(
      await fetch(`${API_URL}/api/market/crypto/search?${params.toString()}`, { headers: headers() })
    );
  },

  async refreshCryptoAssets(): Promise<Asset[]> {
    const rows = await handle<any[]>(
      await fetch(`${API_URL}/api/market/crypto/refresh`, {
        method: "POST",
        headers: headers(),
      })
    );
    return rows.map(fromBackendAsset);
  },

  async getApartmentQuote(
    city: string,
    district: string,
    areaSqm: number,
    options?: {
      marketSegment?: RealEstateMarketSegment;
      valuationMode?: RealEstateValuationMode;
      purchasePrice?: number;
      purchaseDate?: string;
    },
  ): Promise<RealEstateQuote> {
    const params = new URLSearchParams({
      city,
      areaSqm: String(areaSqm),
      marketSegment: options?.marketSegment ?? "ALL",
      valuationMode: options?.valuationMode ?? "MARKET_MEDIAN",
    });
    if (district.trim()) params.set("district", district.trim());
    if (options?.valuationMode === "MARKET_ANCHORED") {
      if (options.purchasePrice != null) params.set("purchasePrice", String(options.purchasePrice));
      if (options.purchaseDate) params.set("purchaseDate", options.purchaseDate);
    }
    const row = await handle<RealEstateQuote>(
      await fetch(`${API_URL}/api/market/real-estate/quote?${params.toString()}`, { headers: headers() })
    );
    return {
      ...row,
      medianPricePerSqm: Number(row.medianPricePerSqm),
      areaSqm: Number(row.areaSqm),
      estimatedValue: Number(row.estimatedValue),
      estimatedPricePerSqm: Number(row.estimatedPricePerSqm),
      recordCount: row.recordCount == null ? null : Number(row.recordCount),
      purchasePrice: row.purchasePrice == null ? null : Number(row.purchasePrice),
      anchorMedianPricePerSqm: row.anchorMedianPricePerSqm == null ? null : Number(row.anchorMedianPricePerSqm),
      qualityFactor: row.qualityFactor == null ? null : Number(row.qualityFactor),
      anchorRecordCount: row.anchorRecordCount == null ? null : Number(row.anchorRecordCount),
    };
  },

  async refreshRealEstateAssets(): Promise<Asset[]> {
    const rows = await handle<any[]>(
      await fetch(`${API_URL}/api/market/real-estate/refresh`, {
        method: "POST",
        headers: headers(),
      })
    );
    return rows.map(fromBackendAsset);
  },
};
