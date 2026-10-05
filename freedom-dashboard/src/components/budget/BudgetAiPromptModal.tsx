import { useMemo, useState, type ReactNode } from "react";
import { Check, ClipboardCopy, PiggyBank, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";

import type { Category, CategoryGroup } from "../../types/Category";
import type { Expense, Income, MonthlyBudget } from "../../types/Cashflow";
import type { MonthlyBudgetPlan } from "../../types/Budget";

type PromptMode = "AMOUNT" | "PERCENT";
type PeriodMonths = 1 | 3 | 6 | 12;

type BudgetAiPromptModalProps = {
  budget: MonthlyBudget;
  categories: Category[];
  anchorMonth: string;
  currentPlan?: MonthlyBudgetPlan;
  onClose: () => void;
};

const PERIOD_OPTIONS: { value: PeriodMonths; label: string; description: string }[] = [
  { value: 1, label: "1 miesiąc", description: "Tylko wybrany miesiąc" },
  { value: 3, label: "3 miesiące", description: "Krótki trend" },
  { value: 6, label: "6 miesięcy", description: "Pół roku" },
  { value: 12, label: "12 miesięcy", description: "Pełny rok" },
];

const GROUP_LABELS: Record<string, string> = {
  FIXED: "Koszty stałe",
  LIVING: "Życie",
  HEALTH: "Zdrowie",
  GROWTH: "Rozwój",
  LIFESTYLE: "Lifestyle",
  WEALTH: "Majątek / inwestycje",
  GOALS: "Cele",
  INCOME: "Dochody",
  OTHER: "Inne",
};

export function BudgetAiPromptModal({
  budget,
  categories,
  anchorMonth,
  currentPlan,
  onClose,
}: BudgetAiPromptModalProps) {
  const [mode, setMode] = useState<PromptMode>("AMOUNT");
  const [months, setMonths] = useState<PeriodMonths>(3);
  const [copied, setCopied] = useState(false);

  const rangeMonths = useMemo(() => getMonthRange(anchorMonth, months), [anchorMonth, months]);
  const monthSet = useMemo(() => new Set(rangeMonths), [rangeMonths]);

  const incomes = useMemo(
    () => budget.incomes.filter((item) => monthSet.has(transactionMonth(item.date))),
    [budget.incomes, monthSet]
  );

  const expenses = useMemo(
    () => budget.expenses.filter((item) => monthSet.has(transactionMonth(item.date))),
    [budget.expenses, monthSet]
  );

  const prompt = useMemo(
    () =>
      buildBudgetPrompt({
        mode,
        rangeMonths,
        incomes,
        expenses,
        categories,
        currentPlan,
        anchorMonth,
      }),
    [mode, rangeMonths, incomes, expenses, categories, currentPlan, anchorMonth]
  );

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const avgIncome = totalIncome / Math.max(rangeMonths.length, 1);
  const avgExpenses = totalExpenses / Math.max(rangeMonths.length, 1);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020610]/85 p-3 backdrop-blur-md sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-emerald-500/20 bg-[#081321] shadow-[0_30px_120px_rgba(0,0,0,.75)]">
        <div className="flex items-start justify-between gap-5 border-b border-slate-800/90 bg-[#0a1525] px-5 py-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300 shadow-[0_10px_35px_rgba(16,185,129,.12)]">
              <PiggyBank size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-400">Budget AI</p>
              <h2 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Prompt do zaprojektowania budżetu
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Freedom przygotuje historię wydatków i wymusi trzy gotowe warianty limitów kategorii.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 text-slate-500 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            aria-label="Zamknij"
          >
            <X size={19} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-b border-slate-800 bg-slate-950/25 p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Historia do analizy</p>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMonths(option.value)}
                    className={`cursor-pointer rounded-xl border px-3.5 py-3 text-left transition ${
                      months === option.value
                        ? "border-emerald-400/40 bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,.05)]"
                        : "border-slate-800 bg-slate-900/45 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <span className={`block text-xs font-black ${months === option.value ? "text-emerald-300" : "text-slate-300"}`}>
                      {option.label}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-600">{option.description}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-600">
                Zakres kończy się na <strong className="text-slate-400">{formatMonth(anchorMonth)}</strong>.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Tryb danych</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("AMOUNT")}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-left transition ${
                    mode === "AMOUNT"
                      ? "border-emerald-400/35 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-900/45 hover:border-slate-700"
                  }`}
                >
                  <span className={`block text-xs font-black ${mode === "AMOUNT" ? "text-emerald-300" : "text-slate-400"}`}>
                    Kwoty PLN
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-slate-600">Gotowe limity w PLN.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("PERCENT")}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-left transition ${
                    mode === "PERCENT"
                      ? "border-violet-400/35 bg-violet-500/10"
                      : "border-slate-800 bg-slate-900/45 hover:border-slate-700"
                  }`}
                >
                  <span className={`block text-xs font-black ${mode === "PERCENT" ? "text-violet-300" : "text-slate-400"}`}>
                    Procenty
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-slate-600">Bez ujawniania kwot.</span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <MetricCard label="Przychody" value={String(incomes.length)} tone="emerald" icon={<TrendingUp size={15} />} />
              <MetricCard label="Wydatki" value={String(expenses.length)} tone="rose" icon={<TrendingDown size={15} />} />
            </div>

            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">Średni miesiąc</p>
              {mode === "AMOUNT" ? (
                <div className="mt-3 space-y-1.5 text-[10px] text-slate-500">
                  <div className="flex justify-between gap-3">
                    <span>Przychody</span>
                    <strong className="text-emerald-300">{money(avgIncome)}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Wydatki</span>
                    <strong className="text-rose-300">{money(avgExpenses)}</strong>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-slate-800 pt-1.5">
                    <span>Nadwyżka</span>
                    <strong className={avgIncome - avgExpenses >= 0 ? "text-sky-300" : "text-amber-300"}>
                      {money(avgIncome - avgExpenses)}
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[10px] leading-4 text-violet-300/80">
                  Prompt używa wyłącznie udziałów procentowych, dynamiki i relacji między kategoriami.
                </p>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-emerald-300">
                <Sparkles size={14} /> 3 warianty
              </div>
              <div className="mt-2 space-y-1 text-[10px] leading-4 text-slate-500">
                <p><strong className="text-slate-300">Konserwatywny</strong> — komfort i duży bufor.</p>
                <p><strong className="text-slate-300">Średni</strong> — balans życia i oszczędzania.</p>
                <p><strong className="text-slate-300">Agresywny</strong> — maksymalizacja nadwyżki.</p>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-100">Gotowy prompt budżetowy</p>
                <p className="mt-1 text-[10px] text-slate-600">
                  AI ma zwrócić limity z dokładnymi nazwami kategorii Freedom, gotowe do przepisania do planu.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void copyPrompt()}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition ${
                  copied
                    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/45 hover:bg-emerald-500/15"
                }`}
              >
                {copied ? <Check size={15} /> : <ClipboardCopy size={15} />}
                {copied ? "Skopiowano" : "Skopiuj prompt"}
              </button>
            </div>

            <textarea
              readOnly
              value={prompt}
              spellCheck={false}
              className="min-h-[430px] flex-1 resize-none rounded-2xl border border-slate-800 bg-[#050c17] p-4 font-mono text-[11px] leading-5 text-slate-300 outline-none selection:bg-emerald-500/30 sm:p-5"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone, icon }: { label: string; value: string; tone: "emerald" | "rose"; icon: ReactNode }) {
  const cls = tone === "emerald"
    ? "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-300"
    : "border-rose-500/15 bg-rose-500/[0.06] text-rose-300";

  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.12em] opacity-70">
        {icon}{label}
      </div>
      <div className="mt-1.5 text-lg font-black">{value}</div>
    </div>
  );
}

