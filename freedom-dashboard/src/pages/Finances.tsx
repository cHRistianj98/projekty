import {
  useState,
} from "react";

import {
  Banknote,
  Car,
  ChartNoAxesCombined,
  House,
  Plus,
  ShoppingBasket,
} from "lucide-react";

import { AddIncomeModal } from "../components/finances/AddIncomeModal";
import { IncomeRow } from "../components/finances/IncomeRow";

import { AddExpenseModal } from "../components/dashboard/AddExpenseModal";
import { ExpenseRow } from "../components/finances/ExpenseRow";
import { EditExpenseModal } from "../components/finances/EditExpenseModal";

import type {
  Expense,
  ExpenseCategory,
  Income,
  MonthlyBudget,
} from "../types/Cashflow";

import {
  calculateAvailableCash,
  sumExpenses,
  sumIncomes,
} from "../utils/cashflow";

type FinancesProps = {
  budget: MonthlyBudget;

  onAddIncome: (income: Income) => void;
  onDeleteIncome: (id: number) => void;

  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
  onUpdateExpense: (expense: Expense) => void;
};

const categories = [
  {
    category: "fixed" as ExpenseCategory,
    title: "Koszty stałe",
    icon: House,
    color: "text-red-400",
  },
  {
    category: "living" as ExpenseCategory,
    title: "Życie",
    icon: ShoppingBasket,
    color: "text-amber-400",
  },
  {
    category: "investment" as ExpenseCategory,
    title: "Inwestycje",
    icon: ChartNoAxesCombined,
    color: "text-blue-400",
  },
  {
    category: "goal" as ExpenseCategory,
    title: "Cele",
    icon: Car,
    color: "text-violet-400",
  },
];

export function Finances({
  budget,
  onAddIncome,
  onDeleteIncome,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
}: FinancesProps) {

  const [isAddOpen, setIsAddOpen] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [isAddIncomeOpen, setIsAddIncomeOpen] =
  useState(false);

  const income = sumIncomes(budget.incomes);

  const totalExpenses =
  sumExpenses(budget.expenses);

  const available =
  calculateAvailableCash(
    income,
    budget.expenses
  );

  return (
    <main className="min-h-screen p-8">

      {/* HEADER */}

      <div className="
        flex
        items-start
        justify-between
      ">

        <div>

          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.2em]
              text-blue-400
            "
          >
            Freedom
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Finanse
          </h1>

          <p className="mt-2 text-slate-500">
            Zarządzaj miesięcznym cashflow.
          </p>

        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="
            flex items-center gap-2
            rounded-xl
            bg-blue-600
            px-5 py-3
            text-sm font-semibold
            transition
            hover:bg-blue-500
          "
        >
          <Plus size={18} />

          Dodaj wydatek
        </button>

      </div>

      {/* SUMMARY */}

      <section
        className="
          mt-8
          grid
          grid-cols-1
          gap-4
          md:grid-cols-3
        "
      >

        <SummaryCard
          label="Dochód"
          value={income}
          color="text-emerald-400"
        />

        <SummaryCard
          label="Wydatki i alokacje"
          value={totalExpenses}
          color="text-red-400"
        />

        <SummaryCard
          label="Wolne środki"
          value={available}
          color={
            available >= 0
              ? "text-blue-400"
              : "text-red-400"
          }
        />

      </section>
{/*  */}
            <section
        className="
            mt-8
            overflow-hidden
            rounded-2xl
            border border-emerald-500/20
            bg-slate-900/70
        "
        >
        <div
            className="
            flex items-center justify-between
            border-b border-slate-800
            px-5 py-4
            "
        >
            <div className="flex items-center gap-3">
            <Banknote
                size={20}
                className="text-emerald-400"
            />

            <div>
                <h2 className="font-semibold">
                Przychody
                </h2>

                <span className="text-xs text-slate-500">
                {budget.incomes.length} źródeł
                </span>
            </div>
            </div>

            <div className="flex items-center gap-5">
            <span className="font-bold text-emerald-400">
                +{income.toLocaleString("pl-PL")} zł
            </span>

            <button
                onClick={() =>
                setIsAddIncomeOpen(true)
                }
                className="
                flex items-center gap-2
                rounded-lg
                bg-emerald-500/10
                px-3 py-2
                text-sm font-semibold
                text-emerald-400
                transition
                hover:bg-emerald-500/20
                "
            >
                <Plus size={16} />
                Dodaj
            </button>
            </div>
        </div>

        {budget.incomes.map((incomeItem) => (
            <IncomeRow
            key={incomeItem.id}
            income={incomeItem}
            onDelete={() =>
                onDeleteIncome(incomeItem.id)
            }
            />
        ))}
<  /section>

      {/* EXPENSE CATEGORIES */}

      <div className="mt-8 space-y-6">

        {categories.map((config) => {

          const categoryExpenses =
            budget.expenses.filter(
              (expense) =>
                expense.category ===
                config.category
            );

          const categoryTotal =
            categoryExpenses.reduce(
              (sum, expense) =>
                sum + expense.amount,
              0
            );

          const Icon = config.icon;

          return (
            <section
              key={config.category}
              className="
                overflow-hidden
                rounded-2xl
                border border-slate-800
                bg-slate-900/70
              "
            >

              {/* CATEGORY HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-800
                  px-5 py-4
                "
              >

                <div className="flex items-center gap-3">

                  <Icon
                    size={20}
                    className={config.color}
                  />

                  <div>

                    <h2 className="font-semibold">
                      {config.title}
                    </h2>

                    <span
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      {categoryExpenses.length} pozycji
                    </span>

                  </div>

                </div>

                <span className="font-bold">
                  {categoryTotal.toLocaleString(
                    "pl-PL"
                  )}{" "}
                  zł
                </span>

              </div>

              {/* ROWS */}

              <div>

                {categoryExpenses.length === 0 ? (

                  <div
                    className="
                      px-5 py-8
                      text-center
                      text-sm
                      text-slate-600
                    "
                  >
                    Brak pozycji w tej kategorii.
                  </div>

                ) : (

                  categoryExpenses.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onEdit={() =>
                        setEditingExpense(expense)
                      }
                      onDelete={() =>
                        onDeleteExpense(expense.id)
                      }
                    />
                  ))

                )}

              </div>

            </section>
          );
        })}

      </div>

      {/* ADD MODAL */}

      {isAddOpen && (
        <AddExpenseModal
          onClose={() => setIsAddOpen(false)}
          onAdd={onAddExpense}
        />
      )}

      {/* EDIT MODAL */}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() =>
            setEditingExpense(null)
          }
          onSave={(expense) => {
            onUpdateExpense(expense);
            setEditingExpense(null);
          }}
        />
      )}
        {/* ADD INCOME MODAL */}
      {isAddIncomeOpen && (
  <AddIncomeModal
    onClose={() =>
      setIsAddIncomeOpen(false)
    }
    onAdd={onAddIncome}
  />
)}

    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  color: string;
};

function SummaryCard({
  label,
  value,
  color,
}: SummaryCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border border-slate-800
        bg-slate-900/70
        p-5
      "
    >

      <div
        className="
          text-xs
          font-bold
          uppercase
          tracking-wider
          text-slate-500
        "
      >
        {label}
      </div>

      <div
        className={`
          mt-3
          text-3xl
          font-bold
          ${color}
        `}
      >
        {value.toLocaleString("pl-PL")} zł
      </div>

    </div>
  );
}