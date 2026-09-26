import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  WalletCards,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Liability } from "../../types/Liability";

import {
  calculateLiabilityProgress,
  calculateMonthlyDebtPayments,
  calculateTotalLiabilities,
} from "../../utils/liabilities";

type LiabilitiesSectionProps = {
  liabilities: Liability[];
};

export function LiabilitiesSection({
  liabilities,
}: LiabilitiesSectionProps) {
  const navigate = useNavigate();

  const totalLiabilities =
    calculateTotalLiabilities(
      liabilities
    );

  const monthlyPayments =
    calculateMonthlyDebtPayments(
      liabilities
    );

  const totalPrincipal =
    liabilities.reduce(
      (sum, liability) =>
        sum +
        (liability.principalPayment ??
          0),
      0
    );

  const totalInterest =
    liabilities.reduce(
      (sum, liability) =>
        sum +
        (liability.interestPayment ??
          0),
      0
    );

  const totalPrincipalShare =
    monthlyPayments > 0
      ? (totalPrincipal /
          monthlyPayments) *
        100
      : 0;

  const totalInterestShare =
    monthlyPayments > 0
      ? (totalInterest /
          monthlyPayments) *
        100
      : 0;

  return (
    <section className="mt-6">
      {/* HEADER */}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark
            size={20}
            className="text-red-400"
          />

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Zobowiązania
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/liabilities"
            )
          }
          className="flex items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300"
        >
          Zobacz wszystkie
          <ArrowRight size={16} />
        </button>
      </div>

      {/* EMPTY STATE */}

      {liabilities.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2
                size={24}
                className="text-emerald-400"
              />
            </div>

            <div>
              <h3 className="font-semibold">
                Brak zobowiązań
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Twój majątek nie jest
                obecnie obciążony
                zadłużeniem.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* SUMMARY */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Łączny dług"
              value={`${totalLiabilities.toLocaleString(
                "pl-PL"
              )} zł`}
              description="Pozostało do spłaty"
            />

            <SummaryCard
              label="Łączne raty"
              value={`${monthlyPayments.toLocaleString(
                "pl-PL",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )} zł`}
              description="Miesięcznie"
            />

            <SummaryCard
              label="Kapitał"
              value={`${totalPrincipal.toLocaleString(
                "pl-PL",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )} zł`}
              description={`${totalPrincipalShare.toFixed(
                1
              )}% wszystkich rat`}
              valueClassName="text-emerald-400"
            />

            <SummaryCard
              label="Odsetki"
              value={`${totalInterest.toLocaleString(
                "pl-PL",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )} zł`}
              description={`${totalInterestShare.toFixed(
                1
              )}% wszystkich rat`}
              valueClassName="text-orange-400"
            />
          </div>

          {/* TOTAL PAYMENT STRUCTURE */}

          {monthlyPayments > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    Struktura miesięcznych rat
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Ile faktycznie
                    zmniejsza dług, a
                    ile stanowią
                    odsetki
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">
                    {monthlyPayments.toLocaleString(
                      "pl-PL",
                      {
                        minimumFractionDigits:
                          2,
                        maximumFractionDigits:
                          2,
                      }
                    )}{" "}
                    zł
                  </p>

                  <p className="text-xs text-slate-500">
                    miesięcznie
                  </p>
                </div>
              </div>

              {/* BAR */}

              <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${totalPrincipalShare}%`,
                  }}
                />

                <div
                  className="h-full bg-orange-500"
                  style={{
                    width: `${totalInterestShare}%`,
                  }}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Kapitał
                  </p>

                  <p className="mt-1 font-bold text-emerald-400">
                    {totalPrincipal.toLocaleString(
                      "pl-PL",
                      {
                        minimumFractionDigits:
                          2,
                        maximumFractionDigits:
                          2,
                      }
                    )}{" "}
                    zł
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {totalPrincipalShare.toFixed(
                      1
                    )}
                    % rat
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Odsetki
                  </p>

                  <p className="mt-1 font-bold text-orange-400">
                    {totalInterest.toLocaleString(
                      "pl-PL",
                      {
                        minimumFractionDigits:
                          2,
                        maximumFractionDigits:
                          2,
                      }
                    )}{" "}
                    zł
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {totalInterestShare.toFixed(
                      1
                    )}
                    % rat
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INDIVIDUAL LIABILITIES */}

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {liabilities
              .slice(0, 4)
              .map(
                (liability) => {
                  const payment =
                    liability.monthlyPayment ??
                    0;

                  const principal =
                    liability.principalPayment ??
                    0;

                  /*
                   * Liczymy również tutaj,
                   * żeby stare dane z
                   * localStorage nie
                   * rozwaliły widoku.
                   */

                  const interest =
                    liability.interestPayment ??
                    Math.max(
                      payment -
                        principal,
                      0
                    );

                  const principalShare =
                    payment > 0
                      ? (principal /
                          payment) *
                        100
                      : 0;

                  const interestShare =
                    payment > 0
                      ? (interest /
                          payment) *
                        100
                      : 0;

                  const debtProgress =
                    calculateLiabilityProgress(
                      liability
                    );

                  return (
                    <div
                      key={
                        liability.id
                      }
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                    >
                      {/* NAME + PAYMENT */}

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">
                            {
                              liability.name
                            }
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Pozostało{" "}
                            {liability.remainingAmount.toLocaleString(
                              "pl-PL"
                            )}{" "}
                            zł
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">
                            {payment.toLocaleString(
                              "pl-PL",
                              {
                                minimumFractionDigits:
                                  2,
                                maximumFractionDigits:
                                  2,
                              }
                            )}{" "}
                            zł
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            / miesiąc
                          </p>
                        </div>
                      </div>

                      {/* PAYMENT SPLIT */}

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-emerald-500/5 p-3">
                          <p className="text-xs text-slate-500">
                            Kapitał
                          </p>

                          <p className="mt-1 text-lg font-bold text-emerald-400">
                            {principal.toLocaleString(
                              "pl-PL",
                              {
                                minimumFractionDigits:
                                  2,
                                maximumFractionDigits:
                                  2,
                              }
                            )}{" "}
                            zł
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {principalShare.toFixed(
                              1
                            )}
                            % raty
                          </p>
                        </div>

                        <div className="rounded-xl bg-orange-500/5 p-3">
                          <p className="text-xs text-slate-500">
                            Odsetki
                          </p>

                          <p className="mt-1 text-lg font-bold text-orange-400">
                            {interest.toLocaleString(
                              "pl-PL",
                              {
                                minimumFractionDigits:
                                  2,
                                maximumFractionDigits:
                                  2,
                              }
                            )}{" "}
                            zł
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {interestShare.toFixed(
                              1
                            )}
                            % raty
                          </p>
                        </div>
                      </div>

                      {/* PAYMENT BAR */}

                      {payment > 0 && (
                        <div className="mt-4">
                          <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${principalShare}%`,
                              }}
                            />

                            <div
                              className="h-full bg-orange-500"
                              style={{
                                width: `${interestShare}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-emerald-400">
                              Kapitał{" "}
                              {principalShare.toFixed(
                                1
                              )}
                              %
                            </span>

                            <span className="text-orange-400">
                              Odsetki{" "}
                              {interestShare.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      )}

                      {/* DEBT PROGRESS */}

                      <div className="mt-5 border-t border-slate-800 pt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Spłata całego
                            zobowiązania
                          </span>

                          <span>
                            {debtProgress.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${debtProgress}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                          <span>
                            Oprocentowanie{" "}
                            {liability.interestRate.toLocaleString(
                              "pl-PL"
                            )}
                            %
                          </span>

                          <span>
                            Pozostało{" "}
                            {liability.remainingAmount.toLocaleString(
                              "pl-PL"
                            )}{" "}
                            zł
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
          </div>

          {liabilities.length >
            4 && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/liabilities"
                )
              }
              className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              +{" "}
              {liabilities.length -
                4}{" "}
              więcej zobowiązań
            </button>
          )}
        </>
      )}
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  valueClassName?: string;
};

function SummaryCard({
  label,
  value,
  description,
  valueClassName = "",
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClassName}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}