type BuildPromptArgs = {
  mode: PromptMode;
  rangeMonths: string[];
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  currentPlan?: MonthlyBudgetPlan;
  anchorMonth: string;
};

type CategoryStats = {
  key: string;
  categoryName: string;
  group: string;
  total: number;
  average: number;
  median: number;
  min: number;
  max: number;
  activeMonths: number;
  count: number;
  recurringCount: number;
  monthAmounts: Map<string, number>;
};

function buildBudgetPrompt({ mode, rangeMonths, incomes, expenses, categories, currentPlan, anchorMonth }: BuildPromptArgs) {
  const amountMode = mode === "AMOUNT";
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const monthCount = Math.max(rangeMonths.length, 1);
  const averageIncome = totalIncome / monthCount;
  const averageExpenses = totalExpenses / monthCount;
  const categoryStats = buildCategoryStats(expenses, rangeMonths);
  const lines: string[] = [];

  lines.push("Jesteś doświadczonym planistą budżetu domowego. Na podstawie historii moich rzeczywistych przychodów i wydatków zaproponuj realistyczny miesięczny budżet. Odpowiedz po polsku.");
  lines.push("");
  lines.push("CEL");
  lines.push("Chcę ustawić limity kategorii w aplikacji Freedom Engine. Nie chcę jednego arbitralnego budżetu. Przygotuj trzy kompletne warianty: KONSERWATYWNY, ŚREDNI i AGRESYWNY, żebym mógł wybrać wariant pasujący do aktualnej sytuacji życiowej.");
  lines.push("");
  lines.push("ZNACZENIE WARIANTÓW");
  lines.push("- KONSERWATYWNY: utrzymuje komfort życia, zostawia większy margines na nieregularne koszty i wymaga niewielkich zmian zachowania.");
  lines.push("- ŚREDNI: rozsądny balans między jakością życia, bezpieczeństwem i zwiększaniem nadwyżki.");
  lines.push("- AGRESYWNY: świadomie mocno ogranicza wydatki elastyczne, aby maksymalizować oszczędzanie/inwestowanie, ale nie może ciąć kosztów koniecznych do nierealistycznych poziomów.");
  lines.push("");
  lines.push("WAŻNE ZASADY");
  if (amountMode) {
    lines.push("- Dane zawierają rzeczywiste kwoty PLN. Wszystkie rekomendowane limity podaj w PLN.");
  } else {
    lines.push("- Ta wersja celowo nie zawiera kwot. Operuj udziałami procentowymi przychodu oraz udziałami w budżecie i nie próbuj odgadywać wartości PLN.");
  }
  lines.push("- Nie traktuj jednorazowego dużego wydatku jako miesięcznej normy. Wykorzystuj historię miesiąc po miesiącu, medianę, średnią i częstotliwość.");
  lines.push("- Wydatki inwestycyjne, cele oszczędnościowe i transfery kapitału oceń oddzielnie od konsumpcji. Nie obcinaj ich automatycznie tylko dlatego, że są wysokie.");
  lines.push("- Podatki, ZUS, raty, czynsz/wspólnota, podstawowe zdrowie i inne koszty obligatoryjne nie mogą być sztucznie redukowane bez danych, że są negocjowalne.");
  lines.push("- Dla kategorii nieregularnych możesz zaproponować miesięczny fundusz/sinking fund zamiast limitu równego pojedynczemu wysokiemu miesiącowi.");
  lines.push("- Jeżeli danych jest mało albo kategoria wystąpiła tylko raz, zaznacz niską pewność rekomendacji.");
  lines.push("- Nie twórz nowych kategorii. W tabeli końcowej użyj dokładnie nazw kategorii Freedom podanych poniżej.");
  lines.push("- Każdy wariant musi być matematycznie spójny: suma limitów kategorii + bufor + planowana nadwyżka nie może przekraczać zakładanego miesięcznego dochodu.");
  lines.push("");
  lines.push(`ZAKRES DANYCH: ${rangeMonths.length} mies., ${formatMonth(rangeMonths[0])} – ${formatMonth(rangeMonths[rangeMonths.length - 1])}.`);
  if (anchorMonth === currentMonth()) {
    lines.push("UWAGA: ostatni miesiąc może być niepełny. Nie traktuj jego dotychczasowych przychodów ani wydatków jako pełnego miesiąca bez zaznaczenia tego ograniczenia.");
  }

  lines.push("");
  lines.push("TREND MIESIĘCZNY");
  for (const month of rangeMonths) {
    const monthIncome = incomes.filter((item) => transactionMonth(item.date) === month).reduce((sum, item) => sum + item.amount, 0);
    const monthExpenses = expenses.filter((item) => transactionMonth(item.date) === month).reduce((sum, item) => sum + item.amount, 0);
    if (amountMode) {
      lines.push(`- ${formatMonth(month)}: przychody ${money(monthIncome)} | wydatki ${money(monthExpenses)} | bilans ${money(monthIncome - monthExpenses)}`);
    } else {
      const expenseShare = monthIncome > 0 ? (monthExpenses / monthIncome) * 100 : 0;
      lines.push(`- ${formatMonth(month)}: wydatki = ${pct(expenseShare)} przychodów miesiąca | bilans = ${monthIncome > 0 ? pct(((monthIncome - monthExpenses) / monthIncome) * 100) : "brak pełnej bazy przychodowej"}`);
    }
  }

  lines.push("");
  lines.push("PODSUMOWANIE TYPOWEGO MIESIĄCA");
  if (amountMode) {
    lines.push(`- średni przychód: ${money(averageIncome)}`);
    lines.push(`- średnie wydatki/alokacje: ${money(averageExpenses)}`);
    lines.push(`- średnia nadwyżka: ${money(averageIncome - averageExpenses)}`);
    lines.push(`- średnia stopa nadwyżki: ${averageIncome > 0 ? pct(((averageIncome - averageExpenses) / averageIncome) * 100) : "brak danych"}`);
  } else {
    lines.push(`- wydatki/alokacje stanowią ${totalIncome > 0 ? pct((totalExpenses / totalIncome) * 100) : "brak danych"} przychodów w analizowanym okresie`);
    lines.push(`- nadwyżka stanowi ${totalIncome > 0 ? pct(((totalIncome - totalExpenses) / totalIncome) * 100) : "brak danych"} przychodów`);
  }

  lines.push("");
  lines.push("KATEGORIE — HISTORIA I ZMIENNOŚĆ");
  if (!categoryStats.length) {
    lines.push("- brak wydatków w analizowanym okresie");
  } else {
    for (const row of categoryStats.sort((a, b) => b.total - a.total)) {
      const history = rangeMonths.map((month) => {
        const value = row.monthAmounts.get(month) ?? 0;
        return amountMode ? `${formatMonthShort(month)} ${money(value)}` : `${formatMonthShort(month)} ${totalExpenses > 0 ? pct((value / totalExpenses) * 100) : "0,0%"}`;
      }).join(" | ");

      if (amountMode) {
        lines.push(`- ${row.group} > ${row.categoryName}: średnia ${money(row.average)} / mies. | mediana ${money(row.median)} | min ${money(row.min)} | max ${money(row.max)} | aktywne ${row.activeMonths}/${monthCount} mies. | ${row.count} transakcji (${row.recurringCount} oznaczonych cyklicznie) | historia: ${history}`);
      } else {
        lines.push(`- ${row.group} > ${row.categoryName}: ${totalExpenses > 0 ? pct((row.total / totalExpenses) * 100) : "0,0%"} wszystkich wydatków | aktywne ${row.activeMonths}/${monthCount} mies. | ${row.count} transakcji | historia udziału: ${history}`);
      }
    }
  }

  lines.push("");
  lines.push("AKTYWNE KATEGORIE FREEDOM — UŻYJ DOKŁADNIE TYCH NAZW W TABELI KOŃCOWEJ");
  const sortedCategories = categories.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pl"));
  for (const category of sortedCategories) {
    const observed = categoryStats.some((row) => row.categoryName.toLocaleLowerCase("pl-PL") === category.name.toLocaleLowerCase("pl-PL"));
    lines.push(`- ${groupLabel(category.group)} > ${category.name}${observed ? "" : " | brak wydatków w wybranym okresie"}`);
  }

  if (currentPlan?.limits?.length) {
    lines.push("");
    lines.push(`OBECNY PLAN DLA ${formatMonth(currentPlan.month).toUpperCase()}`);
    for (const limit of currentPlan.limits) {
      const name = limit.categoryName ?? String(limit.category ?? "Kategoria");
      if (amountMode) {
        lines.push(`- ${name}: limit ${money(limit.limit)}`);
      } else {
        const total = currentPlan.limits.reduce((sum, item) => sum + item.limit, 0);
        lines.push(`- ${name}: ${total > 0 ? pct((limit.limit / total) * 100) : "0,0%"} planu`);
      }
    }
    lines.push("Obecny plan jest tylko punktem odniesienia. Jeśli historia wskazuje, że jest nierealistyczny, zaproponuj zmianę.");
  }

  lines.push("");
  lines.push("ISTOTNE TRANSAKCJE — DO ROZPOZNANIA WYDATKÓW JEDNORAZOWYCH");
  const topExpenses = expenses.slice().sort((a, b) => b.amount - a.amount).slice(0, Math.min(40, expenses.length));
  for (const item of topExpenses) {
    const category = item.categoryName?.trim() || "Bez szczegółowej kategorii";
    if (amountMode) {
      lines.push(`- ${formatDate(item.date)} | ${category} | ${item.name} | ${money(item.amount)} | ${item.recurring ? "cykliczny" : "jednorazowy"}`);
    } else {
      lines.push(`- ${formatDate(item.date)} | ${category} | ${item.name} | ${totalExpenses > 0 ? pct((item.amount / totalExpenses) * 100) : "0,0%"} wydatków okresu | ${item.recurring ? "cykliczny" : "jednorazowy"}`);
    }
  }

  lines.push("");
  lines.push("ODPOWIEDŹ PRZYGOTUJ W TEJ STRUKTURZE");
  lines.push("1. Diagnoza — krótko oceń, czy historyczny poziom wydatków jest stabilny i które miesiące są anomaliami.");
  lines.push("2. Założenia dochodowe — wskaż, jaki miesięczny dochód bazowy przyjmujesz do budżetu i dlaczego. Nie opieraj budżetu na jednorazowych wpływach.");
  lines.push("3. Koszty nieelastyczne — wskaż kategorie, których limity powinny wynikać głównie z realnego kosztu, a nie z chęci oszczędzania.");
  lines.push("4. Koszty elastyczne — wskaż kategorie, gdzie limity mogą realnie sterować zachowaniem.");
  lines.push("5. Nieregularne duże koszty — zaproponuj miesięczne sinking funds / rezerwy zamiast ignorowania ich albo zawyżania każdego miesiąca.");
  lines.push("6. Wariant KONSERWATYWNY — opisz dla kogo jest sensowny i jaki bufor bezpieczeństwa daje.");
  lines.push("7. Wariant ŚREDNI — opisz balans między komfortem a wzrostem nadwyżki.");
  lines.push("8. Wariant AGRESYWNY — opisz kompromisy i ryzyka zbyt mocnego cięcia.");
  lines.push("9. Rekomendacja — wskaż, który wariant wybrałbyś na podstawie samych danych i jakie informacje życiowe mogłyby zmienić wybór.");

  if (amountMode) {
    lines.push("10. OBOWIĄZKOWA TABELA 'GOTOWE LIMITY DO FREEDOM': KATEGORIA | HISTORYCZNA ŚREDNIA PLN | KONSERWATYWNY PLN/MIES. | ŚREDNI PLN/MIES. | AGRESYWNY PLN/MIES. | UZASADNIENIE. Użyj dokładnie nazw kategorii Freedom. Dla aktywnej kategorii, której nie trzeba budżetować, wpisz 0 PLN i wyjaśnij dlaczego.");
    lines.push("11. PODSUMOWANIE WARIANTÓW: dla każdego wariantu podaj SUMĘ LIMITÓW PLN, BUFOR PLN, PLANOWANĄ NADWYŻKĘ PLN/MIES., STOPĘ OSZCZĘDNOŚCI % oraz ROCZNY POTENCJAŁ NADWYŻKI PLN.");
    lines.push("12. Na końcu dodaj blok 'DO PRZEPISANIA DO APLIKACJI' zawierający trzy osobne, krótkie listy w formacie 'Nazwa kategorii = X PLN' — bez dodatkowego komentarza pomiędzy pozycjami.");
  } else {
    lines.push("10. OBOWIĄZKOWA TABELA 'GOTOWE LIMITY DO FREEDOM': KATEGORIA | OBECNY UDZIAŁ | KONSERWATYWNY % DOCHODU | ŚREDNI % DOCHODU | AGRESYWNY % DOCHODU | UZASADNIENIE. Nie podawaj kwot.");
    lines.push("11. PODSUMOWANIE WARIANTÓW: dla każdego wariantu podaj SUMĘ LIMITÓW jako % dochodu, BUFOR jako % dochodu, PLANOWANĄ STOPĘ OSZCZĘDNOŚCI oraz zmianę względem historii w punktach procentowych.");
    lines.push("12. Na końcu dodaj blok 'DO PRZEPISANIA DO APLIKACJI' z trzema listami w formacie 'Nazwa kategorii = X% dochodu'. Nie podawaj żadnych kwot.");
  }

  lines.push("");
  lines.push("Najważniejsze: budżet ma być wykonalny. Nie proponuj limitu niższego od kosztu obowiązkowego tylko po to, aby matematycznie poprawić stopę oszczędności. Jednocześnie nie kopiuj bezmyślnie historycznych wydatków — budżet ma świadomie zmieniać zachowanie tam, gdzie jest to realne.");

  return lines.join("\n");
}

