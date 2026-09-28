import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import type { Income, ExpenseCategory } from "../../types/Cashflow";
import type { Category } from "../../types/Category";
import { categoryApi } from "../../api/categoryApi";
import { CategoryPicker } from "../categories/CategoryPicker";

type AddIncomeModalProps = {
  
  onClose: () => void;
  onAdd: (income: Income) => void;
};

function groupToLegacyCategory(group?: string): ExpenseCategory {
  if (group === "FIXED") return "fixed";
  if (group === "WEALTH") return "investment";
  if (group === "GOALS") return "goal";
  return "living";
}

export function AddIncomeModal({
  
  onClose,
  onAdd,
}: AddIncomeModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [date, setDate] = useState(getTodayDate());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    categoryApi.getAll("INCOME")
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

    return () => { cancelled = true; };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    if (!name.trim()) return setError("Podaj nazwę przychodu.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Kwota musi być większa od 0.");
    if (!date) return setError("Wybierz datę przychodu.");
    if (!categoryId) return setError("Wybierz kategorię.");

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
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Dodaj przychód</h2>
            <p className="mt-1 text-sm text-slate-500">Wybierz kategorię po ikonie i zapisz transakcję.</p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Nazwa</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Wynagrodzenie" autoFocus className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-emerald-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Kwota</label>
              <div className="relative">
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 outline-none focus:border-emerald-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">zł</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500" />
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

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 cursor-pointer" />
            <div>
              <p className="text-sm font-medium">Powtarzaj co miesiąc</p>
              <p className="mt-1 text-xs text-slate-500">Transakcja będzie oznaczona jako cykliczna.</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">Anuluj</button>
            <button type="submit" className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500">Dodaj przychód</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTodayDate() {
  return new Date().toLocaleDateString("sv-SE");
}
