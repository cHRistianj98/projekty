export type GoalStatus = "ACTIVE" | "FUNDED" | "COMPLETED";

export type SpendableGoal = {
  goalId: number;
  name: string;
  status: GoalStatus;
  color: string;
  imageUrl?: string | null;
  targetAmount: number;
  coveredAmount: number;
  totalReserved: number;
  reservedOnAsset: number;
  spentAmount: number;
};

export type GoalCompletionMode =
  | "RELEASE"
  | "TRANSFER_TO_GOAL";

export type GoalCompletionRequest = {
  mode: GoalCompletionMode;
  targetGoalId?: number | null;
};

export type GoalCompletionResponse = {
  goalId: number;
  status: "COMPLETED";
  spentAmount: number;
  releasedAmount: number;
  transferredAmount: number;
  targetGoalId?: number | null;
  completedAt: string;
};
