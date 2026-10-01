import type {
  Asset,
  AssetCategory,
  AssetIconKey,
  MetalSymbol,
  MetalUnit,
  CashCurrency,
  RealEstateType,
  RealEstateValuationMode,
  RealEstateMarketSegment,
} from "../types/Asset";
import { authApi } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type BackendAssetCategory =
  | "CASH"
  | "STOCKS"
  | "CRYPTO"
  | "REAL_ESTATE"
  | "BUSINESS"
  | "VEHICLE"
  | "METALS"
  | "BONDS"
  | "OTHER";

type BackendAsset = {
  id: number;
  name: string;
  value: number;
  color: string;
  category: BackendAssetCategory;
  iconKey?: AssetIconKey | null;
  systemCash?: boolean;
  portfolioId: number;
  marketPriced?: boolean;
  metalSymbol?: MetalSymbol | null;
  metalQuantity?: number | null;
  metalUnit?: MetalUnit | null;
  marketPriceUsd?: number | null;
  usdPlnRate?: number | null;
  marketUpdatedAt?: string | null;
  cryptoCoinId?: string | null;
  cryptoSymbol?: string | null;
  cryptoQuantity?: number | null;
  cryptoPricePln?: number | null;
  cryptoPriceUsd?: number | null;
  cryptoChange24h?: number | null;
  cryptoUpdatedAt?: string | null;
  fxPriced?: boolean;
  cashCurrency?: CashCurrency | null;
  cashQuantity?: number | null;
  fxRatePln?: number | null;
  fxEffectiveDate?: string | null;
  fxUpdatedAt?: string | null;
  realEstateType?: RealEstateType | null;
  realEstateCity?: string | null;
  realEstateDistrict?: string | null;
  realEstateAreaSqm?: number | null;
  realEstateValuationMode?: RealEstateValuationMode | null;
  realEstateMarketSegment?: RealEstateMarketSegment | null;
  realEstatePurchasePrice?: number | null;
  realEstatePurchaseDate?: string | null;
  realEstateMedianPriceSqm?: number | null;
  realEstateEstimatedPriceSqm?: number | null;
  realEstateScope?: string | null;
  realEstateResolvedArea?: string | null;
  realEstateRecordCount?: number | null;
  realEstatePeriodFrom?: string | null;
  realEstatePeriodTo?: string | null;
  realEstateAnchorMedianPriceSqm?: number | null;
  realEstateQualityFactor?: number | null;
  realEstateAnchorResolvedArea?: string | null;
  realEstateAnchorScope?: string | null;
  realEstateAnchorRecordCount?: number | null;
  realEstateAnchorPeriodFrom?: string | null;
  realEstateAnchorPeriodTo?: string | null;
  realEstateUpdatedAt?: string | null;
  bondPurchaseValue?: number | null;
  bondGrossValue?: number | null;
  bondTaxableGain?: number | null;
  bondTaxRate?: number | null;
  bondTaxAmount?: number | null;
};

