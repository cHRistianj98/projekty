export type PortfolioType = "MAIN" | "GOALS" | "CUSTOM";

export type PortfolioWallet = {
  id: number;
  name: string;
  type: PortfolioType;
  color: string;
  iconKey: string;
  systemPortfolio: boolean;
  grossValue: number;
  allocatedOut: number;
  value: number;
  targetAmount: number | null;
  monthlyContribution: number;
};

export type PortfolioInput = {
  name: string;
  color: string;
  iconKey: string;
  targetAmount: number | null;
  monthlyContribution: number;
};

export type ValuationEvent = {
  id: number;
  assetId: number | null;
  assetName: string;
  previousValue: number;
  newValue: number;
  delta: number;
  reason: string;
  createdAt: string;
};
