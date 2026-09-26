import type { Liability } from "../types/Liability";

export function calculateTotalLiabilities(
  liabilities: Liability[]
): number {
  return liabilities.reduce(
    (sum, liability) =>
      sum + liability.remainingAmount,
    0
  );
}

export function calculateMonthlyDebtPayments(
  liabilities: Liability[]
): number {
  return liabilities.reduce(
    (sum, liability) =>
      sum + liability.monthlyPayment,
    0
  );
}

export function calculateLiabilityProgress(
  liability: Liability
): number {
  if (liability.originalAmount <= 0) {
    return 0;
  }

  const paid =
    liability.originalAmount -
    liability.remainingAmount;

  return Math.min(
    Math.max(
      (paid / liability.originalAmount) * 100,
      0
    ),
    100
  );
}