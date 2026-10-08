import { CheckCircle2, LoaderCircle, Target } from "lucide-react";
import type { SpendableGoal } from "../../types/GoalSpending";
import { useLanguage } from "../../i18n/LanguageContext";

export function GoalLinkPicker({
  goals,
  selectedGoalId,
  onSelect,
  loading = false,
  amount,
  mode,
}: {
  goals: SpendableGoal[];
  selectedGoalId?: number;
  onSelect: (goalId?: number) => void;
  loading?: boolean;
  amount?: number;
  mode: "create" | "edit";
}) {
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const selectedGoal = goals.find((goal) => goal.goalId === selectedGoalId);
  const uncoveredAmount =
    selectedGoal && typeof amount === "number" && Number.isFinite(amount)
      ? Math.max(0, amount - selectedGoal.reservedOnAsset)
      : 0;

  const money = (value: number) =>
    `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${language === "pl" ? "zł" : "PLN"}`;

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
          <Target size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-100">
                {mode === "create" ? ui("Wydatek z celu", "Goal expense") : ui("Powiązanie z celem", "Goal link")}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {mode === "create"
                  ? ui(
                      "Wybierz cel, z którego ma zejść rezerwa na wybranym aktywie. Karty są klikalne i pokazują dostępne środki.",
                      "Choose the goal whose reserve should fund this expense. The cards are clickable and show available funds."
                    )
                  : ui(
                      "Możesz przypisać także stary lub importowany wydatek. Freedom zużyje dostępną rezerwę celu, a brakującą część zapisze jako historycznie poniesiony koszt celu.",
                      "You can also link an older or imported expense. Freedom will use the available goal reserve and record any uncovered amount as historical goal spending."
                    )}
              </p>
            </div>
            {loading && <LoaderCircle size={18} className="animate-spin text-violet-300" />}
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => onSelect(undefined)}
              className={`w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${
                selectedGoalId == null
                  ? "border-violet-400 bg-violet-500/10 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]"
                  : "border-slate-800 bg-slate-950/40 hover:border-violet-500/30 hover:bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-100">{ui("Bez powiązanego celu", "No linked goal")}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ui(
                      "Wydatek zostanie zapisany jako zwykły koszt bez zużycia rezerwy celu.",
                      "The expense will be saved as a regular cost without using a goal reserve."
                    )}
                  </p>
                </div>
                {selectedGoalId == null && <CheckCircle2 className="h-5 w-5 text-violet-300" />}
              </div>
            </button>

            {goals.map((goal) => {
              const selected = goal.goalId === selectedGoalId;
              const goalColor = goal.color || "#8b5cf6";
              return (
                <button
                  key={goal.goalId}
                  type="button"
                  onClick={() => onSelect(goal.goalId)}
                  className={`w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "bg-slate-900/95 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                      : "border-slate-800 bg-slate-950/40 hover:-translate-y-px hover:bg-slate-900/70"
                  }`}
                  style={{
                    borderColor: selected ? goalColor : undefined,
                    boxShadow: selected ? `0 0 0 1px ${goalColor}22` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {goal.imageUrl ? (
                      <img src={goal.imageUrl} alt={goal.name} className="h-12 w-12 rounded-xl border border-slate-700 object-cover" />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 text-white"
                        style={{ background: `${goalColor}20` }}
                      >
                        <Target className="h-5 w-5" style={{ color: goalColor }} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-slate-100">{goal.name}</p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                          style={{ background: `${goalColor}20`, color: goalColor }}
                        >
                          {goal.status === "FUNDED" ? ui("Sfinansowany", "Funded") : ui("Aktywny", "Active")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {ui("Na tym aktywie", "On this asset")}: <strong className="text-slate-300">{money(goal.reservedOnAsset)}</strong>
                        <span className="mx-1.5 text-slate-700">•</span>
                        {ui("Łącznie odłożone", "Total reserved")}: <strong className="text-slate-300">{money(goal.totalReserved)}</strong>
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {ui("Wydano", "Spent")}: {money(goal.spentAmount)} · {ui("Pokrycie", "Covered")}: {money(goal.coveredAmount)} / {money(goal.targetAmount)}
                      </p>
                    </div>

                    {selected && <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: goalColor }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {!loading && goals.length === 0 && (
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs leading-5 text-slate-500">
              {mode === "create"
                ? ui("W tym aktywie nie ma teraz środków zarezerwowanych na aktywny cel.", "There are currently no funds reserved for an active goal on this asset.")
                : ui("Freedom nie znalazł jeszcze aktywnych / sfinansowanych celów do przypisania.", "Freedom has not found any active or funded goals to link yet.")}
            </p>
          )}

          {selectedGoal && (
            <div className="mt-3 space-y-3 rounded-2xl border border-violet-500/15 bg-slate-950/45 p-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-3">
                <MiniStat label={ui("Na tym aktywie", "On this asset")} value={money(selectedGoal.reservedOnAsset)} />
                <MiniStat label={ui("Łącznie odłożone", "Total reserved")} value={money(selectedGoal.totalReserved)} />
                <MiniStat label={ui("Już wydano", "Already spent")} value={money(selectedGoal.spentAmount)} />
              </div>

              {typeof amount === "number" && amount > 0 && (
                uncoveredAmount > 0.0001 ? (
                  <div className={`rounded-xl px-3 py-2 text-[11px] leading-5 ${mode === "edit" ? "border border-amber-500/20 bg-amber-500/10 text-amber-200" : "border border-rose-500/20 bg-rose-500/10 text-rose-200"}`}>
                    <strong className="font-semibold">{money(uncoveredAmount)}</strong>{" "}
                    {mode === "edit"
                      ? ui("nie jest obecnie pokryte rezerwą. Freedom zapisze tę część jako historycznie poniesiony koszt celu.", "is not currently covered by a reserve. Freedom will record this part as historical goal spending.")
                      : ui("przekracza dostępną rezerwę na tym aktywie. Zmniejsz kwotę albo wybierz inny cel / źródło.", "exceeds the available reserve on this asset. Reduce the amount or choose another goal / source.")}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 px-3 py-2 text-[11px] leading-5 text-emerald-200">
                    {ui("Ta kwota może zostać w pełni pokryta rezerwą celu na wybranym aktywie.", "This amount can be fully covered by the goal reserve on the selected asset.")}
                  </div>
                )
              )}
            </div>
          )}
        </div>
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
