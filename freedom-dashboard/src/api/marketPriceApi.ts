import { authApi } from "./authApi";
import { fromBackendAsset } from "./assetApi";
import type { Asset, MetalSymbol, RealEstateMarketSegment, RealEstateValuationMode } from "../types/Asset";

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
