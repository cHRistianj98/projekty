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
  effectiveDate: string;
  tableNo: string;
  fetchedAt: string;
  source: string;
};

export type CryptoQuote = {
  coinId: string;
  symbol: string;
  name: string;
  pricePln: number;
  priceUsd?: number | null;
  change24h?: number | null;
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

  async getFxQuote(currency: CashCurrency): Promise<FxQuote> {
    const params = new URLSearchParams({ currency });
    const row = await handle<FxQuote>(
      await fetch(`${API_URL}/api/market/fx/quote?${params.toString()}`, { headers: headers() })
    );
    return { ...row, ratePln: Number(row.ratePln) };
  },

  async getFxQuotes(): Promise<FxQuote[]> {
    const rows = await handle<FxQuote[]>(
      await fetch(`${API_URL}/api/market/fx/quotes`, { headers: headers() })
    );
    return rows.map((row) => ({ ...row, ratePln: Number(row.ratePln) }));
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
