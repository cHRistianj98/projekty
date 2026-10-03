export type LiabilityAllocationSourceType = "ASSET" | "PORTFOLIO";

export type LiabilityAllocation = {
  id: number;
  liabilityId: number;
  assetId: number | null;
  assetName: string;
  amount: number;
  sourceType?: LiabilityAllocationSourceType;
  portfolioId?: number | null;
  portfolioName?: string | null;
};

export type LiabilityAllocationSummary = {
  liabilityId: number;
  bankRemainingAmount: number;
  allocatedAmount: number;
  effectiveRemainingAmount: number;
  allocations: LiabilityAllocation[];
};

export type LiabilityPortfolioAllocation = {
  liabilityId: number;
  liabilityName: string;
  liabilityImageUrl?: string | null;
  liabilityImagePosition?: string | null;
  originalAmount: number;
  bankRemainingAmount: number;
  assetId: number | null;
  assetName: string;
  amount: number;
  sourceType?: LiabilityAllocationSourceType;
  portfolioId?: number | null;
  portfolioName?: string | null;
};

export type LiabilityAllocationOverview = {
  totalAllocated: number;
  allocations: LiabilityPortfolioAllocation[];
};
