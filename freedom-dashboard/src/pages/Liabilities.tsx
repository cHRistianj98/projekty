import { useState } from "react";

import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  CreditCard,
  Landmark,
  Pencil,
  Percent,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

import { AddLiabilityModal } from "../components/liabilities/AddLiabilityModal";
import { EditLiabilityModal } from "../components/liabilities/EditLiabilityModal";

import type {
  Liability,
  LiabilityType,
} from "../types/Liability";

import {
  analyzeDebts,
  type DebtAction,
} from "../features/intelligence/debtIntelligence";

import {
  calculateLiabilityProgress,
  calculateMonthlyDebtPayments,
  calculateTotalLiabilities,
} from "../utils/liabilities";

type LiabilitiesProps = {
  liabilities: Liability[];
  onAddLiability: (
    liability: Liability
  ) => void;
  onUpdateLiability: (
    liability: Liability
  ) => void;
  onDeleteLiability: (
    id: number
  ) => void;
};

export function Liabilities({
  liabilities,
  onAddLiability,
  onUpdateLiability,
  onDeleteLiability,
}: LiabilitiesProps) {
  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] = useState(false);

  const [
    editingLiability,
    setEditingLiability,
  ] = useState<Liability | null>(
    null
  );

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

  const debtInsights =
    analyzeDebts(liabilities);

  const topDebt =
    debtInsights[0] ?? null;

  function handleDelete(
    liability: Liability
  ) {
    const shouldDelete =
      window.confirm(
        `Usunąć zobowiązanie "${liability.name}"?`
      );

    if (!shouldDelete) {
      return;
    }

    onDeleteLiability(
      liability.id
    );
  }

  return (
    <main className="min-h-screen bg-[#050b16] p-8">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <Landmark size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Zobowiązania
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kredyty, leasingi i
              inne zadłużenie
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsAddModalOpen(
              true
            )
          }
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          <Plus size={18} />
          Dodaj zobowiązanie
        </button>
      </div>

      {/* SUMMARY */}

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Łączny dług"
          value={`${totalLiabilities.toLocaleString(
            "pl-PL"
          )} zł`}
          icon={
            <CreditCard className="text-red-400" />
          }
        />

        <SummaryCard
          title="Łączne raty"
          value={`${monthlyPayments.toLocaleString(
            "pl-PL"
          )} zł`}
          icon={
            <WalletCards className="text-amber-400" />
          }
        />

        <SummaryCard
          title="Kapitał w ratach"
          value={`${totalPrincipal.toLocaleString(
            "pl-PL"
          )} zł`}
          icon={
            <Banknote className="text-emerald-400" />
          }
        />

        <SummaryCard
          title="Odsetki w ratach"
          value={`${totalInterest.toLocaleString(
            "pl-PL"
          )} zł`}
          icon={
            <Percent className="text-orange-400" />
          }
        />
      </section>

      {/* DEBT INTELLIGENCE */}

      <section className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <BrainCircuit size={20} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-400">
                Debt Intelligence 2.0
              </p>

              <h2 className="mt-1 text-xl font-black">
                Strategia zobowiązań
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                FREEDOM porządkuje długi według kosztu. Wysokie oprocentowanie
                dostaje wyższy priorytet nadpłaty; tani dług nie jest automatycznie
                traktowany jak alarm.
              </p>
            </div>
          </div>

          {topDebt ? (
            <div className="min-w-[280px] rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                Pierwszy kandydat do analizy
              </p>
              <p className="mt-1 font-black">
                {topDebt.liability.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {topDebt.liability.interestRate.toLocaleString("pl-PL")}%
                {" • "}
                {formatDebtAction(topDebt.action)}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-bold text-emerald-400">
              Brak aktywnych zobowiązań
            </div>
          )}
        </div>

        {debtInsights.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
            {debtInsights.slice(0, 3).map((insight, index) => (
              <div
                key={insight.liability.id}
                className={`rounded-xl border p-4 ${debtActionClasses(
                  insight.action
                )}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">
                    #{index + 1} {insight.liability.name}
                  </p>
                  <span className="text-xs font-black">
                    {insight.liability.interestRate.toLocaleString("pl-PL")}%
                  </span>
                </div>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em]">
                  {formatDebtAction(insight.action)}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {insight.reason}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>
            To heurystyka FREEDOM do porządkowania zobowiązań, nie indywidualna
            rekomendacja kredytowa. Nie uwzględnia jeszcze prowizji za wcześniejszą
            spłatę, podatków ani pełnych warunków umowy.
          </p>
        </div>
      </section>

      {/* LIST */}

      <section className="mt-8 space-y-4">
        {liabilities.map(
          (liability) => {
            const progress =
              calculateLiabilityProgress(
                liability
              );

            const paid =
              Math.max(
                liability.originalAmount -
                  liability.remainingAmount,
                0
              );

            const principal =
              liability.principalPayment ??
              0;

            const interest =
              liability.interestPayment ??
              0;

            const payment =
              liability.monthlyPayment;

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

            return (
              <div
                key={
                  liability.id
                }
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              >
                {/* HEADER */}

                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      {
                        liability.name
                      }
                    </h2>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-md border border-slate-700 bg-slate-950/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                        {formatLiabilityType(liability.type)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Spłacono{" "}
                      {progress.toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingLiability(
                          liability
                        )
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-500/10 hover:text-blue-400"
                    >
                      <Pencil
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          liability
                        )
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                </div>

                {/* DEBT */}

                <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <Info
                    label="Pozostało"
                    value={`${liability.remainingAmount.toLocaleString(
                      "pl-PL"
                    )} zł`}
                  />

                  <Info
                    label="Spłacono"
                    value={`${paid.toLocaleString(
                      "pl-PL"
                    )} zł`}
                  />

                  <Info
                    label="Aktualna rata"
                    value={`${payment.toLocaleString(
                      "pl-PL"
                    )} zł`}
                  />

                  <Info
                    label="Oprocentowanie"
                    value={`${liability.interestRate.toLocaleString(
                      "pl-PL"
                    )}%`}
                  />
                </div>

                {/* PAYMENT BREAKDOWN */}

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Struktura
                        aktualnej raty
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Dokładny podział
                        ostatniej raty
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {payment.toLocaleString(
                          "pl-PL"
                        )}{" "}
                        zł
                      </p>

                      <p className="text-xs text-slate-500">
                        cała rata
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-emerald-500/5 p-4">
                      <p className="text-xs text-slate-500">
                        Kapitał
                      </p>

                      <p className="mt-1 text-lg font-bold text-emerald-400">
                        {principal.toLocaleString(
                          "pl-PL"
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

                    <div className="rounded-xl bg-orange-500/5 p-4">
                      <p className="text-xs text-slate-500">
                        Odsetki
                      </p>

                      <p className="mt-1 text-lg font-bold text-orange-400">
                        {interest.toLocaleString(
                          "pl-PL"
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
                    <div className="mt-5">
                      <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
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
                </div>

                {/* TOTAL PROGRESS */}

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>
                      Postęp spłaty
                    </span>

                    <span>
                      {progress.toFixed(
                        0
                      )}
                      %
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 text-right text-xs text-slate-600">
                    Kwota początkowa:{" "}
                    {liability.originalAmount.toLocaleString(
                      "pl-PL"
                    )}{" "}
                    zł
                  </div>
                </div>
              </div>
            );
          }
        )}

        {liabilities.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-16 text-center">
            <Landmark
              size={38}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 text-lg font-semibold">
              Brak zobowiązań
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              I bardzo dobrze 😎
            </p>
          </div>
        )}
      </section>

      {isAddModalOpen && (
        <AddLiabilityModal
          onClose={() =>
            setIsAddModalOpen(
              false
            )
          }
          onAdd={
            onAddLiability
          }
        />
      )}

      {editingLiability && (
        <EditLiabilityModal
          liability={
            editingLiability
          }
          onClose={() =>
            setEditingLiability(
              null
            )
          }
          onUpdate={
            onUpdateLiability
          }
        />
      )}
    </main>
  );
}

function formatLiabilityType(
  type?: LiabilityType
) {
  return {
    MORTGAGE: "Hipoteka",
    CASH_LOAN: "Gotówkowy",
    CAR_LOAN: "Samochodowy",
    LEASING: "Leasing",
    INSTALLMENTS: "Raty",
    CREDIT_CARD: "Karta",
    OTHER: "Inne",
  }[type ?? "OTHER"];
}

function formatDebtAction(
  action: DebtAction
) {
  return {
    ATTACK: "AGGRESSIVE PAYDOWN",
    CONSIDER: "CONSIDER OVERPAYMENT",
    NORMAL: "NORMAL PAYDOWN",
    KEEP: "LOW-COST DEBT",
  }[action];
}

function debtActionClasses(
  action: DebtAction
) {
  return {
    ATTACK:
      "border-rose-500/20 bg-rose-500/5 text-rose-400",
    CONSIDER:
      "border-amber-500/20 bg-amber-500/5 text-amber-400",
    NORMAL:
      "border-blue-500/20 bg-blue-500/5 text-blue-400",
    KEEP:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  }[action];
}

type SummaryCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
};

function SummaryCard({
  title,
  value,
  icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
          {icon}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

type InfoProps = {
  label: string;
  value: string;
};

function Info({
  label,
  value,
}: InfoProps) {
  return (
    <div className="rounded-xl bg-slate-950/50 p-4">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-semibold">
        {value}
      </div>
    </div>
  );
}