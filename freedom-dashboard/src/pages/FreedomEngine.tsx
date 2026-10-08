import {



  Activity,



  Banknote,



  BrainCircuit,



  Check,



  CircleDollarSign,



  Database,



  Gauge,



  Landmark,



  Rocket,



  Sparkles,



  Target,



  TrendingUp,



  WalletCards,



  Zap,



} from "lucide-react";



import { useEffect, useState, type ReactNode } from "react";

import {

  getFreedomMissions,

  type FreedomMission,

  type MissionPriority,

} from "../features/missions/missionEngine";

import {
  routeMoney,
  type MoneyRoute,
} from "../features/intelligence/moneyRouter";







import type { Asset } from "../types/Asset";

import type { Goal } from "../types/Goal";



import type { Liability } from "../types/Liability";



import type { MonthlyBudget } from "../types/Cashflow";
import { useLanguage } from "../i18n/LanguageContext";



import {



  calculateFreedomEngine,



  type FreedomInsight,



  type FreedomScoreComponent,



} from "../features/freedom/freedomEngine";







type FreedomEngineProps = {



  netWorth: number;



  portfolio: Asset[];



  goals: Goal[];



  liabilities: Liability[];



  monthlyBudget: MonthlyBudget;



};







export function FreedomEngine(props: FreedomEngineProps) {
  const { language } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const engine = calculateFreedomEngine(props, language);
  const missions = getFreedomMissions(props, language);

  const [focusedMissionId, setFocusedMissionId] =
    useState<string | null>(() =>
      localStorage.getItem("freedom-focused-mission")
    );

  useEffect(() => {
    if (focusedMissionId) {
      localStorage.setItem(
        "freedom-focused-mission",
        focusedMissionId
      );
    } else {
      localStorage.removeItem(
        "freedom-focused-mission"
      );
    }
  }, [focusedMissionId]);

  const focusedMission =
    missions.find(
      (mission) =>
        mission.id === focusedMissionId &&
        mission.status !== "COMPLETE"
    ) ?? null;

  useEffect(() => {
    if (
      focusedMissionId &&
      !focusedMission
    ) {
      setFocusedMissionId(null);
    }
  }, [
    focusedMission,
    focusedMissionId,
  ]);

  const activeMissions =
    missions.filter(
      (mission) =>
        mission.status === "ACTIVE"
    );







  const confidenceStyle =



    engine.dataConfidence === "HIGH"



      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"



      : engine.dataConfidence === "MEDIUM"



        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"



        : "bg-rose-500/10 text-rose-400 border-rose-500/20";







  const [routerMode, setRouterMode] =
    useState<"MONTHLY" | "EXTRA">("MONTHLY");

  const [routerAmount, setRouterAmount] =
    useState(10_000);

  const monthlyRouterAmount = Math.max(
    Math.round(engine.averageSurplus),
    0
  );

  const activeRouterAmount =
    routerMode === "MONTHLY"
      ? monthlyRouterAmount
      : routerAmount;

  const moneyPlan = routeMoney({
    amount: activeRouterAmount,
    ...props,
  });

  return (



    <main className="min-h-screen bg-[#050b16] p-8 text-white">



      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">



        <div>



          <div className="flex items-center gap-2">



            <BrainCircuit size={20} className="text-cyan-400" />



            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-400">



              {ui("Silnik Freedom", "Freedom Engine")}



            </p>



          </div>



          <h1 className="mt-3 text-3xl font-black tracking-tight">



            {ui("Twój finansowy silnik", "Your financial engine")}



          </h1>



          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">



            {ui(
              "Wynik oparty na średnim przepływie pieniężnym, strukturze aktywów, płynności i zadłużeniu. Cele użytkownika są źródłem misji — bez sztucznej poduszki systemowej.",
              "Score based on rolling cashflow, asset structure, liquidity and debt. Your real goals are the source of missions — without an artificial system shield."
            )}



          </p>



        </div>







        <div className="flex flex-wrap gap-3">



          <div className={`rounded-2xl border px-5 py-4 ${confidenceStyle}`}>



            <div className="flex items-center gap-2">



              <Database size={16} />



              <p className="text-[10px] font-black uppercase tracking-[0.18em]">



                Data confidence



              </p>



            </div>



            <p className="mt-1 text-xl font-black">



              {engine.dataConfidence}



            </p>



            <p className="mt-1 text-xs opacity-70">



              {engine.monthsOfHistory} mies. historii



            </p>



          </div>







          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-4">



            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">



              Freedom target



            </p>



            <p className="mt-1 text-2xl font-black">



              {formatMoney(engine.freedomTarget)}



            </p>



          </div>



        </div>



      </section>







      {engine.unclassifiedAssets > 0 && (



        <section className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">



          <p className="font-black text-amber-400">



            ⚠ {ui("Sklasyfikuj stare aktywa", "Classify legacy assets")}



          </p>



          <p className="mt-1 text-sm text-slate-400">



            {ui(
              `${formatMoney(engine.unclassifiedAssets)} portfela pochodzi ze starego modelu aktywów i nie ma jeszcze kategorii. Wejdź w Inwestycje → edytuj pozycję → wybierz kategorię. Do tego czasu silnik traktuje ją jako „Inne”.`,
              `${formatMoney(engine.unclassifiedAssets)} of the portfolio comes from the legacy asset model and is still uncategorized. Go to Investments → edit the position → choose a category. Until then, the Engine treats it as “Other”.`
            )}



          </p>



        </section>



      )}







      <section className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1.9fr]">



        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-[#0b1322] to-[#0b1322] p-8">



          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />



          <div className="relative">



            <div className="flex items-center justify-between">



              <div>



                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-400">



                  Freedom score



                </p>



                <p className="mt-3 text-7xl font-black tracking-tight">



                  {engine.freedomScore}



                  <span className="text-2xl text-slate-600">/100</span>



                </p>



              </div>



              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-blue-400">



                <Gauge size={38} />



              </div>



            </div>







            <div className="mt-8 h-4 overflow-hidden rounded-full bg-slate-800">



              <div



                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"



                style={{ width: `${engine.freedomScore}%` }}



              />



            </div>







            <p className="mt-3 text-sm leading-6 text-slate-500">



              {ui(
                "Przepływ pieniężny i stopa oszczędności używają maksymalnie 3 ostatnich miesięcy danych. Płynność pokazuje wyłącznie kategorię „Gotówka / konto” i nie tworzy osobnego celu.",
                "Cashflow and savings rate use up to the last 3 months of data. Liquidity includes only the Cash / account category and does not create a separate goal."
              )}



            </p>



          </div>



        </div>







        <div className="rounded-3xl border border-slate-800 bg-[#0b1322] p-7">



          <div className="flex items-center gap-2">



            <Activity size={18} className="text-cyan-400" />



            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">



              {ui("Składowe wyniku", "Score breakdown")}



            </p>



          </div>



          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">



            {engine.scoreComponents.map((component) => (



              <ScoreComponent key={component.id} component={component} />



            ))}



          </div>



        </div>



      </section>







      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">



        <MetricCard



          icon={<CircleDollarSign size={22} />}



          label={ui("Majątek netto", "Net worth")}



          value={formatMoney(props.netWorth)}



          sub={ui(`${engine.progressToFreedom.toFixed(1)}% drogi do WOLNOŚCI`, `${engine.progressToFreedom.toFixed(1)}% of the road to FREE`)}



        />



        <MetricCard



          icon={<Zap size={22} />}



          label={`Cashflow ${engine.rollingMonths}M`}



          value={formatSignedMoney(engine.averageSurplus)}



          sub={`${engine.savingsRate.toFixed(1)}% rolling savings rate`}



          positive={engine.averageSurplus >= 0}



        />



        <MetricCard



          icon={<WalletCards size={22} />}



          label={ui("Kapitał inwestycyjny", "Invested capital")}



          value={formatMoney(engine.investedAssets)}



          sub={ui(`${engine.investmentRatio.toFixed(1)}% aktywów brutto`, `${engine.investmentRatio.toFixed(1)}% of gross assets`)}



        />



        <MetricCard



          icon={<Landmark size={22} />}



          label={ui("Płynność", "Liquidity")}



          value={formatMoney(engine.liquidAssets)}



          sub={ui(`${engine.safetyMonths.toFixed(1)} mies. średnich kosztów`, `${engine.safetyMonths.toFixed(1)} months of average expenses`)}



          positive={engine.safetyMonths >= 6}



        />



      </section>







      <section className="mt-5 rounded-3xl border border-slate-800 bg-[#0b1322] p-7">



        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">



          <div>



            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">



              {ui("Twoja droga do wolności", "Your freedom path")}



            </p>



            <h2 className="mt-2 text-2xl font-black">{ui("Droga do 3 milionów", "Road to PLN 3 million")}</h2>



          </div>



          <p className="text-sm font-bold text-cyan-400">



            {engine.progressToFreedom.toFixed(2)}% FREE



          </p>



        </div>







        <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-800">



          <div



            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400"



            style={{ width: `${engine.progressToFreedom}%` }}



          />



        </div>







        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">



          {engine.milestones.map((milestone) => (



            <div



              key={milestone.name}



              className={`rounded-2xl border p-4 ${



                milestone.reached



                  ? "border-emerald-500/20 bg-emerald-500/5"



                  : engine.nextMilestone?.name === milestone.name



                    ? "border-blue-500/30 bg-blue-500/10"



                    : "border-slate-800 bg-slate-900/40"



              }`}



            >



              <div



                className={`flex h-9 w-9 items-center justify-center rounded-xl ${



                  milestone.reached



                    ? "bg-emerald-500/10 text-emerald-400"



                    : engine.nextMilestone?.name === milestone.name



                      ? "bg-blue-500/10 text-blue-400"



                      : "bg-slate-800 text-slate-600"



                }`}



              >



                {milestone.reached ? <Check size={18} /> : <Target size={18} />}



              </div>



              <p className="mt-4 text-lg font-black">



                {formatCompactMoney(milestone.value)}



              </p>



              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">



                {milestone.name}



              </p>



            </div>



          ))}



        </div>



      </section>







      <section className="mt-5 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-[#0b1322] to-violet-500/5 p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Target size={19} className="text-blue-400" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">{ui("Misje · Oparte na celach", "Missions · Goal driven")}</p>
            </div>
            <h2 className="mt-2 text-2xl font-black">{ui("Co robimy teraz?", "What are we doing now?")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {ui(
                "Misje są warstwą działania nad Twoimi prawdziwymi celami. Silnik może dodać dług lub przepływy pieniężne, ale nie tworzy osobnej wirtualnej poduszki.",
                "Missions are an action layer on top of your real goals. The Engine can add debt or cashflow priorities, but it no longer creates a separate virtual safety goal."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-400">{ui("Kolejka misji", "Mission queue")}</p>
              <p className="mt-1 text-lg font-black">{activeMissions.length} {ui("AKTYWNE", "ACTIVE")}</p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-400">{ui("Misje celów", "Goal missions")}</p>
              <p className="mt-1 text-lg font-black">{missions.filter((mission) => mission.source === "GOAL").length}</p>
            </div>
          </div>
        </div>

        {focusedMission ? (
          <div className="relative mt-6 min-h-64 overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#07101d]">
            {focusedMission.imageUrl && (
              <>
                <img
                  src={focusedMission.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                  style={{ objectPosition: focusedMission.imagePosition ?? "center" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#06101d] via-[#06101d]/90 to-[#06101d]/35" />
              </>
            )}
            <div className="relative flex min-h-64 flex-col justify-between p-6 lg:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">{ui("Główna misja", "Primary mission")}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">{focusedMission.source}</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight">{focusedMission.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300/80">{focusedMission.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFocusedMissionId(null)}
                  className="cursor-pointer shrink-0 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-xs font-black text-slate-300 backdrop-blur transition hover:border-slate-500 hover:text-white"
                >
                  {ui("Usuń z fokusu", "Remove from focus")}
                </button>
              </div>

              <div className="mt-8 max-w-3xl">
                <div className="flex items-end justify-between gap-4 text-xs">
                  <span className="font-bold text-slate-300">{formatMissionValue(focusedMission.current, focusedMission.unit)}</span>
                  <span className="font-black text-cyan-300">{formatMissionValue(focusedMission.target, focusedMission.unit)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/5 bg-slate-950/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-700" style={{ width: `${focusedMission.progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-400">{focusedMission.footer}</p>
                  <p className="text-sm font-black text-cyan-300">{focusedMission.progress.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-5">
            <p className="font-black text-slate-300">{ui("Wybierz swoją główną misję.", "Choose your primary mission.")}</p>
            <p className="mt-1 text-sm text-slate-600">{ui("Najlepiej cel, który faktycznie chcesz teraz dowieźć. Silnik podpowiada kolejkę poniżej.", "Prefer the goal you genuinely want to deliver now. The Engine suggests the queue below.")}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              focused={focusedMissionId === mission.id}
              onFocus={() => setFocusedMissionId(focusedMissionId === mission.id ? null : mission.id)}
            />
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-violet-500/15 bg-violet-500/5 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-400">{ui("Jak działa kolejka?", "How does the queue work?")}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {ui(
              "Najpierw realny cel o najwyższym priorytecie. Pozostałe miejsca mogą dostać redukcja długu, utrzymanie przepływów albo kolejny cel. XP nadal pochodzi wyłącznie z osiągnięć.",
              "Your highest-priority real goal comes first. Remaining slots can be filled by debt reduction, cashflow maintenance or another goal. XP still comes only from Achievements."
            )}
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-[#0b1322] to-cyan-500/5 p-7">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit size={20} className="text-violet-400" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
                Inteligencja Freedom
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-black">{ui("Router środków", "Money Router")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {ui(
                "Wybierz tryb miesięczny oparty o średni przepływ pieniężny albo zasymuluj jednorazową nadwyżkę. Router najpierw zabezpiecza fundamenty, potem konkretne długi i miesięczne minimum celów z terminem.",
                "Choose a monthly mode based on rolling cashflow or simulate a one-off surplus. The Router secures the foundations first, then specific debts and the monthly minimum for goals with deadlines."
              )}
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-[#08111f] p-1.5">
              <button
                type="button"
                onClick={() => setRouterMode("MONTHLY")}
                className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  routerMode === "MONTHLY"
                    ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {ui("Plan miesięczny", "Monthly plan")}
              </button>

              <button
                type="button"
                onClick={() => setRouterMode("EXTRA")}
                className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  routerMode === "EXTRA"
                    ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {ui("Dodatkowa gotówka", "Extra cash")}
              </button>
            </div>

            {routerMode === "MONTHLY" ? (
              <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">
                  Rolling cashflow {engine.rollingMonths}M
                </p>

                <div className="mt-1 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-black text-white">
                      {formatMoney(monthlyRouterAmount)}
                      <span className="ml-1 text-sm text-slate-500">{ui("/ mies.", "/ month")}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ui("Pobierane automatycznie z aktualnych danych finansowych.", "Pulled automatically from current financial data.")}
                    </p>
                  </div>

                  <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
                    Live
                  </span>
                </div>
              </div>
            ) : (
              <>
                <label className="mt-3 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                  {ui("Mam dodatkowo", "Extra amount")}
                </label>

                <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-[#08111f] px-4">
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={routerAmount}
                    onChange={(event) =>
                      setRouterAmount(
                        Math.max(Number(event.target.value) || 0, 0)
                      )
                    }
                    className="min-w-0 flex-1 bg-transparent py-3 text-lg font-black text-white outline-none"
                  />
                  <span className="text-sm font-black text-slate-500">zł</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {[5_000, 10_000, 25_000, 50_000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setRouterAmount(amount)}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-[10px] font-black text-slate-400 transition hover:border-violet-500/30 hover:text-violet-300"
                    >
                      {formatMoney(amount)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className={`mt-6 flex flex-col justify-between gap-3 rounded-2xl border px-5 py-4 lg:flex-row lg:items-center ${
            routerMode === "MONTHLY"
              ? "border-cyan-500/20 bg-cyan-500/5"
              : "border-violet-500/20 bg-violet-500/5"
          }`}
        >
          <div>
            <p
              className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                routerMode === "MONTHLY"
                  ? "text-cyan-400"
                  : "text-violet-400"
              }`}
            >
              {routerMode === "MONTHLY"
                ? ui("Tryb miesięczny", "Monthly operating mode")
                : ui("Symulacja jednorazowa", "One-off simulation")}
            </p>

            <p className="mt-1 font-black">
              {routerMode === "MONTHLY"
                ? ui(`Rozdzielam aktualną miesięczną nadwyżkę ${formatMoney(monthlyRouterAmount)}.`, `Routing the current monthly surplus of ${formatMoney(monthlyRouterAmount)}.`)
                : ui(`Symuluję jednorazowe rozdysponowanie ${formatMoney(routerAmount)}.`, `Simulating a one-off allocation of ${formatMoney(routerAmount)}.`)}
            </p>
          </div>

          {routerMode === "MONTHLY" && (
            <div className="text-xs text-slate-500">
              {ui("Źródło", "Source")}: rolling cashflow {engine.rollingMonths}M
            </div>
          )}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {moneyPlan.routes.length > 0 ? (
            moneyPlan.routes.map((route, index) => (
              <MoneyRouteCard
                key={`${route.kind}-${index}`}
                route={route}
                index={index + 1}
              />
            ))
          ) : (
            <div className="xl:col-span-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-6 text-center">
              <p className="font-black text-slate-300">{ui("Brak dodatniej nadwyżki do rozdysponowania.", "No positive surplus available to allocate.")}</p>
              <p className="mt-1 text-sm text-slate-600">
                {ui("W trybie planu miesięcznego potrzebny jest dodatni średni przepływ; w trybie dodatkowej gotówki możesz wpisać własną kwotę.", "Monthly plan requires positive rolling cashflow; in Extra cash mode you can enter your own amount.")}
              </p>
            </div>
          )}
        </div>

        {moneyPlan.deadlineSummary.requiredMonthly > 0 && (
          <div
            className={`mt-6 rounded-2xl border p-5 ${
              moneyPlan.deadlineSummary.onTrack
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-rose-500/20 bg-rose-500/5"
            }`}
          >
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                    moneyPlan.deadlineSummary.onTrack
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {ui("Analiza terminów", "Deadline Intelligence")}
                </p>
                <p className="mt-1 font-black">
                  {moneyPlan.deadlineSummary.onTrack
                    ? ui("Miesięczne minimum celów z terminem zabezpieczone", "Monthly deadline minimum secured")
                    : ui(
                        `Brakuje ${formatMoney(moneyPlan.deadlineSummary.shortfall)} do miesięcznego minimum`,
                        `${formatMoney(moneyPlan.deadlineSummary.shortfall)} short of the monthly minimum`
                      )}
                </p>
              </div>

              <div className="text-sm text-slate-400">
                {ui("Wymagane", "Required")}{" "}
                <span className="font-black text-white">
                  {formatMoney(
                    moneyPlan.deadlineSummary.requiredMonthly
                  )}
                </span>
                {" • "}{ui("przydzielone", "allocated")}{" "}
                <span className="font-black text-white">
                  {formatMoney(
                    moneyPlan.deadlineSummary.allocatedMonthly
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {moneyPlan.routes.length > 0 && (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">
              {routerMode === "MONTHLY" ? ui("Miesięczny plan", "Monthly plan") : ui("Plan dla", "Plan for")}{" "}
              {formatMoney(moneyPlan.amount)}
              {routerMode === "MONTHLY" ? ui(" / mies.", " / month") : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-black">
              {moneyPlan.routes.map((route, index) => (
                <div key={`${route.kind}-summary-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span className="text-slate-700">→</span>}
                  <span className="text-slate-300">{route.title}</span>
                  <span className="text-cyan-400">{formatMoney(route.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-slate-600">
          {ui(
            "Plan miesięczny korzysta z aktualnego średniego przepływu i pokazuje operacyjny podział nadwyżki na ten miesiąc. Dodatkowa gotówka pozostaje symulatorem jednorazowej kwoty. Cele z terminem dostają miesięczne minimum; przy niedoborze priorytet WYSOKI → ŚREDNI → NISKI rozstrzyga kolejność, a konkretne długi wybiera analiza zadłużenia.",
            "Monthly plan uses current rolling cashflow and shows the operational surplus allocation for this month. Extra cash remains a one-off amount simulator. Goals with deadlines receive their monthly minimum; when funds are short, HIGH → MEDIUM → LOW priority decides the order, while Debt Intelligence selects specific debts."
          )}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">



        <div className="rounded-3xl border border-slate-800 bg-[#0b1322] p-7">



          <div className="flex items-center gap-2">



            <Rocket size={20} className="text-violet-400" />



            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">



              Current trajectory



            </p>



          </div>







          <div className="mt-7 text-center">



            <p className="text-sm text-slate-500">



              Przy rolling cashflow



            </p>



            <p className="mt-3 text-4xl font-black">



              {engine.yearsToFreedom === null



                ? "Brak trajektorii"



                : engine.yearsToFreedom <= 0



                  ? "FREE"



                  : formatYears(engine.yearsToFreedom)}



            </p>



            <p className="mt-2 text-sm text-cyan-400">



              {engine.projectedFreedomDate



                ? `Prosty termin: ${engine.projectedFreedomDate}`



                : "Potrzebny dodatni rolling cashflow"}



            </p>



          </div>







          <div className="mt-7 grid grid-cols-2 gap-3">



            <MiniStat



              label={ui("Śr. dochód", "Avg. income")}



              value={formatMoney(engine.averageIncome)}



            />



            <MiniStat



              label={ui("Śr. wydatki", "Avg. expenses")}



              value={formatMoney(engine.averageExpenses)}



            />



            <MiniStat



              label={ui("Śr. nadwyżka", "Avg. surplus")}



              value={formatSignedMoney(engine.averageSurplus)}



            />



            <MiniStat



              label="Savings rate"



              value={`${engine.savingsRate.toFixed(1)}%`}



            />



          </div>







          <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">



            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">



              Next milestone



            </p>



            {engine.nextMilestone ? (



              <div className="mt-2 flex items-end justify-between gap-4">



                <div>



                  <p className="text-xl font-black">



                    {engine.nextMilestone.name}



                  </p>



                  <p className="mt-1 text-sm text-slate-500">



                    brakuje {formatMoney(engine.amountToNextMilestone)}



                  </p>



                </div>



                <p className="text-right text-sm font-bold text-blue-400">



                  {engine.monthsToNextMilestone !== null



                    ? `\\\~${formatMonths(engine.monthsToNextMilestone)}`



                    : "—"}



                </p>



              </div>



            ) : (



              <p className="mt-2 text-lg font-black text-emerald-400">



                {ui("Wszystkie kamienie milowe osiągnięte.", "All milestones reached.")}



              </p>



            )}



          </div>



        </div>







        <div className="rounded-3xl border border-slate-800 bg-[#0b1322] p-7">



          <div className="flex items-center gap-2">



            <Sparkles size={20} className="text-amber-400" />



            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">



              Engine insights



            </p>



          </div>



          <div className="mt-6 space-y-3">



            {engine.intelligence.map((insight, index) => (



              <InsightCard



                key={`${insight.type}-${index}`}



                insight={insight}



              />



            ))}



          </div>



        </div>



      </section>







      <section className="mt-5 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-[#0b1322] to-blue-500/5 p-7">



        <div className="flex items-start gap-4">



          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">



            <BrainCircuit size={23} />



          </div>



          <div>



            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">



              Silnik



            </p>



            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">



              {ui(
                "Wynik jest wskaźnikiem gry FREEDOM, nie ratingiem inwestycyjnym. Projekcja jest liniowa i nie zawiera stóp zwrotu, inflacji, podatków ani zmienności — scenariusze inwestycyjne nadal pozostają w Symulatorze.",
                "The score is a FREEDOM game indicator, not an investment rating. The projection is linear and does not include returns, inflation, taxes or volatility — investment scenarios remain in the Simulator."
              )}



            </p>



          </div>



        </div>



      </section>



    </main>



  );



}







function MoneyRouteCard({
  route,
  index,
}: {
  route: MoneyRoute;
  index: number;
}) {
  const styles = {
    shield: {
      icon: "bg-cyan-500/10 text-cyan-400",
      border: "border-cyan-500/20",
      amount: "text-cyan-400",
      iconNode: <Target size={20} />,
    },
    debt: {
      icon: "bg-amber-500/10 text-amber-400",
      border: "border-amber-500/20",
      amount: "text-amber-400",
      iconNode: <Landmark size={20} />,
    },
    goal: {
      icon: "bg-violet-500/10 text-violet-400",
      border: "border-violet-500/20",
      amount: "text-violet-400",
      iconNode: <Target size={20} />,
    },
    invest: {
      icon: "bg-emerald-500/10 text-emerald-400",
      border: "border-emerald-500/20",
      amount: "text-emerald-400",
      iconNode: <TrendingUp size={20} />,
    },
  }[route.kind];

  return (
    <div className={`rounded-2xl border bg-[#08111f]/70 p-5 ${styles.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.icon}`}>
          {styles.iconNode}
        </div>
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          #{index}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <p className="text-lg font-black">{route.title}</p>
        {route.kind === "goal" && route.priority && (
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-violet-400">
            {route.priority}
          </span>
        )}
        {route.kind === "goal" && route.requiredMonthly !== undefined && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${
              route.fundingStatus === "FUNDED"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {route.fundingStatus === "FUNDED" ? "ON TRACK" : "SHORTFALL"}
          </span>
        )}
        {route.kind === "debt" && route.interestRate !== undefined && (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-400">
            {route.interestRate.toLocaleString("pl-PL")}% • {route.debtAction}
          </span>
        )}
      </div>
      <p className={`mt-2 text-3xl font-black ${styles.amount}`}>
        {formatMoney(route.amount)}
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{route.reason}</p>
    </div>
  );
}


function ScoreComponent({ component }: { component: FreedomScoreComponent }) {



  const percent =



    component.maxScore > 0



      ? (component.score / component.maxScore) * 100



      : 0;







  return (



    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">



      <div className="flex items-start justify-between gap-3">



        <div>



          <p className="text-sm font-black">{component.label}</p>



          <p className="mt-1 text-xs text-slate-600">



            {component.explanation}



          </p>



        </div>



        <p className="shrink-0 text-sm font-black text-blue-400">



          {component.score.toFixed(1)} / {component.maxScore}



        </p>



      </div>



      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">



        <div



          className="h-full rounded-full bg-blue-500"



          style={{ width: `${percent}%` }}



        />



      </div>



    </div>



  );



}







function MetricCard({



  icon,



  label,



  value,



  sub,



  positive,



}: {



  icon: ReactNode;



  label: string;



  value: string;



  sub: string;



  positive?: boolean;



}) {



  return (



    <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-5">



      <div className="flex items-center justify-between">



        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">



          {icon}



        </div>



        {positive !== undefined && (



          <span



            className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${



              positive



                ? "bg-emerald-500/10 text-emerald-400"



                : "bg-rose-500/10 text-rose-400"



            }`}



          >



            {positive ? "Strong" : "Watch"}



          </span>



        )}



      </div>



      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">



        {label}



      </p>



      <p className="mt-2 text-2xl font-black">{value}</p>



      <p className="mt-1 text-xs text-slate-600">{sub}</p>



    </div>



  );



}







function MiniStat({ label, value }: { label: string; value: string }) {



  return (



    <div className="rounded-2xl bg-slate-900/60 p-4">



      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">



        {label}



      </p>



      <p className="mt-2 text-lg font-black">{value}</p>



    </div>



  );



}







function InsightCard({ insight }: { insight: FreedomInsight }) {



  const config = {



    strength: {



      icon: <Zap size={18} />,



      label: "Siła",



      style: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",



    },



    mission: {



      icon: <Target size={18} />,



      label: "Mission",



      style: "border-blue-500/20 bg-blue-500/5 text-blue-400",



    },



    projection: {



      icon: <TrendingUp size={18} />,



      label: "Projection",



      style: "border-violet-500/20 bg-violet-500/5 text-violet-400",



    },



    opportunity: {



      icon: <Banknote size={18} />,



      label: "Opportunity",



      style: "border-amber-500/20 bg-amber-500/5 text-amber-400",



    },



  }[insight.type];







  return (



    <div className={`rounded-2xl border p-5 ${config.style}`}>



      <div className="flex items-center gap-2">



        {config.icon}



        <p className="text-[10px] font-black uppercase tracking-[0.18em]">



          {config.label}



        </p>



      </div>



      <p className="mt-3 font-black text-white">{insight.title}</p>



      <p className="mt-1 text-sm leading-6 text-slate-400">



        {insight.text}



      </p>



    </div>



  );



}







function MissionCard({
  mission,
  focused,
  onFocus,
}: {
  mission: FreedomMission;
  focused: boolean;
  onFocus: () => void;
}) {
  const { language } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const style = missionAccentStyles[mission.accent];
  const complete = mission.status === "COMPLETE";

  return (
    <div className={`group relative overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_18px_55px_rgba(8,145,178,0.10)] ${focused ? "ring-2 ring-cyan-400/40" : ""} ${style.card}`}>
      {mission.imageUrl && (
        <div className="relative h-32 overflow-hidden border-b border-white/5">
          <img src={mission.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" style={{ objectPosition: mission.imagePosition ?? "center" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09111f] via-transparent to-transparent" />
        </div>
      )}

      {focused && (
        <div className="absolute right-0 top-0 z-10 rounded-bl-xl bg-cyan-500 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-950">Primary</div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.icon}`}>{mission.icon}</div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-slate-700/70 bg-slate-950/40 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{mission.source}</span>
            <PriorityBadge priority={mission.priority} complete={complete} />
          </div>
        </div>

        <p className="mt-5 text-lg font-black">{mission.title}</p>
        <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{mission.description}</p>

        <div className="mt-5 flex items-end justify-between gap-3 text-xs">
          <span className="text-slate-500">{formatMissionValue(mission.current, mission.unit)}</span>
          <span className={`font-black ${style.text}`}>{complete ? ui("UKOŃCZONE", "COMPLETE") : formatMissionValue(mission.target, mission.unit)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-all duration-700 ${style.bar}`} style={{ width: `${mission.progress}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-600">{mission.footer}</p>
          <p className={`shrink-0 text-xs font-black ${style.text}`}>{mission.progress.toFixed(0)}%</p>
        </div>

        {!complete && (
          <button
            type="button"
            onClick={onFocus}
            className={`mt-5 w-full cursor-pointer rounded-xl border px-4 py-2.5 text-xs font-black transition ${focused ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15" : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300"}`}
          >
            {focused ? ui("✓ Główna misja", "✓ Primary mission") : ui("Ustaw jako fokus", "Set as focus")}
          </button>
        )}
      </div>
    </div>
  );
}

function PriorityBadge({

  priority,

  complete,

}: {

  priority: MissionPriority;

  complete: boolean;

}) {

  if (complete) {

    return (

      <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">

        Complete

      </span>

    );

  }



  const style = {

    CRITICAL: "bg-rose-500/10 text-rose-400",

    HIGH: "bg-amber-500/10 text-amber-400",

    MEDIUM: "bg-violet-500/10 text-violet-400",

    GROWTH: "bg-blue-500/10 text-blue-400",

  }[priority];



  return (

    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${style}`}>

      {priority}

    </span>

  );

}



const missionAccentStyles = {

  rose: {

    card: "border-rose-500/25 bg-rose-500/5",

    icon: "bg-rose-500/10 text-rose-400",

    text: "text-rose-400",

    bar: "bg-rose-500",

  },

  amber: {

    card: "border-amber-500/25 bg-amber-500/5",

    icon: "bg-amber-500/10 text-amber-400",

    text: "text-amber-400",

    bar: "bg-amber-500",

  },

  blue: {

    card: "border-blue-500/25 bg-blue-500/5",

    icon: "bg-blue-500/10 text-blue-400",

    text: "text-blue-400",

    bar: "bg-blue-500",

  },

  cyan: {

    card: "border-cyan-500/25 bg-cyan-500/5",

    icon: "bg-cyan-500/10 text-cyan-400",

    text: "text-cyan-400",

    bar: "bg-cyan-500",

  },

  violet: {

    card: "border-violet-500/25 bg-violet-500/5",

    icon: "bg-violet-500/10 text-violet-400",

    text: "text-violet-400",

    bar: "bg-violet-500",

  },

  emerald: {

    card: "border-emerald-500/25 bg-emerald-500/5",

    icon: "bg-emerald-500/10 text-emerald-400",

    text: "text-emerald-400",

    bar: "bg-emerald-500",

  },

};



function formatMissionValue(value: number, unit: FreedomMission["unit"]) {

  if (unit === "money") return formatMoney(value);

  if (unit === "percent") return `${value.toFixed(1)}%`;



  return Math.round(value).toLocaleString("pl-PL");

}



function formatMoney(value: number) {



  return `${Math.round(value).toLocaleString("pl-PL")} zł`;



}







function formatSignedMoney(value: number) {



  const prefix = value >= 0 ? "+" : "";



  return `${prefix}${Math.round(value).toLocaleString("pl-PL")} zł`;



}







function formatCompactMoney(value: number) {



  if (value >= 1_000_000) {



    return `${(value / 1_000_000).toLocaleString("pl-PL", {



      maximumFractionDigits: 1,



    })}M`;



  }



  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;



  return `${value}`;



}







function formatMonths(months: number) {



  if (months < 12) return `${months} mies.`;



  const years = Math.floor(months / 12);



  const rest = months % 12;



  return rest > 0 ? `${years} lat ${rest} mies.` : `${years} lat`;



}







function formatYears(years: number) {



  return formatMonths(Math.round(years * 12));



}
