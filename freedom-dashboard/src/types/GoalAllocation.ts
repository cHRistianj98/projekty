export type GoalAllocationMode =
  | "ALLOCATE_EXISTING"
  | "TRANSFER_AND_ALLOCATE";

export type GoalAllocation = {
  id: number;
  goalId: number;
  assetId: number | null;
  assetName: string;
  amount: number;
};

export type GoalContribution = {
  id: number;
  goalId: number;
  amount: number;
  mode: GoalAllocationMode;
  sourceAssetId: number | null;
  targetAssetId: number | null;
  createdAt: string;
};

export type GoalAllocationSummary = {
  goalId: number;
  goalCurrentAmount: number;
  allocations: GoalAllocation[];
  contributions: GoalContribution[];
};

export type AllocateGoalMoneyRequest = {
  amount: number;
  mode: GoalAllocationMode;
  sourceAssetId?: number | null;
  targetAssetId: number;
};

export type PortfolioAllocation={goalId:number;goalName:string;assetId:number|null;assetName:string;amount:number};
export type MoneyFlowOverview={totalAllocated:number;allocations:PortfolioAllocation[];executedGoalIds:number[]};
