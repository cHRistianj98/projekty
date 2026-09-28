export type LiabilityType =
  | "MORTGAGE"
  | "CASH_LOAN"
  | "CAR_LOAN"
  | "LEASING"
  | "INSTALLMENTS"
  | "CREDIT_CARD"
  | "OTHER";

export type LiabilityImagePosition = "center" | "top" | "bottom";

export type Liability = {
  id: number;
  name: string;
  type?: LiabilityType;
  originalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  interestRate: number;
  imageUrl?: string;
  imagePosition?: LiabilityImagePosition;
  iconKey?: string;
};
