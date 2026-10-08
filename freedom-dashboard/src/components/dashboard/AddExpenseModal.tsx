import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LoaderCircle, WalletCards } from "lucide-react";
import type { Expense, ExpenseCategory } from "../../types/Cashflow";
import type { Category } from "../../types/Category";
import { categoryApi } from "../../api/categoryApi";
import { goalSpendingApi } from "../../api/goalSpendingApi";
import { CategoryPicker } from "../categories/CategoryPicker";
import { CashSourcePicker } from "../finances/CashSourcePicker";
import type { Asset } from "../../types/Asset";
import { getAssetCategory } from "../../types/Asset";
import type { PortfolioWallet } from "../../types/Portfolio";
import type { SpendableGoal } from "../../types/GoalSpending";
import { CheckboxCard, DateInput, modalInputClass, ModalCloseButton, MoneyInput } from "../finances/ModalFieldKit";
import { GoalLinkPicker } from "../finances/GoalLinkPicker";

type AddExpenseModalProps = {
  assets: Asset[];
  wallets?: PortfolioWallet[];
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
  wallets = [],
  onClose,
  onAdd,
}: AddExpenseModalProps) {
  const cashAssets = useMemo(
    () => assets.filter((asset) => asset.systemCash || getAssetCategory(asset) === "cash"),
    [assets]
  );
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [date, setDate] = useState(getTodayDate());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [assetId, setAssetId] = useState<number | undefined>(
    cashAssets.find((asset) => asset.systemCash)?.id ?? cashAssets[0]?.id
  );
  const [spendableGoals, setSpendableGoals] = useState<SpendableGoal[]>([]);
  const [goalId, setGoalId] = useState<number | undefined>(undefined);
  const [loadingGoals, setLoadingGoals] = useState(false);

  useEffect(() => {
    let cancelled = false;

    categoryApi
      .getAll("EXPENSE")
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

  useEffect(() => {
    if (!assetId) {
      setSpendableGoals([]);
      setGoalId(undefined);
      return;
    }

    let cancelled = false;
    setLoadingGoals(true);

    goalSpendingApi
      .getSpendable(assetId)
      .then((items) => {
        if (cancelled) return;
        setSpendableGoals(items);
        setGoalId((current) =>
          current && items.some((item) => item.goalId === current) ? current : undefined
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

    return () => {
      cancelled = true;
    };
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
      if (goalsCategory) setCategoryId(goalsCategory.id);
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
        `Cel „${selectedGoal.name}” ma na tym aktywie dostępne ${selectedGoal.reservedOnAsset.toLocaleString("pl-PL", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} zł rezerwy.`
      );
    }

    const selectedCategory = categories.find((item) => item.id === categoryId);

    onAdd({
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-slate-800 bg-[#0b1322] shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Dodaj wydatek</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pieniądze wychodzą z realnego aktywa. Opcjonalnie możesz zużyć rezerwę konkretnego celu.
            </p>
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
                placeholder="np. Dentysta"
                autoFocus
                className={`${modalInputClass} focus:border-cyan-400 focus:ring-cyan-500/15`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Kwota</label>
              <MoneyInput value={amount} onChange={setAmount} accent="blue" currency="PLN" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Data</label>
            <DateInput value={date} onChange={setDate} accent="blue" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Źródło środków</label>
            <CashSourcePicker
              assets={cashAssets}
              wallets={wallets}
              value={assetId}
              onChange={setAssetId}
              variant="field"
              tone="blue"
            />
            <p className="mt-2 text-xs text-slate-500">
              Wydatek fizycznie zmniejszy to aktywo. Bez wskazania celu można użyć tylko wolnych środków.
            </p>
          </div>

          <GoalLinkPicker
            goals={spendableGoals}
            selectedGoalId={goalId}
            onSelect={selectGoal}
            loading={loadingGoals}
            amount={Number(amount)}
            mode="create"
          />

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

          <CheckboxCard
            checked={recurring}
            disabled={Boolean(goalId)}
            onChange={setRecurring}
            title="Powtarzaj co miesiąc"
            description={
              goalId
                ? "Wydatki z celu księgujemy pojedynczo, żeby każda płatność zużywała realną rezerwę."
                : "Transakcja będzie oznaczona jako cykliczna."
            }
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
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              <WalletCards size={16} />
              Dodaj wydatek
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
