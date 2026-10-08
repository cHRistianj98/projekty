import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import type { Expense, ExpenseCategory } from "../../types/Cashflow";
import type { Category } from "../../types/Category";
import type { Asset } from "../../types/Asset";
import { getAssetCategory } from "../../types/Asset";
import type { PortfolioWallet } from "../../types/Portfolio";
import type { SpendableGoal } from "../../types/GoalSpending";
import { categoryApi } from "../../api/categoryApi";
import { goalSpendingApi } from "../../api/goalSpendingApi";
import { CategoryPicker } from "../categories/CategoryPicker";
import { CashSourcePicker } from "./CashSourcePicker";
import { CheckboxCard, DateInput, modalInputClass, ModalCloseButton, MoneyInput } from "./ModalFieldKit";
import { GoalLinkPicker } from "./GoalLinkPicker";
import { useLanguage } from "../../i18n/LanguageContext";

type EditExpenseModalProps = {
  expense: Expense;
  assets: Asset[];
  wallets?: PortfolioWallet[];
  onClose: () => void;
  onSave: (expense: Expense) => void;
};

function groupToLegacyCategory(group?: string): ExpenseCategory {
  if (group === "FIXED") return "fixed";
  if (group === "WEALTH") return "investment";
  if (group === "GOALS") return "goal";
  return "living";
}

export function EditExpenseModal({
  expense,
  assets,
  wallets = [],
  onClose,
  onSave,
}: EditExpenseModalProps) {
  const { language } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const cashAssets = useMemo(
    () => assets.filter((asset) => asset.systemCash || getAssetCategory(asset) === "cash"),
    [assets]
  );
  const [name, setName] = useState(expense.name);
  const [amount, setAmount] = useState(String(expense.amount));
  const [recurring, setRecurring] = useState(expense.recurring);
  const [date, setDate] = useState(expense.date || getTodayDate());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(expense.categoryId);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [assetId, setAssetId] = useState<number | undefined>(
    expense.assetId ?? cashAssets.find((asset) => asset.systemCash)?.id ?? cashAssets[0]?.id
  );
  const [spendableGoals, setSpendableGoals] = useState<SpendableGoal[]>([]);
  const [goalId, setGoalId] = useState<number | undefined>(expense.goalId);
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
      .getSpendable(assetId, expense.id)
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
  }, [assetId, expense.id]);

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

    const selectedCategory = categories.find((item) => item.id === categoryId);

    onSave({
      ...expense,
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
            <h2 className="text-2xl font-black tracking-tight">{ui("Edytuj wydatek", "Edit expense")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {ui("Możesz także przypisać istniejący lub importowany wydatek do konkretnego celu.", "You can also link an existing or imported expense to a specific goal.")}
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
                placeholder={ui("np. Zakupy spożywcze", "e.g. Groceries")}
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
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {ui("Przy zmianie źródła Freedom cofnie stare księgowanie i zaksięguje wydatek na wybranym aktywie.", "When the source changes, Freedom will reverse the old posting and book the expense on the selected asset.")}
            </p>
          </div>

          <GoalLinkPicker
            goals={spendableGoals}
            selectedGoalId={goalId}
            onSelect={selectGoal}
            loading={loadingGoals}
            amount={Number(amount)}
            mode="edit"
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
                ? ui("Wydatek powiązany z celem nie może być cykliczny.", "An expense linked to a goal cannot be recurring.")
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
              className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
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