function buildCategoryStats(expenses: Expense[], rangeMonths: string[]): CategoryStats[] {
  const rows = new Map<string, CategoryStats>();

  for (const item of expenses) {
    const categoryName = item.categoryName?.trim() || legacyGroupName(item.category);
    const group = item.categoryGroup?.trim() ? groupLabel(item.categoryGroup) : legacyGroupName(item.category);
    const key = `${group}::${categoryName.toLocaleLowerCase("pl-PL")}`;
    const row = rows.get(key) ?? {
      key,
      categoryName,
      group,
      total: 0,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      activeMonths: 0,
      count: 0,
      recurringCount: 0,
      monthAmounts: new Map<string, number>(),
    };

    row.total += item.amount;
    row.count += 1;
    if (item.recurring) row.recurringCount += 1;
    const month = transactionMonth(item.date);
    row.monthAmounts.set(month, (row.monthAmounts.get(month) ?? 0) + item.amount);
    rows.set(key, row);
  }

  for (const row of rows.values()) {
    const monthValues = rangeMonths.map((month) => row.monthAmounts.get(month) ?? 0);
    const sorted = monthValues.slice().sort((a, b) => a - b);
    row.average = row.total / Math.max(rangeMonths.length, 1);
    row.median = median(sorted);
    row.min = sorted[0] ?? 0;
    row.max = sorted[sorted.length - 1] ?? 0;
    row.activeMonths = monthValues.filter((value) => value > 0).length;
  }

  return [...rows.values()];
}

function median(values: number[]) {
  if (!values.length) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2 : values[middle] ?? 0;
}

function getMonthRange(anchorMonth: string, months: PeriodMonths) {
  const [year, month] = anchorMonth.split("-").map(Number);
  const result: string[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, month - 1 - offset, 1);
    result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

function transactionMonth(date?: string) {
  return date?.slice(0, 7) || currentMonth();
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

function formatMonthShort(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });
}

function formatDate(date?: string) {
  if (!date) return "brak daty";
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}.${month}.${year}` : date;
}

function groupLabel(group: CategoryGroup | string) {
  return GROUP_LABELS[group] ?? group;
}

function legacyGroupName(category?: Expense["category"]) {
  if (category === "fixed") return "Koszty stałe";
  if (category === "investment") return "Majątek / inwestycje";
  if (category === "goal") return "Cele";
  return "Życie";
}

function money(value: number) {
  return `${value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`;
}

function pct(value: number) {
  return `${value.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
