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
import { useLanguage } from "../../i18n/LanguageContext";

type EditIncomeModalProps = {
  income: Income;
  assets: Asset[];
  wallets?: PortfolioWallet[];
  onClose: () => void;
  onSave: (income: Income) => void;
};

export function EditIncomeModal({
  income,
  assets,
  wallets = [],
  onClose,
  onSave,
}: EditIncomeModalProps) {
  const { language } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const cashAssets = useMemo(
    () => assets.filter((asset) => asset.systemCash || getAssetCategory(asset) === "cash"),
    [assets]
  );
  const [name, setName] = useState(income.name);
  const [amount, setAmount] = useState(String(income.amount));
  const [recurring, setRecurring] = useState(income.recurring);
  const [date, setDate] = useState(income.date || getTodayDate());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(income.categoryId);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [assetId, setAssetId] = useState<number | undefined>(
    income.assetId ?? cashAssets.find((asset) => asset.systemCash)?.id ?? cashAssets[0]?.id
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
        if (!cancelled) setError(ui("Nie udało się pobrać kategorii.", "Could not load categories."));
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
    if (!name.trim()) return setError(ui("Podaj nazwę przychodu.", "Enter an income name."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setError(ui("Kwota musi być większa od 0.", "Amount must be greater than 0."));
    }
    if (!date) return setError(ui("Wybierz datę przychodu.", "Choose an income date."));
    if (!categoryId) return setError(ui("Wybierz kategorię.", "Choose a category."));
    if (!assetId) return setError(ui("Wybierz miejsce, do którego trafiają pieniądze.", "Choose where the money goes."));

    const selectedCategory = categories.find((item) => item.id === categoryId);

    onSave({
      ...income,
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-slate-800 bg-[#0b1322] shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{ui("Edytuj przychód", "Edit income")}</h2>
            <p className="mt-1 text-sm text-slate-500">{ui("Zaktualizuj dane i zapisz zmiany.", "Update the details and save your changes.")}</p>
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
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Nazwa", "Name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={ui("np. Wynagrodzenie", "e.g. Salary")}
                autoFocus
                className={`${modalInputClass} focus:border-emerald-400 focus:ring-emerald-500/15`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Kwota", "Amount")}</label>
              <MoneyInput value={amount} onChange={setAmount} accent="emerald" currency="PLN" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Data", "Date")}</label>
            <DateInput value={date} onChange={setDate} accent="emerald" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Gdzie trafiają pieniądze", "Where the money goes")}</label>
            <CashSourcePicker
              assets={cashAssets}
              wallets={wallets}
              value={assetId}
              onChange={setAssetId}
              variant="field"
              tone="emerald"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {ui("Przy zmianie Freedom cofnie stary przychód i zaksięguje go na nowym aktywie gotówkowym.", "When changed, Freedom will reverse the old income and post it to the new cash asset.")}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">{ui("Kategoria", "Category")}</label>
              {categoryId && <span className="text-xs font-semibold text-cyan-400">{ui("Wybrano ✓", "Selected ✓")}</span>}
            </div>

            {loadingCategories ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40 py-12 text-slate-500">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> {ui("Ładowanie kategorii…", "Loading categories…")}
              </div>
            ) : (
              <CategoryPicker categories={categories} type="INCOME" value={categoryId} onChange={setCategoryId} />
            )}
          </div>

          <CheckboxCard
            checked={recurring}
            onChange={setRecurring}
            title={ui("Powtarzaj co miesiąc", "Repeat monthly")}
            description={ui("Transakcja będzie oznaczona jako cykliczna.", "The transaction will be marked as recurring.")}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              {ui("Anuluj", "Cancel")}
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              {ui("Zapisz zmiany", "Save changes")}
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
