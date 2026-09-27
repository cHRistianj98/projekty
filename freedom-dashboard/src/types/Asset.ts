export type AssetCategory =
  | "cash"
  | "stocks"
  | "crypto"
  | "realEstate"
  | "business"
  | "vehicle"
  | "other";

export type Asset = {
  id: number;
  name: string;
  value: number;
  color: string;

  /**
   * Optional only for backward compatibility with assets already stored
   * in localStorage before Asset 2.0.
   * New and edited assets always receive a category.
   */
  category?: AssetCategory;
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

export function getAssetCategory(asset: Asset): AssetCategory {
  return asset.category ?? "other";
}
