import { useState } from "react";

import {
  AlertCircle,
  X,
} from "lucide-react";

import type { Liability, LiabilityType } from "../../types/Liability";

type AddLiabilityModalProps = {
  onClose: () => void;
  onAdd: (
    liability: Liability
  ) => void;
};

export function AddLiabilityModal({
  onClose,
  onAdd,
}: AddLiabilityModalProps) {
  const [liabilityType, setLiabilityType] =
    useState<LiabilityType>("OTHER");

  const [name, setName] =
    useState("");

  const [
    originalAmount,
    setOriginalAmount,
  ] = useState("");

  const [
    remainingAmount,
    setRemainingAmount,
  ] = useState("");

  const [
    monthlyPayment,
    setMonthlyPayment,
  ] = useState("");

  const [
    principalPayment,
    setPrincipalPayment,
  ] = useState("");

  const [
    interestRate,
    setInterestRate,
  ] = useState("");

  const [error, setError] =
    useState("");

  /*
   * =========================
   * LIVE CALCULATIONS
   * =========================
   */

  const payment =
    Number(monthlyPayment) || 0;

  const principal =
    Number(principalPayment) || 0;

  const interestPayment =
    Math.max(
      payment - principal,
      0
    );

  const principalShare =
    payment > 0
      ? Math.min(
          (principal / payment) *
            100,
          100
        )
      : 0;

  const interestShare =
    payment > 0
      ? Math.min(
          (interestPayment /
            payment) *
            100,
          100
        )
      : 0;

  /*
   * =========================
   * SUBMIT
   * =========================
   */

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    const original =
      Number(originalAmount);

    const remaining =
      Number(remainingAmount);

    const currentPayment =
      Number(monthlyPayment);

    const currentPrincipal =
      Number(principalPayment);

    const rate =
      Number(interestRate);

    if (!name.trim()) {
      setError(
        "Podaj nazwę zobowiązania."
      );
      return;
    }

    if (
      !Number.isFinite(
        original
      ) ||
      original <= 0
    ) {
      setError(
        "Kwota początkowa musi być większa od 0."
      );
      return;
    }

    if (
      !Number.isFinite(
        remaining
      ) ||
      remaining < 0 ||
      remaining > original
    ) {
      setError(
        "Pozostała kwota musi mieścić się między 0 a kwotą początkową."
      );
      return;
    }

    if (
      !Number.isFinite(
        currentPayment
      ) ||
      currentPayment < 0
    ) {
      setError(
        "Rata nie może być ujemna."
      );
      return;
    }

    if (
      !Number.isFinite(
        currentPrincipal
      ) ||
      currentPrincipal < 0
    ) {
      setError(
        "Część kapitałowa nie może być ujemna."
      );
      return;
    }

    if (
      currentPrincipal >
      currentPayment
    ) {
      setError(
        "Część kapitałowa nie może być większa od całej raty."
      );
      return;
    }

    if (
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      setError(
        "Oprocentowanie nie może być ujemne."
      );
      return;
    }

    /*
     * Odsetek użytkownik
     * NIE wpisuje.
     *
     * Wyliczamy je:
     *
     * rata - kapitał
     */

    const calculatedInterest =
      currentPayment -
      currentPrincipal;

    onAdd({
      id: Date.now(),

      name: name.trim(),

      type: liabilityType,

      originalAmount:
        original,

      remainingAmount:
        remaining,

      monthlyPayment:
        currentPayment,

      principalPayment:
        currentPrincipal,

      interestPayment:
        calculatedInterest,

      interestRate:
        rate,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">
              Dodaj zobowiązanie
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Dodaj dokładne dane
              dotyczące długu
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>
            </div>
          )}

          <Field
            label="Nazwa"
            value={name}
            onChange={setName}
            placeholder="np. Kredyt hipoteczny"
            type="text"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Typ zobowiązania
            </label>

            <select
              value={liabilityType}
              onChange={(event) =>
                setLiabilityType(
                  event.target.value as LiabilityType
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            >
              <option value="MORTGAGE">Kredyt hipoteczny</option>
              <option value="CASH_LOAN">Kredyt gotówkowy</option>
              <option value="CAR_LOAN">Kredyt samochodowy</option>
              <option value="LEASING">Leasing</option>
              <option value="INSTALLMENTS">Raty</option>
              <option value="CREDIT_CARD">Karta kredytowa</option>
              <option value="OTHER">Inne</option>
            </select>
          </div>

          {/* DEBT */}

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Kwota początkowa"
              value={
                originalAmount
              }
              onChange={
                setOriginalAmount
              }
              placeholder="400000"
            />

            <Field
              label="Pozostało do spłaty"
              value={
                remainingAmount
              }
              onChange={
                setRemainingAmount
              }
              placeholder="350000"
            />
          </div>

          {/* PAYMENT SECTION */}

          <div className="border-t border-slate-800 pt-5">
            <h3 className="font-semibold">
              Aktualna rata
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Wpisz pełną ratę oraz
              część kapitałową.
              Odsetki policzymy
              automatycznie.
            </p>
          </div>

          <Field
            label="Pełna rata"
            value={
              monthlyPayment
            }
            onChange={
              setMonthlyPayment
            }
            placeholder="2137.42"
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Część kapitałowa"
              value={
                principalPayment
              }
              onChange={
                setPrincipalPayment
              }
              placeholder="1684.17"
            />

            {/* CALCULATED INTEREST */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Część odsetkowa
              </label>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="font-semibold text-orange-400">
                  {interestPayment.toLocaleString(
                    "pl-PL",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )}{" "}
                  zł
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600">
                Wyliczane
                automatycznie
              </p>
            </div>
          </div>

          {/* LIVE BREAKDOWN */}

          {payment > 0 &&
            principal <=
              payment && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Struktura raty
                  </span>

                  <span className="text-sm font-semibold">
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
                  </span>
                </div>

                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-800">
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

                <div className="mt-3 flex justify-between text-xs">
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

          <Field
            label="Aktualne oprocentowanie (%)"
            value={
              interestRate
            }
            onChange={
              setInterestRate
            }
            placeholder="7.2"
          />

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Dodaj zobowiązanie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;

  type?:
    | "text"
    | "number";
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "number",
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type={type}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
      />
    </div>
  );
}