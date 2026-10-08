import { useState } from "react";
import { AlertCircle, ChevronDown, CalendarClock, WalletCards, CreditCard } from "lucide-react";
import type { ExpenseCategory } from "../../types/Cashflow";
import type { RecurringTransaction, RecurringTransactionType } from "../../types/RecurringTransaction";
import { useLanguage } from "../../i18n/LanguageContext";
import { DateInput, modalInputClass, ModalCloseButton, MoneyInput } from "./ModalFieldKit";

type AddRecurringTransactionModalProps = {
  onClose: () => void;
  onAdd: (rule: RecurringTransaction) => void;
};

export function AddRecurringTransactionModal({ onClose, onAdd }: AddRecurringTransactionModalProps) {
  const { language } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const [type, setType] = useState<RecurringTransactionType>("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("fixed");
  const [dayOfMonth, setDayOfMonth] = useState(String(new Date().getDate()));
  const [startDate, setStartDate] = useState(getTodayDate());
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    const numericDay = Number(dayOfMonth);

    if (!name.trim()) return setError(ui("Podaj nazwę reguły.", "Enter a rule name."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setError(ui("Kwota musi być większa od 0.", "Amount must be greater than 0."));
    }
    if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 31) {
      return setError(ui("Dzień miesiąca musi być od 1 do 31.", "Day of month must be between 1 and 31."));
    }
    if (!startDate) return setError(ui("Podaj datę rozpoczęcia.", "Choose a start date."));

    onAdd({
      id: Date.now(),
      type,
      name: name.trim(),
      amount: numericAmount,
      category: type === "expense" ? category : undefined,
      dayOfMonth: numericDay,
      startDate,
      active: true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-slate-800 bg-[#0b1322] shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322]/95 px-6 py-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{ui("Nowa reguła cykliczna", "New recurring rule")}</h2>
              <p className="mt-1 text-sm text-slate-500">{ui("Zdefiniuj miesięczną transakcję.", "Define a monthly transaction.")}</p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Typ", "Type")}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  type === "expense"
                    ? "border-rose-400/60 bg-rose-500/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,.12)]"
                    : "border-slate-700 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:bg-slate-900"
                }`}
              >
                <CreditCard size={17} />
                {ui("Wydatek", "Expense")}
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  type === "income"
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,.12)]"
                    : "border-slate-700 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:bg-slate-900"
                }`}
              >
                <WalletCards size={17} />
                {ui("Przychód", "Income")}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Nazwa", "Name")}</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={ui("np. Czynsz", "e.g. Rent")}
              autoFocus
              className={`${modalInputClass} focus:border-violet-400 focus:ring-violet-500/15`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Kwota", "Amount")}</label>
            <MoneyInput value={amount} onChange={setAmount} accent="violet" currency="PLN" />
          </div>

          {type === "expense" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Kategoria", "Category")}</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
                  className={`${modalInputClass} cursor-pointer appearance-none pr-11 focus:border-violet-400 focus:ring-violet-500/15`}
                >
                  <option value="fixed">{ui("Koszt stały", "Fixed cost")}</option>
                  <option value="living">{ui("Życie", "Living")}</option>
                  <option value="investment">{ui("Inwestycje", "Investments")}</option>
                  <option value="goal">{ui("Cele", "Goals")}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_1.35fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Dzień miesiąca", "Day of month")}</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  inputMode="numeric"
                  value={dayOfMonth}
                  onChange={(event) => setDayOfMonth(event.target.value)}
                  className={`${modalInputClass} freedom-number-input pr-16 text-lg font-semibold focus:border-violet-400 focus:ring-violet-500/15`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-violet-300">1–31</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {ui("W krótszym miesiącu użyjemy ostatniego dnia.", "For shorter months, the last day will be used.")}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Obowiązuje od", "Starts on")}</label>
              <DateInput value={startDate} onChange={setStartDate} accent="violet" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              {ui("Anuluj", "Cancel")}
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              {ui("Dodaj regułę", "Add rule")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTodayDate() {
  return new Date().toLocaleDateString("sv-SE");
}
