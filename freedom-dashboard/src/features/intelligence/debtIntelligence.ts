import type {
  Liability,
  LiabilityType,
} from "../../types/Liability";

export type DebtAction =
  | "ATTACK"
  | "CONSIDER"
  | "NORMAL"
  | "KEEP";

export type DebtInsight = {
  liability: Liability;
  action: DebtAction;
  score: number;
  label: string;
  reason: string;
};

export function analyzeDebts(
  liabilities: Liability[]
): DebtInsight[] {
  return liabilities
    .filter(
      (liability) =>
        liability.remainingAmount > 0
    )
    .map((liability) => {
      const rate =
        Math.max(
          liability.interestRate,
          0
        );

      const interestShare =
        liability.monthlyPayment > 0
          ? (liability.interestPayment /
              liability.monthlyPayment) *
            100
          : 0;

      const typeWeight =
        getTypeWeight(
          liability.type
        );

      const score =
        rate * 10 +
        interestShare * 0.35 +
        typeWeight;

      if (rate >= 10) {
        return {
          liability,
          action: "ATTACK" as const,
          score,
          label: "AGGRESSIVE PAYDOWN",
          reason:
            `Wysokie oprocentowanie ${formatRate(rate)}. ` +
            "Ten dług ma wysoki koszt gwarantowany, więc jest pierwszym kandydatem do nadpłaty.",
        };
      }

      if (rate >= 7) {
        return {
          liability,
          action: "CONSIDER" as const,
          score,
          label: "CONSIDER OVERPAYMENT",
          reason:
            `Oprocentowanie ${formatRate(rate)} jest istotne. ` +
            "Nadpłata może konkurować z inwestowaniem, zależnie od płynności i celów.",
        };
      }

      if (rate > 3) {
        return {
          liability,
          action: "NORMAL" as const,
          score,
          label: "NORMAL PAYDOWN",
          reason:
            `Oprocentowanie ${formatRate(rate)} jest umiarkowane. ` +
            "Utrzymuj ratę; agresywna nadpłata nie musi być pierwszym priorytetem.",
        };
      }

      return {
        liability,
        action: "KEEP" as const,
        score,
        label: "LOW-COST DEBT",
        reason:
          `Oprocentowanie ${formatRate(rate)} jest niskie. ` +
          "Sam niski koszt długu nie daje mocnego sygnału do agresywnej nadpłaty.",
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score
    );
}

export function getDebtAttackOrder(
  liabilities: Liability[]
) {
  return analyzeDebts(liabilities);
}

function getTypeWeight(
  type?: LiabilityType
) {
  return {
    CREDIT_CARD: 20,
    CASH_LOAN: 15,
    CAR_LOAN: 8,
    INSTALLMENTS: 5,
    LEASING: 4,
    MORTGAGE: 0,
    OTHER: 3,
  }[type ?? "OTHER"];
}

function formatRate(value: number) {
  return `${value.toLocaleString(
    "pl-PL",
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}
