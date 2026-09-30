export type AssetCategory =
  | "cash"
  | "stocks"
  | "crypto"
  | "realEstate"
  | "business"
  | "vehicle"
  | "metals"
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
  | "silverCoin";

export type MetalSymbol = "XAU" | "XAG";
export type MetalUnit = "TROY_OUNCE" | "GRAM";

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
};

export const assetCategoryLabels: Record<AssetCategory, string> = {
  cash: "Gotówka / konto",
  stocks: "Akcje / ETF",
  crypto: "Krypto",
  realEstate: "Nieruchomości",
  business: "Biznes",
  vehicle: "Pojazd",
  metals: "Metale szlachetne",
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
