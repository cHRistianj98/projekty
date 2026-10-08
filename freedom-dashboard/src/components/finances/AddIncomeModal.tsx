import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import type { Income } from "../../types/Cashflow";
import type { Category } from "../../types/Category";
import type { Asset } from "../../types/Asset";
import { getAssetCategory } from "../../types/Asset";
import type { PortfolioWallet } from "../../types/Portfolio";
import { categoryApi } from "../../api/categoryApi";
import { CategoryPicker } from "../categories/CategoryPicker";
import { CashSourcePicker } from "./CashSourcePicker";
import { CheckboxCard, DateInput, modalInputClass, ModalCloseButton, MoneyInput } from "./ModalFieldKit";

type AddIncomeModalProps = {
  assets: Asset[];
  wallets?: PortfolioWallet[];
  onClose: () => void;
  onAdd: (income: Income) => void;
};

export function AddIncomeModal({
  assets,
  wallets = [],
  onClose,
  onAdd,
}: AddIncomeModalProps) {
  const cashAssets = useMemo(
    () => assets.filter((asset) => asset.systemCash || getAssetCategory(asset) === "cash"),
    [assets]
  );
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [date, setDate] = useState(getTodayDate());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [assetId, setAssetId] = useState<number | undefined>(
    cashAssets.find((asset) => asset.systemCash)?.id ?? cashAssets[0]?.id
  );

  useEffect(() => {
    let cancelled = false;

    categoryApi
      .getAll("INCOME")
      .then((loaded) => {
        if (cancelled) return;
        setCategories(loaded);
        setCategoryId((current) => current ?? loaded.find((item) => item.active)?.id);
      })
      .catch((reason) => {
        console.error("Nie udało się pobrać kategorii:", reason);
        if (!cancelled) setError("Nie udało się pobrać kategorii.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    if (!name.trim()) return setError("Podaj nazwę przychodu.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setError("Kwota musi być większa od 0.");
    }
    if (!date) return setError("Wybierz datę przychodu.");
    if (!categoryId) return setError("Wybierz kategorię.");
    if (!assetId) return setError("Wybierz miejsce, do którego trafiają pieniądze.");

    const selectedCategory = categories.find((item) => item.id === categoryId);

    onAdd({
      id: Date.now(),
      name: name.trim(),
      amount: numericAmount,
      categoryId,
      categoryName: selectedCategory?.name,
      categoryIconKey: selectedCategory?.iconKey,
      categoryColor: selectedCategory?.color,
      categoryGroup: selectedCategory?.group,
      recurring,
      date,
      assetId,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-slate-800 bg-[#0b1322] shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Dodaj przychód</h2>
            <p className="mt-1 text-sm text-slate-500">Wybierz kategorię po ikonie i zapisz transakcję.</p>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Nazwa</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Wynagrodzenie"
                autoFocus
                className={`${modalInputClass} focus:border-emerald-400 focus:ring-emerald-500/15`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Kwota</label>
              <MoneyInput value={amount} onChange={setAmount} accent="emerald" currency="PLN" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Data</label>
            <DateInput value={date} onChange={setDate} accent="emerald" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Gdzie trafiają pieniądze</label>
            <CashSourcePicker
              assets={cashAssets}
              wallets={wallets}
              value={assetId}
              onChange={setAssetId}
              variant="field"
              tone="emerald"
            />
            <p className="mt-2 text-xs text-slate-500">
              Przychód zwiększy wyłącznie wybrane aktywo typu gotówka / konto.
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Kategoria</label>
              {categoryId && <span className="text-xs font-semibold text-cyan-400">Wybrano ✓</span>}
            </div>

            {loadingCategories ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40 py-12 text-slate-500">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Ładowanie kategorii…
              </div>
            ) : (
              <CategoryPicker categories={categories} type="INCOME" value={categoryId} onChange={setCategoryId} />
            )}
          </div>

          <CheckboxCard
            checked={recurring}
            onChange={setRecurring}
            title="Powtarzaj co miesiąc"
            description="Transakcja będzie oznaczona jako cykliczna."
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              Dodaj przychód
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
