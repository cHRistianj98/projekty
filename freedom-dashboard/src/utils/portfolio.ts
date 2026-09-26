import type { Asset } from "../types/Asset";

export function calculateNetWorth(
  portfolio: Asset[]
): number {
  return portfolio.reduce(
    (sum, asset) => sum + asset.value,
    0
  );
}

export function calculateAssetPercentage(
  assetValue: number,
  netWorth: number
): number {
  if (netWorth <= 0) {
    return 0;
  }

  return (assetValue / netWorth) * 100;
}