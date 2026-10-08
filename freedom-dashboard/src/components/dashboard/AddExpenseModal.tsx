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
import { useLanguage } from "../../i18n/LanguageContext";

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
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
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
        if (!cancelled) setError(ui("Nie udało się pobrać kategorii.", "Could not load categories."));
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
    if (!name.trim()) return setError(ui("Podaj nazwę wydatku.", "Enter an expense name."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setError(ui("Kwota musi być większa od 0.", "Amount must be greater than 0."));
    }
    if (!date) return setError(ui("Wybierz datę wydatku.", "Choose an expense date."));
    if (!categoryId) return setError(ui("Wybierz kategorię.", "Choose a category."));
    if (!assetId) return setError(ui("Wybierz źródło środków.", "Choose a source of funds."));

    if (selectedGoal && numericAmount > selectedGoal.reservedOnAsset + 0.0001) {
      const available = `${selectedGoal.reservedOnAsset.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${language === "pl" ? "zł" : "PLN"}`;
      return setError(
        language === "pl"
          ? `Cel „${selectedGoal.name}” ma na tym aktywie dostępne ${available} rezerwy.`
          : `Goal “${selectedGoal.name}” has ${available} of reserve available on this asset.`
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-slate-800 bg-[#0b1322] shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1322]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{ui("Dodaj wydatek", "Add expense")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {ui("Pieniądze wychodzą z realnego aktywa. Opcjonalnie możesz zużyć rezerwę konkretnego celu.", "Money leaves a real asset. Optionally, you can use the reserve of a specific goal.")}
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
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Nazwa", "Name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={ui("np. Dentysta", "e.g. Dentist")}
                autoFocus
                className={`${modalInputClass} focus:border-cyan-400 focus:ring-cyan-500/15`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Kwota", "Amount")}</label>
              <MoneyInput value={amount} onChange={setAmount} accent="blue" currency="PLN" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Data", "Date")}</label>
            <DateInput value={date} onChange={setDate} accent="blue" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{ui("Źródło środków", "Source of funds")}</label>
            <CashSourcePicker
              assets={cashAssets}
              wallets={wallets}
              value={assetId}
              onChange={setAssetId}
              variant="field"
              tone="blue"
            />
            <p className="mt-2 text-xs text-slate-500">
              {ui("Wydatek fizycznie zmniejszy to aktywo. Bez wskazania celu można użyć tylko wolnych środków.", "The expense will reduce this asset. Without a linked goal, only free funds can be used.")}
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
              <label className="text-sm font-medium text-slate-300">{ui("Kategoria", "Category")}</label>
              {categoryId && <span className="text-xs font-semibold text-cyan-400">{ui("Wybrano ✓", "Selected ✓")}</span>}
            </div>

            {loadingCategories ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40 py-12 text-slate-500">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> {ui("Ładowanie kategorii…", "Loading categories…")}
              </div>
            ) : (
              <CategoryPicker categories={categories} type="EXPENSE" value={categoryId} onChange={setCategoryId} />
            )}
          </div>

          <CheckboxCard
            checked={recurring}
            disabled={Boolean(goalId)}
            onChange={setRecurring}
            title={ui("Powtarzaj co miesiąc", "Repeat monthly")}
            description={
              goalId
                ? ui("Wydatki z celu księgujemy pojedynczo, żeby każda płatność zużywała realną rezerwę.", "Goal expenses are booked individually so each payment uses the real reserve.")
                : ui("Transakcja będzie oznaczona jako cykliczna.", "The transaction will be marked as recurring.")
            }
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
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              <WalletCards size={16} />
              {ui("Dodaj wydatek", "Add expense")}
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
