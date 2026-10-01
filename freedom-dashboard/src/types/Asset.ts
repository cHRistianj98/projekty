export type AssetCategory =
  | "cash"
  | "stocks"
  | "crypto"
  | "realEstate"
  | "business"
  | "vehicle"
  | "metals"
  | "bonds"
  | "other";

export type AssetIconKey =
  | "landmark"
  | "wallet"
  | "banknote"
  | "coins"
  | "trendingUp"
  | "chart"
  | "bitcoin"
  | "circleDollar"
  | "building"
  | "house"
  | "briefcase"
  | "car"
  | "shield"
  | "piggyBank"
  | "gem"
  | "vault"
  | "goldBars"
  | "silverCoin"
  | "scrollText";

export type MetalSymbol = "XAU" | "XAG";
export type MetalUnit = "TROY_OUNCE" | "GRAM";
export type RealEstateType = "APARTMENT";
export type RealEstateValuationMode = "MARKET_MEDIAN" | "MARKET_ANCHORED";
export type RealEstateMarketSegment = "ALL" | "PRIMARY" | "SECONDARY";

export type CryptoPresetKey = "BTC" | "ETH" | "USDC" | "NOS" | "PEAQ" | "TRAC" | "CPOOL";

export type Asset = {
  id: number;
  name: string;
  value: number;
  color: string;
  category?: AssetCategory;
  iconKey?: AssetIconKey;
  systemCash?: boolean;
  portfolioId?: number;

  marketPriced?: boolean;
  metalSymbol?: MetalSymbol;
  metalQuantity?: number;
  metalUnit?: MetalUnit;
  marketPriceUsd?: number;
  usdPlnRate?: number;
  marketUpdatedAt?: string;

  cryptoCoinId?: string;
  cryptoSymbol?: string;
  cryptoQuantity?: number;
  cryptoPricePln?: number;
  cryptoPriceUsd?: number;
  cryptoChange24h?: number;
  cryptoUpdatedAt?: string;

  realEstateType?: RealEstateType;
  realEstateCity?: string;
  realEstateDistrict?: string;
  realEstateAreaSqm?: number;
  realEstateValuationMode?: RealEstateValuationMode;
  realEstateMarketSegment?: RealEstateMarketSegment;
  realEstatePurchasePrice?: number;
  realEstatePurchaseDate?: string;
  realEstateMedianPriceSqm?: number;
  realEstateEstimatedPriceSqm?: number;
  realEstateScope?: string;
  realEstateResolvedArea?: string;
  realEstateRecordCount?: number;
  realEstatePeriodFrom?: string;
  realEstatePeriodTo?: string;
  realEstateAnchorMedianPriceSqm?: number;
  realEstateQualityFactor?: number;
  realEstateAnchorResolvedArea?: string;
  realEstateAnchorScope?: string;
  realEstateAnchorRecordCount?: number;
  realEstateAnchorPeriodFrom?: string;
  realEstateAnchorPeriodTo?: string;
  realEstateUpdatedAt?: string;

  bondPurchaseValue?: number;
  bondGrossValue?: number;
  bondTaxableGain?: number;
  bondTaxRate?: number;
  bondTaxAmount?: number;
};

export const assetCategoryLabels: Record<AssetCategory, string> = {
  cash: "Gotówka / konto",
  stocks: "Akcje / ETF",
  crypto: "Krypto",
  realEstate: "Nieruchomości",
  business: "Biznes",
  vehicle: "Pojazd",
  metals: "Metale szlachetne",
  bonds: "Obligacje skarbowe",
  other: "Inne",
};

export const defaultAssetIconByCategory: Record<AssetCategory, AssetIconKey> = {
  cash: "landmark",
  stocks: "chart",
  crypto: "bitcoin",
  realEstate: "building",
  business: "briefcase",
  vehicle: "car",
  metals: "goldBars",
  bonds: "scrollText",
  other: "circleDollar",
};

export function getAssetCategory(asset: Asset): AssetCategory {
  return asset.category ?? "other";
}

export function getAssetIconKey(asset: Asset): AssetIconKey {
  return asset.iconKey ?? defaultAssetIconByCategory[getAssetCategory(asset)];
}

export function metalUnitLabel(unit?: MetalUnit): string {
  return unit === "GRAM" ? "g" : "oz t";
}