function authHeaders(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `HTTP ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function toBackendCategory(category?: AssetCategory): BackendAssetCategory {
  switch (category) {
    case "cash": return "CASH";
    case "stocks": return "STOCKS";
    case "crypto": return "CRYPTO";
    case "realEstate": return "REAL_ESTATE";
    case "business": return "BUSINESS";
    case "vehicle": return "VEHICLE";
    case "metals": return "METALS";
    case "bonds": return "BONDS";
    default: return "OTHER";
  }
}

function fromBackendCategory(category: BackendAssetCategory): AssetCategory {
  switch (category) {
    case "CASH": return "cash";
    case "STOCKS": return "stocks";
    case "CRYPTO": return "crypto";
    case "REAL_ESTATE": return "realEstate";
    case "BUSINESS": return "business";
    case "VEHICLE": return "vehicle";
    case "METALS": return "metals";
    case "BONDS": return "bonds";
    default: return "other";
  }
}

export function fromBackendAsset(row: BackendAsset): Asset {
  return {
    id: row.id,
    name: row.name,
    value: Number(row.value),
    color: row.color,
    category: fromBackendCategory(row.category),
    ...(row.iconKey ? { iconKey: row.iconKey } : {}),
    systemCash: Boolean(row.systemCash),
    portfolioId: row.portfolioId,
    marketPriced: Boolean(row.marketPriced),
    ...(row.metalSymbol ? { metalSymbol: row.metalSymbol } : {}),
    ...(row.metalQuantity != null ? { metalQuantity: Number(row.metalQuantity) } : {}),
    ...(row.metalUnit ? { metalUnit: row.metalUnit } : {}),
    ...(row.marketPriceUsd != null ? { marketPriceUsd: Number(row.marketPriceUsd) } : {}),
    ...(row.usdPlnRate != null ? { usdPlnRate: Number(row.usdPlnRate) } : {}),
    ...(row.marketUpdatedAt ? { marketUpdatedAt: row.marketUpdatedAt } : {}),
    ...(row.cryptoCoinId ? { cryptoCoinId: row.cryptoCoinId } : {}),
    ...(row.cryptoSymbol ? { cryptoSymbol: row.cryptoSymbol } : {}),
    ...(row.cryptoQuantity != null ? { cryptoQuantity: Number(row.cryptoQuantity) } : {}),
    ...(row.cryptoPricePln != null ? { cryptoPricePln: Number(row.cryptoPricePln) } : {}),
    ...(row.cryptoPriceUsd != null ? { cryptoPriceUsd: Number(row.cryptoPriceUsd) } : {}),
    ...(row.cryptoChange24h != null ? { cryptoChange24h: Number(row.cryptoChange24h) } : {}),
    ...(row.cryptoUpdatedAt ? { cryptoUpdatedAt: row.cryptoUpdatedAt } : {}),
    fxPriced: Boolean(row.fxPriced),
    ...(row.cashCurrency ? { cashCurrency: row.cashCurrency } : {}),
    ...(row.cashQuantity != null ? { cashQuantity: Number(row.cashQuantity) } : {}),
    ...(row.fxRatePln != null ? { fxRatePln: Number(row.fxRatePln) } : {}),
    ...(row.fxEffectiveDate ? { fxEffectiveDate: row.fxEffectiveDate } : {}),
    ...(row.fxUpdatedAt ? { fxUpdatedAt: row.fxUpdatedAt } : {}),
    ...(row.realEstateType ? { realEstateType: row.realEstateType } : {}),
    ...(row.realEstateCity ? { realEstateCity: row.realEstateCity } : {}),
    ...(row.realEstateDistrict ? { realEstateDistrict: row.realEstateDistrict } : {}),
    ...(row.realEstateAreaSqm != null ? { realEstateAreaSqm: Number(row.realEstateAreaSqm) } : {}),
    ...(row.realEstateValuationMode ? { realEstateValuationMode: row.realEstateValuationMode } : {}),
    ...(row.realEstateMarketSegment ? { realEstateMarketSegment: row.realEstateMarketSegment } : {}),
    ...(row.realEstatePurchasePrice != null ? { realEstatePurchasePrice: Number(row.realEstatePurchasePrice) } : {}),
    ...(row.realEstatePurchaseDate ? { realEstatePurchaseDate: row.realEstatePurchaseDate } : {}),
    ...(row.realEstateMedianPriceSqm != null ? { realEstateMedianPriceSqm: Number(row.realEstateMedianPriceSqm) } : {}),
    ...(row.realEstateEstimatedPriceSqm != null ? { realEstateEstimatedPriceSqm: Number(row.realEstateEstimatedPriceSqm) } : {}),
    ...(row.realEstateScope ? { realEstateScope: row.realEstateScope } : {}),
    ...(row.realEstateResolvedArea ? { realEstateResolvedArea: row.realEstateResolvedArea } : {}),
    ...(row.realEstateRecordCount != null ? { realEstateRecordCount: Number(row.realEstateRecordCount) } : {}),
    ...(row.realEstatePeriodFrom ? { realEstatePeriodFrom: row.realEstatePeriodFrom } : {}),
    ...(row.realEstatePeriodTo ? { realEstatePeriodTo: row.realEstatePeriodTo } : {}),
    ...(row.realEstateAnchorMedianPriceSqm != null ? { realEstateAnchorMedianPriceSqm: Number(row.realEstateAnchorMedianPriceSqm) } : {}),
    ...(row.realEstateQualityFactor != null ? { realEstateQualityFactor: Number(row.realEstateQualityFactor) } : {}),
    ...(row.realEstateAnchorResolvedArea ? { realEstateAnchorResolvedArea: row.realEstateAnchorResolvedArea } : {}),
    ...(row.realEstateAnchorScope ? { realEstateAnchorScope: row.realEstateAnchorScope } : {}),
    ...(row.realEstateAnchorRecordCount != null ? { realEstateAnchorRecordCount: Number(row.realEstateAnchorRecordCount) } : {}),
    ...(row.realEstateAnchorPeriodFrom ? { realEstateAnchorPeriodFrom: row.realEstateAnchorPeriodFrom } : {}),
    ...(row.realEstateAnchorPeriodTo ? { realEstateAnchorPeriodTo: row.realEstateAnchorPeriodTo } : {}),
    ...(row.realEstateUpdatedAt ? { realEstateUpdatedAt: row.realEstateUpdatedAt } : {}),
    ...(row.bondPurchaseValue != null ? { bondPurchaseValue: Number(row.bondPurchaseValue) } : {}),
    ...(row.bondGrossValue != null ? { bondGrossValue: Number(row.bondGrossValue) } : {}),
    ...(row.bondTaxableGain != null ? { bondTaxableGain: Number(row.bondTaxableGain) } : {}),
    ...(row.bondTaxRate != null ? { bondTaxRate: Number(row.bondTaxRate) } : {}),
    ...(row.bondTaxAmount != null ? { bondTaxAmount: Number(row.bondTaxAmount) } : {}),
  };
}

function body(asset: Asset) {
  const liveMetal = asset.category === "metals" && Boolean(asset.marketPriced);
  const liveCrypto = asset.category === "crypto" && Boolean(asset.marketPriced);
  const liveFxCash = asset.category === "cash" && Boolean(asset.fxPriced) && !asset.systemCash;
  const liveApartment = asset.category === "realEstate" && Boolean(asset.marketPriced);
  const retailBond = asset.category === "bonds";
  return {
    name: asset.name,
    value: asset.value,
    color: asset.color,
    category: toBackendCategory(asset.category),
    iconKey: asset.iconKey ?? null,
    portfolioId: asset.portfolioId ?? null,
    marketPriced: liveMetal || liveCrypto || liveApartment,
    metalSymbol: liveMetal ? asset.metalSymbol ?? null : null,
    metalQuantity: liveMetal ? asset.metalQuantity ?? null : null,
    metalUnit: liveMetal ? asset.metalUnit ?? null : null,
    cryptoCoinId: liveCrypto ? asset.cryptoCoinId ?? null : null,
    cryptoSymbol: liveCrypto ? asset.cryptoSymbol ?? null : null,
    cryptoQuantity: liveCrypto ? asset.cryptoQuantity ?? null : null,
    fxPriced: liveFxCash,
    cashCurrency: liveFxCash ? asset.cashCurrency ?? null : null,
    cashQuantity: liveFxCash ? asset.cashQuantity ?? null : null,
    realEstateType: liveApartment ? asset.realEstateType ?? "APARTMENT" : null,
    realEstateCity: liveApartment ? asset.realEstateCity ?? null : null,
    realEstateDistrict: liveApartment ? asset.realEstateDistrict ?? null : null,
    realEstateAreaSqm: liveApartment ? asset.realEstateAreaSqm ?? null : null,
    realEstateValuationMode: liveApartment ? asset.realEstateValuationMode ?? "MARKET_MEDIAN" : null,
    realEstateMarketSegment: liveApartment ? asset.realEstateMarketSegment ?? "ALL" : null,
    realEstatePurchasePrice: liveApartment && asset.realEstateValuationMode === "MARKET_ANCHORED"
      ? asset.realEstatePurchasePrice ?? null
      : null,
    realEstatePurchaseDate: liveApartment && asset.realEstateValuationMode === "MARKET_ANCHORED"
      ? asset.realEstatePurchaseDate ?? null
      : null,
    bondPurchaseValue: retailBond ? asset.bondPurchaseValue ?? null : null,
    bondGrossValue: retailBond ? asset.bondGrossValue ?? null : null,
  };
}

export const assetApi = {
  async getAll(): Promise<Asset[]> {
    const rows = await handle<BackendAsset[]>(
      await fetch(`${API_URL}/api/assets`, { headers: authHeaders() })
    );
    return rows.map(fromBackendAsset);
  },

  async create(asset: Asset): Promise<Asset> {
    const row = await handle<BackendAsset>(
      await fetch(`${API_URL}/api/assets`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body(asset)),
      })
    );
    return fromBackendAsset(row);
  },

  async update(id: number, asset: Asset): Promise<Asset> {
    const row = await handle<BackendAsset>(
      await fetch(`${API_URL}/api/assets/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body(asset)),
      })
    );
    return fromBackendAsset(row);
  },

  async remove(id: number): Promise<void> {
    await handle<void>(
      await fetch(`${API_URL}/api/assets/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },
};
