import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
  Target,
  WalletCards,
  X,
} from "lucide-react";
import type { Expense, ExpenseCategory } from "../../types/Cashflow";
import type { Category } from "../../types/Category";
import { categoryApi } from "../../api/categoryApi";
import { goalSpendingApi } from "../../api/goalSpendingApi";
import { CategoryPicker } from "../categories/CategoryPicker";
import type { Asset } from "../../types/Asset";
import type { SpendableGoal } from "../../types/GoalSpending";

type AddExpenseModalProps = {
  assets: Asset[];
  onClose: () => void;
  onAdd: (expense: Expense) => void;
};

function groupToLegacyCategory(group?: string): ExpenseCategory {
  if (group === "FIXED") return "fixed";
  if (group === "WEALTH") return "investment";
  if (group === "GOALS") return "goal";
  return "living";
}

export function AddExpenseModal({
  assets,
  onClose,
  onAdd,
}: AddExpenseModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [date, setDate] = useState(getTodayDate());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [assetId, setAssetId] = useState<number | undefined>(
    assets.find((asset) => asset.systemCash)?.id ?? assets[0]?.id
  );

  const [spendableGoals, setSpendableGoals] = useState<SpendableGoal[]>([]);
  const [goalId, setGoalId] = useState<number | undefined>(undefined);
  const [loadingGoals, setLoadingGoals] = useState(false);

  useEffect(() => {
    let cancelled = false;

    categoryApi.getAll("EXPENSE")
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

  useEffect(() => {
    if (!assetId) {
      setSpendableGoals([]);
      setGoalId(undefined);
      return;
    }

    let cancelled = false;
    setLoadingGoals(true);

    goalSpendingApi.getSpendable(assetId)
      .then((items) => {
        if (cancelled) return;
        setSpendableGoals(items);
        setGoalId((current) =>
          current && items.some((item) => item.goalId === current)
            ? current
            : undefined
        );
      })
      .catch((reason) => {
        console.error("Nie udało się pobrać rezerw celów:", reason);
        if (!cancelled) {
          setSpendableGoals([]);
          setGoalId(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGoals(false);
      });

    return () => { cancelled = true; };
  }, [assetId]);

  const selectedGoal = useMemo(
    () => spendableGoals.find((goal) => goal.goalId === goalId),
    [goalId, spendableGoals]
  );

  function selectGoal(nextGoalId?: number) {
    setGoalId(nextGoalId);

    if (nextGoalId) {
      setRecurring(false);
      const goalsCategory = categories.find(
        (category) => category.active && category.group === "GOALS"
      );
      if (goalsCategory) {
        setCategoryId(goalsCategory.id);
      }
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    if (!name.trim()) return setError("Podaj nazwę wydatku.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setError("Kwota musi być większa od 0.");
    }
    if (!date) return setError("Wybierz datę wydatku.");
    if (!categoryId) return setError("Wybierz kategorię.");
    if (!assetId) return setError("Wybierz źródło środków.");

    if (selectedGoal && numericAmount > selectedGoal.reservedOnAsset + 0.0001) {
      return setError(
        `Cel „${selectedGoal.name}” ma w tym aktywie zarezerwowane tylko ${selectedGoal.reservedOnAsset.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł.`
      );
    }

    const selectedCategory = categories.find((item) => item.id === categoryId);

    onAdd({
      id: Date.now(),
      name: name.trim(),
      amount: numericAmount,
      category: groupToLegacyCategory(selectedCategory?.group),
      categoryId,
      categoryName: selectedCategory?.name,
      categoryIconKey: selectedCategory?.iconKey,
      categoryColor: selectedCategory?.color,
      categoryGroup: selectedCategory?.group,
      recurring: goalId ? false : recurring,
      date,
      assetId,
      goalId,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Dodaj wydatek</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pieniądze wychodzą z realnego aktywa. Opcjonalnie możesz zużyć rezerwę konkretnego celu.
            </p>
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Dentysta" autoFocus className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Kwota</label>
              <div className="relative">
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 outline-none focus:border-blue-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">zł</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Źródło środków</label>
            <select
              value={assetId ?? ""}
              onChange={(event) => setAssetId(Number(event.target.value))}
              className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.systemCash ? "Gotówka (system)" : asset.name} — {asset.value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Wydatek fizycznie zmniejszy to aktywo. Bez wskazania celu można użyć tylko wolnych środków.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <Target size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-100">Wydatek z celu</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Cel nie jest osobnym portfelem. Zużywamy rezerwację z wybranego aktywa i jednocześnie rejestrujemy normalny wydatek.
                    </p>
                  </div>
                  {loadingGoals && <LoaderCircle size={18} className="animate-spin text-violet-300" />}
                </div>

                <select
                  value={goalId ?? ""}
                  onChange={(event) => selectGoal(event.target.value ? Number(event.target.value) : undefined)}
                  className="mt-4 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-500"
                >
                  <option value="">Bez powiązanego celu</option>
                  {spendableGoals.map((goal) => (
                    <option key={goal.goalId} value={goal.goalId}>
                      {goal.name} — dostępne {goal.reservedOnAsset.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł
                    </option>
                  ))}
                </select>

                {!loadingGoals && spendableGoals.length === 0 && (
                  <p className="mt-3 text-xs text-slate-600">
                    W tym aktywie nie ma teraz środków zarezerwowanych na aktywny cel.
                  </p>
                )}

                {selectedGoal && (
                  <div className="mt-3 grid gap-2 rounded-xl border border-violet-500/15 bg-slate-950/45 p-3 text-xs sm:grid-cols-3">
                    <MiniStat label="Do wydania z tego aktywa" value={`${selectedGoal.reservedOnAsset.toLocaleString("pl-PL")} zł`} />
                    <MiniStat label="Łącznie odłożone" value={`${selectedGoal.totalReserved.toLocaleString("pl-PL")} zł`} />
                    <MiniStat label="Już wydano" value={`${selectedGoal.spentAmount.toLocaleString("pl-PL")} zł`} />
                  </div>
                )}
              </div>
            </div>
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
              <CategoryPicker categories={categories} type="EXPENSE" value={categoryId} onChange={setCategoryId} />
            )}
          </div>

          <label className={`flex items-center gap-3 rounded-xl border p-4 transition ${
            goalId
              ? "cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50"
              : "cursor-pointer border-slate-800 bg-slate-900/50 hover:border-slate-700"
          }`}>
            <input
              type="checkbox"
              checked={recurring}
              disabled={Boolean(goalId)}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
            />
            <div>
              <p className="text-sm font-medium">Powtarzaj co miesiąc</p>
              <p className="mt-1 text-xs text-slate-500">
                {goalId
                  ? "Wydatki z celu księgujemy pojedynczo, żeby każda płatność zużywała realną rezerwę."
                  : "Transakcja będzie oznaczona jako cykliczna."}
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">Anuluj</button>
            <button type="submit" className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500">
              <WalletCards size={16} />
              Dodaj wydatek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p className="mt-1 font-black text-slate-200">{value}</p>
    </div>
  );
}

function getTodayDate() {
  return new Date().toLocaleDateString("sv-SE");
}
