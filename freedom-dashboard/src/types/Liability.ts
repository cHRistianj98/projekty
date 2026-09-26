export type Liability = {
  id: number;
  name: string;

  originalAmount: number;
  remainingAmount: number;

  monthlyPayment: number;

  principalPayment: number;
  interestPayment: number;

  interestRate: number;
};