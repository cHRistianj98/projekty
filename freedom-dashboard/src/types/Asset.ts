export type AssetCategory =
  | "cash"
  | "stocks"
  | "crypto"
  | "realEstate"
  | "business"
  | "vehicle"
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
  | "vault";

export type Asset = {
  id: number;
  name: string;
  value: number;
  color: string;
  category?: AssetCategory;
  iconKey?: AssetIconKey;
};

export const assetCategoryLabels: Record<AssetCategory, string> = {
  cash: "Gotówka / konto",
  stocks: "Akcje / ETF",
  crypto: "Krypto",
  realEstate: "Nieruchomości",
  business: "Biznes",
  vehicle: "Pojazd",
  other: "Inne",
};

export const defaultAssetIconByCategory: Record<AssetCategory, AssetIconKey> = {
  cash: "landmark",
  stocks: "chart",
  crypto: "bitcoin",
  realEstate: "building",
  business: "briefcase",
  vehicle: "car",
  other: "circleDollar",
};

export function getAssetCategory(asset: Asset): AssetCategory {
  return asset.category ?? "other";
}

export function getAssetIconKey(asset: Asset): AssetIconKey {
  return asset.iconKey ?? defaultAssetIconByCategory[getAssetCategory(asset)];
}
