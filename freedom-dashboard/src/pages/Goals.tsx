import { useEffect, useState } from "react";

import {
  CalendarDays,
  Flag,
  Image,
  ImageOff,
  Pencil,
  Plus,
  Target,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import { AddGoalModal } from "../components/goals/AddGoalModal";
import { EditGoalModal } from "../components/goals/EditGoalModal";

import type { Goal } from "../types/Goal";
import type { Asset } from "../types/Asset";
import { goalAllocationApi } from "../api/goalAllocationApi";
import { liabilityAllocationApi } from "../api/liabilityAllocationApi";
import type { AllocateGoalMoneyRequest, GoalAllocationSummary, MoneyFlowOverview } from "../types/GoalAllocation";
import type { LiabilityAllocationOverview } from "../types/LiabilityAllocation";

import {
  calculateGoalProgress,
  calculateGoalProjectedDate,
  calculateGoalRemaining,
  calculateMonthsToGoal,
} from "../utils/goals";

type GoalsProps = {
  goals: Goal[];
  portfolio: Asset[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void | Promise<void>;
  onDeleteGoal: (id: number) => void;
  onAllocateMoney: (
    goalId: number,
    request: AllocateGoalMoneyRequest
  ) => Promise<void>;
  onReleaseMoney: (goalId:number,assetId:number,amount:number)=>Promise<void>;
};

export function Goals({
  goals,
  portfolio,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAllocateMoney,
  onReleaseMoney,
}: GoalsProps) {
  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] = useState(false);

  const [
    editingGoal,
    setEditingGoal,
  ] = useState<Goal | null>(null);

  const [
    visualGoal,
    setVisualGoal,
  ] = useState<Goal | null>(null);

  const [
    fundingGoal,
    setFundingGoal,
  ] = useState<Goal | null>(null);

  const [moneyFlow,setMoneyFlow]=useState<MoneyFlowOverview|null>(null);
  async function refreshMoneyFlow(){
    try{setMoneyFlow(await goalAllocationApi.getOverview());}
    catch(e){console.error("Money Flow:",e);}
  }
  useEffect(()=>{void refreshMoneyFlow();},[goals]);

  async function executeGoal(goal:Goal){
    if(!window.confirm(`Wykonać cel "${goal.name}"? Przypisany kapitał zostanie faktycznie wydany.`))return;
    try{
      setMoneyFlow(await goalAllocationApi.executeGoal(goal.id));
      window.location.reload();
    }catch(e){
      console.error("Execute goal:",e);
      window.alert("Cel musi być w 100% sfinansowany i mieć środki przypisane do aktywów.");
    }
  }

  function handleDelete(
    goal: Goal
  ) {
    if (
      !window.confirm(
        `Usunąć cel "${goal.name}"?`
      )
    ) {
      return;
    }

    onDeleteGoal(goal.id);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Target size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Cele
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Zamieniaj pieniądze w konkretne plany
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsAddModalOpen(true)
          }
          className="cursor-pointer flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Dodaj cel
        </button>
      </div>

      <section className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Flag size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-400">
              Goals 3.4 · Visual Goal Cards
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Zdjęcie buduje emocję celu, a dane finansowe pozostają na osobnej, czytelnej powierzchni. Priorytet, deadline i integracja z Money Routerem działają jak wcześniej.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {goals.map((goal) => {
          const progress =
            calculateGoalProgress(goal);

          const remaining =
            calculateGoalRemaining(goal);

          const months =
            calculateMonthsToGoal(goal);

          const projectedDate =
            calculateGoalProjectedDate(
              goal
            );

          const completed =
            remaining === 0;

          const priority =
            goal.priority ?? "MEDIUM";

          const targetDate =
            goal.targetDate
              ? new Date(
                  `${goal.targetDate}T12:00:00`
                )
              : null;

          const now = new Date();
          const monthsToDeadline =
            targetDate
              ? Math.max(
                  1,
                  (targetDate.getFullYear() -
                    now.getFullYear()) *
                    12 +
                    targetDate.getMonth() -
                    now.getMonth()
                )
              : null;

          const requiredMonthly =
            monthsToDeadline
              ? Math.ceil(
                  remaining /
                    monthsToDeadline
                )
              : null;

          const contributionGap =
            requiredMonthly !== null
              ? requiredMonthly -
                goal.monthlyContribution
              : null;

          const onTrack =
            completed ||
            requiredMonthly === null ||
            contributionGap === null ||
            contributionGap <= 0;

          return (
            <div
              key={goal.id}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1322] shadow-sm transition hover:border-slate-700"
            >
              {/* HERO — zdjęcie jest osobną sekcją NAD paskiem postępu */}
              <div
                className={`relative overflow-hidden ${
                  goal.imageUrl ? "h-56" : "h-36"
                }`}
              >
                {goal.imageUrl ? (
                  <img
                    src={goal.imageUrl}
                    alt={goal.name}
                    className={`absolute inset-0 h-full w-full object-cover ${
                      goal.imagePosition === "top"
                        ? "object-top"
                        : goal.imagePosition === "bottom"
                          ? "object-bottom"
                          : "object-center"
                    }`}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${goal.color}22, #07101d 70%)`,
                    }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#07101d] via-[#07101d]/20 to-black/15" />

                <div className="absolute left-4 top-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-slate-950/70 shadow-lg backdrop-blur-md"
                    style={{ color: goal.color }}
                  >
                    <Target size={23} />
                  </div>
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGoal({
                        ...goal,
                        priority:
                          priority === "HIGH"
                            ? "MEDIUM"
                            : priority === "MEDIUM"
                              ? "LOW"
                              : "HIGH",
                      })
                    }
                    title="Kliknij, aby zmienić priorytet"
                    className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] shadow-lg backdrop-blur-md transition ${
                      priority === "HIGH"
                        ? "border-rose-400/30 bg-rose-950/80 text-rose-300 hover:bg-rose-900/90"
                        : priority === "MEDIUM"
                          ? "border-amber-400/30 bg-amber-950/80 text-amber-300 hover:bg-amber-900/90"
                          : "border-white/15 bg-slate-950/75 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <Flag size={13} />
                    {priority}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualGoal(goal)}
                    title={goal.imageUrl ? "Zmień zdjęcie celu" : "Dodaj zdjęcie celu"}
                    className="cursor-pointer rounded-lg border border-white/15 bg-slate-950/70 p-2 text-slate-200 shadow-lg backdrop-blur-md transition hover:border-violet-400/50 hover:bg-violet-500/20 hover:text-violet-200"
                  >
                    <Image size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingGoal(goal)}
                    title="Edytuj cel"
                    className="cursor-pointer rounded-lg border border-white/15 bg-slate-950/70 p-2 text-slate-200 shadow-lg backdrop-blur-md transition hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-blue-200"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(goal)}
                    title="Usuń cel"
                    className="cursor-pointer rounded-lg border border-white/15 bg-slate-950/70 p-2 text-slate-200 shadow-lg backdrop-blur-md transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-200"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-white drop-shadow-lg">
                      {goal.name}
                    </h2>
                    <span className="rounded-md border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-300 backdrop-blur-md">
                      {formatGoalType(goal.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTENT — jak w mockupie: kwota + progress bez zdjęcia pod spodem */}
              <div className="p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-2xl font-black text-white">
                      {goal.currentAmount.toLocaleString("pl-PL")} zł
                    </span>
                    <span className="ml-2 text-sm text-slate-500">
                      / {goal.targetAmount.toLocaleString("pl-PL")} zł
                    </span>
                  </div>

                  <span className="text-sm font-black text-slate-200">
                    {progress.toFixed(0)}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Info
                    label="Brakuje"
                    value={
                      completed
                        ? "0 zł"
                        : `${remaining.toLocaleString("pl-PL")} zł`
                    }
                  />

                  <Info
                    label="Wpłacasz / mies."
                    value={`${goal.monthlyContribution.toLocaleString("pl-PL")} zł`}
                  />

                  <Info
                    label="Wymagane / mies."
                    value={
                      requiredMonthly !== null
                        ? `${requiredMonthly.toLocaleString("pl-PL")} zł`
                        : "Brak deadline"
                    }
                    status={
                      requiredMonthly === null
                        ? "neutral"
                        : onTrack
                          ? "good"
                          : "bad"
                    }
                  />
                </div>

                {targetDate && !completed && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 ${
                      onTrack
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-amber-500/20 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays
                          size={16}
                          className={
                            onTrack
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }
                        />
                        <span className="text-slate-400">
                          Deadline:{" "}
                          <strong className="text-slate-200">
                            {targetDate.toLocaleDateString("pl-PL", {
                              month: "long",
                              year: "numeric",
                            })}
                          </strong>
                        </span>
                      </div>

                      <span
                        className={`text-xs font-black ${
                          onTrack
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {onTrack
                          ? "✓ ON TRACK"
                          : `Brakuje ${Math.max(
                              contributionGap ?? 0,
                              0
                            ).toLocaleString("pl-PL")} zł / mies.`}
                      </span>
                    </div>
                  </div>
                )}

                {!completed && (
                  <button
                    type="button"
                    onClick={() => setFundingGoal(goal)}
                    className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:shadow-lg hover:shadow-emerald-950/20"
                  >
                    <WalletCards size={17} />
                    + ADD MONEY
                  </button>
                )}

                {completed && !moneyFlow?.executedGoalIds.includes(goal.id) && (
                  <button type="button" onClick={()=>void executeGoal(goal)}
                    className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 hover:bg-amber-500/15">
                    ✓ WYKONAJ CEL / UŻYJ ŚRODKÓW
                  </button>
                )}
                {moneyFlow?.executedGoalIds.includes(goal.id) ? (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-4 text-sm font-black text-violet-300">
                    ✓ CEL WYKONANY · KAPITAŁ ZUŻYTY
                  </div>
                ) : completed ? (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-4 text-sm font-bold text-emerald-400">
                    <Target size={17} />
                    Cel w pełni sfinansowany! 🎉
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-4 text-sm text-slate-400">
                    <CalendarDays size={17} className="text-blue-400" />

                    {months === null || projectedDate === null ? (
                      <span>Ustaw miesięczną wpłatę, aby policzyć termin</span>
                    ) : (
                      <span>
                        Przy obecnym tempie:{" "}
                        <strong className="text-slate-200">{months} mies.</strong>
                        {" "}— około{" "}
                        {projectedDate.toLocaleDateString("pl-PL", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-16 text-center">
          <Target
            size={36}
            className="mx-auto text-slate-600"
          />

          <h2 className="mt-4 text-lg font-semibold">
            Nie masz jeszcze celów
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Dodaj pierwszy cel finansowy.
          </p>
        </div>
      )}

      {isAddModalOpen && (
        <AddGoalModal
          onClose={() =>
            setIsAddModalOpen(
              false
            )
          }
          onAdd={onAddGoal}
        />
      )}

      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() =>
            setEditingGoal(null)
          }
          onUpdate={
            onUpdateGoal
          }
        />
      )}

      {fundingGoal && (
        <GoalFundingModal
          goal={fundingGoal}
          portfolio={portfolio}
          onClose={() => setFundingGoal(null)}
          onRelease={async(assetId,amount)=>{await onReleaseMoney(fundingGoal.id,assetId,amount);}}
          onAllocate={async (request) => {
            await onAllocateMoney(
              fundingGoal.id,
              request
            );
            await refreshMoneyFlow();
            setFundingGoal(null);
          }}
        />
      )}

      {visualGoal && (
        <GoalVisualModal
          goal={visualGoal}
          onClose={() => setVisualGoal(null)}
          onSave={(imageUrl, imagePosition) => {
            onUpdateGoal({
              ...visualGoal,
              imageUrl: imageUrl || undefined,
              imagePosition,
            });
            setVisualGoal(null);
          }}
        />
      )}
    </main>
  );
}


type GoalFundingModalProps = {
  goal: Goal;
  portfolio: Asset[];
  onClose: () => void;
  onAllocate: (
    request: AllocateGoalMoneyRequest
  ) => Promise<void>;
  onRelease:(assetId:number,amount:number)=>Promise<void>;
};

function GoalFundingModal({
  goal,
  portfolio,
  onClose,
  onAllocate,
  onRelease,
}: GoalFundingModalProps) {
  const remaining = Math.max(
    goal.targetAmount - goal.currentAmount,
    0
  );

  const [mode, setMode] = useState<
    "ALLOCATE_EXISTING" | "TRANSFER_AND_ALLOCATE"
  >("ALLOCATE_EXISTING");

  const [amount, setAmount] = useState(
    String(Math.min(remaining, 2000))
  );

  const [targetAssetId, setTargetAssetId] =
    useState<number | null>(
      portfolio[0]?.id ?? null
    );

  const [sourceAssetId, setSourceAssetId] =
    useState<number | null>(
      portfolio.find(
        (asset) => asset.category === "cash"
      )?.id ??
        portfolio[0]?.id ??
        null
    );

  const [summary, setSummary] =
    useState<GoalAllocationSummary | null>(
      null
    );
  const [allGoalReservations, setAllGoalReservations] = useState<MoneyFlowOverview | null>(null);
  const [liabilityReservations, setLiabilityReservations] = useState<LiabilityAllocationOverview | null>(null);

  const [isLoadingSummary, setIsLoadingSummary] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const [loaded, allGoals, liabilities] = await Promise.all([
          goalAllocationApi.getSummary(goal.id),
          goalAllocationApi.getOverview(),
          liabilityAllocationApi.getOverview(),
        ]);

        if (!cancelled) {
          setSummary(loaded);
          setAllGoalReservations(allGoals);
          setLiabilityReservations(liabilities);
        }
      } catch (caught) {
        console.error(
          "Nie udało się pobrać alokacji celu:",
          caught
        );
      } finally {
        if (!cancelled) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [goal.id]);

  const parsedAmount = Number(
    amount.replace(/\s/g, "").replace(",", ".")
  );

  const sourceAsset = portfolio.find(
    (asset) => asset.id === sourceAssetId
  );

  const targetAsset = portfolio.find(
    (asset) => asset.id === targetAssetId
  );

  const reservedByAsset = new Map<number, number>();
  for (const allocation of allGoalReservations?.allocations ?? []) {
    if (allocation.assetId != null) {
      reservedByAsset.set(allocation.assetId, (reservedByAsset.get(allocation.assetId) ?? 0) + allocation.amount);
    }
  }
  for (const allocation of liabilityReservations?.allocations ?? []) {
    if (allocation.assetId != null) {
      reservedByAsset.set(allocation.assetId, (reservedByAsset.get(allocation.assetId) ?? 0) + allocation.amount);
    }
  }

  const targetUnallocated = targetAsset
    ? Math.max(targetAsset.value - (reservedByAsset.get(targetAsset.id) ?? 0), 0)
    : 0;
  const sourceAvailable = sourceAsset
    ? Math.max(sourceAsset.value - (reservedByAsset.get(sourceAsset.id) ?? 0), 0)
    : 0;

  const amountIsBasicValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= remaining;

  const modeIsValid =
    mode === "ALLOCATE_EXISTING"
      ? parsedAmount <= targetUnallocated
      : Boolean(
          sourceAsset &&
            targetAsset &&
            sourceAsset.id !== targetAsset.id &&
            parsedAmount <= sourceAvailable
        );

  const valid =
    amountIsBasicValid &&
    modeIsValid &&
    targetAssetId !== null;

  const nextGoalAmount = valid
    ? goal.currentAmount + parsedAmount
    : goal.currentAmount;

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();
    setError(null);

    if (!valid || targetAssetId === null) {
      if (
        mode === "ALLOCATE_EXISTING" &&
        parsedAmount > targetUnallocated
      ) {
        setError(
          `W ${targetAsset?.name ?? "aktywie"} masz tylko ${targetUnallocated.toLocaleString("pl-PL")} zł wolnych po wszystkich rezerwacjach.`
        );
      } else if (
        mode === "TRANSFER_AND_ALLOCATE" &&
        sourceAsset &&
        parsedAmount > sourceAvailable
      ) {
        setError(
          `Źródło ma tylko ${sourceAvailable.toLocaleString("pl-PL")} zł wolnych po rezerwacjach.`
        );
      } else {
        setError(
          "Sprawdź kwotę i wybrane aktywa."
        );
      }
      return;
    }

    setIsSaving(true);

    try {
      await onAllocate({
        amount: parsedAmount,
        mode,
        sourceAssetId:
          mode === "TRANSFER_AND_ALLOCATE"
            ? sourceAssetId
            : null,
        targetAssetId,
      });
    } catch {
      setError(
        "Backend odrzucił operację. Sprawdź dostępne środki i spróbuj ponownie."
      );
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-emerald-500/20 bg-[#0b1322] shadow-2xl shadow-black/50">
        <div className="relative overflow-hidden border-b border-slate-800 px-6 py-5">
          {goal.imageUrl && (
            <>
              <img
                src={goal.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-20"
                style={{
                  objectPosition:
                    goal.imagePosition ?? "center",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1322] via-[#0b1322]/95 to-[#0b1322]/75" />
            </>
          )}

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                Portfolio → Goal
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Zasil · {goal.name}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Cel nie tworzy nowych pieniędzy. Wskazuje,
                jaka część Twojego portfolio pracuje na ten cel.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-6 p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                Cel teraz
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {goal.currentAmount.toLocaleString("pl-PL")} zł
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-500/70">
                Po operacji
              </p>
              <p className="mt-1 text-lg font-black text-emerald-300">
                {nextGoalAmount.toLocaleString("pl-PL")} zł
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Co robisz?
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setMode("ALLOCATE_EXISTING")
                }
                className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                  mode === "ALLOCATE_EXISTING"
                    ? "border-blue-400/40 bg-blue-500/10"
                    : "border-slate-800 bg-slate-950/35 hover:border-slate-700"
                }`}
              >
                <p className="font-black text-white">
                  Przypisz istniejące aktywo
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Np. 2k z już posiadanej gotówki staje się
                  częścią Poduszki. Net Worth i portfolio bez zmian.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode("TRANSFER_AND_ALLOCATE")
                }
                className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                  mode === "TRANSFER_AND_ALLOCATE"
                    ? "border-violet-400/40 bg-violet-500/10"
                    : "border-slate-800 bg-slate-950/35 hover:border-slate-700"
                }`}
              >
                <p className="font-black text-white">
                  Kup / przenieś i przypisz
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Np. Gotówka -2k → Obligacje +2k →
                  Poduszka +2k. Net Worth bez zmian.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Kwota
            </label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-2xl font-black text-white outline-none transition focus:border-emerald-400/50"
            />
          </div>

          {mode === "TRANSFER_AND_ALLOCATE" && (
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                Z czego schodzi kapitał?
              </label>
              <select
                value={sourceAssetId ?? ""}
                onChange={(event) =>
                  setSourceAssetId(
                    Number(event.target.value)
                  )
                }
                className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-200"
              >
                {portfolio.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.name} · {Math.max(asset.value - (reservedByAsset.get(asset.id) ?? 0), 0).toLocaleString("pl-PL")} zł wolne
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              {mode === "ALLOCATE_EXISTING"
                ? "Które aktywo finansuje cel?"
                : "Do jakiego aktywa trafia kapitał?"}
            </label>
            <select
              value={targetAssetId ?? ""}
              onChange={(event) =>
                setTargetAssetId(
                  Number(event.target.value)
                )
              }
              className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-200"
            >
              {portfolio.map((asset) => (
                <option
                  key={asset.id}
                  value={asset.id}
                >
                  {asset.name} · {Math.max(asset.value - (reservedByAsset.get(asset.id) ?? 0), 0).toLocaleString("pl-PL")} zł wolne
                </option>
              ))}
            </select>

            {mode === "ALLOCATE_EXISTING" &&
              targetAsset && (
                <p className="mt-2 text-xs text-slate-500">
                  Wolne po celach i zobowiązaniach:
                  {" "}
                  <strong className="text-slate-300">
                    {isLoadingSummary
                      ? "..."
                      : `${targetUnallocated.toLocaleString("pl-PL")} zł`}
                  </strong>
                </p>
              )}
          </div>

          {summary &&
            summary.allocations.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Z czego składa się ten cel
                </p>

                <div className="mt-3 space-y-2">
                  {summary.allocations.map(
                    (allocation) => (
                      <div
                        key={allocation.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-400">
                          {allocation.assetName}
                        </span>
                        <div className="flex items-center gap-2"><span className="font-black text-white">{allocation.amount.toLocaleString("pl-PL")} zł</span>{allocation.assetId!==null&&<button type="button" onClick={async()=>{const raw=window.prompt("Ile zł cofnąć z celu?",String(allocation.amount));if(!raw)return;const value=Number(raw.replace(",","."));if(!Number.isFinite(value)||value<=0)return;await onRelease(allocation.assetId!,value);setSummary(await goalAllocationApi.getSummary(goal.id));}} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-400 hover:border-amber-400/40 hover:text-amber-300">COFNIJ</button>}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300"
            >
              Anuluj
            </button>

            <button
              type="submit"
              disabled={!valid || isSaving}
              className="cursor-pointer rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving
                ? "Księguję..."
                : mode === "ALLOCATE_EXISTING"
                  ? "PRZYPISZ DO CELU"
                  : "TRANSFER + CEL"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type GoalVisualModalProps = {
  goal: Goal;
  onClose: () => void;
  onSave: (
    imageUrl: string,
    imagePosition: "center" | "top" | "bottom"
  ) => void;
};

function GoalVisualModal({
  goal,
  onClose,
  onSave,
}: GoalVisualModalProps) {
  const [imageUrl, setImageUrl] = useState(goal.imageUrl ?? "");
  const [imagePosition, setImagePosition] = useState<
    "center" | "top" | "bottom"
  >(goal.imagePosition ?? "center");
  const [previewError, setPreviewError] = useState(false);

  function handleFileSelect(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert("Wybierz plik graficzny.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      window.alert("Zdjęcie może mieć maksymalnie 5 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
        setPreviewError(false);
      }
    };

    reader.readAsDataURL(file);
  }

  const presets = [
    { label: "Dom", value: "/goals/house.webp" },
    { label: "BMW X5 M", value: "/goals/bmw-x5m.webp" },
    { label: "BMW F36 430i", value: "/goals/bmw-f36.webp" },
    { label: "Kapitał", value: "/goals/money.webp" },
  ];

  function chooseImage(value: string) {
    setImageUrl(value);
    setPreviewError(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-400">
              Visual Goal
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Zdjęcie · {goal.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            Zamknij
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div
            className="relative h-52 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
          >
            {imageUrl && !previewError ? (
              <>
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={`Podgląd ${goal.name}`}
                  onError={() => setPreviewError(true)}
                  className={`h-full w-full object-cover ${
                    imagePosition === "top"
                      ? "object-top"
                      : imagePosition === "bottom"
                        ? "object-bottom"
                        : "object-center"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050b16]/90 via-[#050b16]/55 to-[#050b16]/20" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Preview
                  </p>
                  <p className="mt-1 text-xl font-black text-white">{goal.name}</p>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-600">
                <ImageOff size={28} />
                <p className="mt-3 text-sm font-semibold">
                  {previewError ? "Nie udało się wczytać zdjęcia" : "Brak zdjęcia"}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-300">
              Zdjęcie z komputera
            </p>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-4 text-sm font-black text-violet-300 transition hover:border-violet-400/60 hover:bg-violet-500/10">
              <Image size={18} />
              Wybierz zdjęcie z dysku
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  handleFileSelect(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              PNG, JPG, WEBP lub GIF · maks. 5 MB. Plik zostanie zapisany razem z celem.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
              albo
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              URL / ścieżka do zdjęcia
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
                setPreviewError(false);
              }}
              placeholder="/goals/bmw-x5m.webp albo https://..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Dla lokalnych zdjęć wrzuć pliki do public/goals i użyj ścieżki /goals/nazwa.webp.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-300">Szybkie presety</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => chooseImage(preset.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-black transition ${
                    imageUrl === preset.value
                      ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-300">Kadrowanie</p>
            <div className="grid grid-cols-3 gap-2">
              {(["top", "center", "bottom"] as const).map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setImagePosition(position)}
                  className={`rounded-lg border px-3 py-2 text-xs font-black uppercase transition ${
                    imagePosition === position
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-700 bg-slate-900 text-slate-500"
                  }`}
                >
                  {position === "top"
                    ? "Góra"
                    : position === "bottom"
                      ? "Dół"
                      : "Środek"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-800 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setImageUrl("");
                setPreviewError(false);
              }}
              className="cursor-pointer rounded-xl border border-rose-500/20 px-4 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-500/10"
            >
              Usuń zdjęcie
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => onSave(imageUrl.trim(), imagePosition)}
                className="cursor-pointer rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500"
              >
                Zapisz wygląd
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatGoalType(type: Goal["type"]) {
  return {
    EMERGENCY_FUND: "Poduszka",
    HOME: "Dom",
    CAR: "Samochód",
    TRAVEL: "Podróże",
    OTHER: "Inny",
  }[type ?? "OTHER"];
}

type InfoProps = {
  label: string;
  value: string;
  status?: "neutral" | "good" | "bad";
};

function Info({
  label,
  value,
  status = "neutral",
}: InfoProps) {
  return (
    <div className="rounded-xl bg-slate-950/50 p-4">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div
        className={`mt-1 font-semibold ${
          status === "good"
            ? "text-emerald-400"
            : status === "bad"
              ? "text-amber-400"
              : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}