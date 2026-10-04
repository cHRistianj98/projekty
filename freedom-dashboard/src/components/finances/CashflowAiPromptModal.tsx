import { useMemo, useState, type ReactNode } from "react";
import { Check, ClipboardCopy, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";

import type { Expense, ExpenseCategory, Income, MonthlyBudget } from "../../types/Cashflow";

type PromptMode = "AMOUNT" | "PERCENT";
type PeriodMonths = 1 | 3 | 6 | 12;

type CashflowAiPromptModalProps = {
  budget: MonthlyBudget;
  anchorMonth: string;
  onClose: () => void;
};

const PERIOD_OPTIONS: { value: PeriodMonths; label: string; description: string }[] = [
  { value: 1, label: "1 miesiąc", description: "Tylko obecnie wybrany miesiąc" },
  { value: 3, label: "3 miesiące", description: "Krótki trend" },
  { value: 6, label: "6 miesięcy", description: "Pół roku" },
  { value: 12, label: "12 miesięcy", description: "Pełny rok" },
];

const EXPENSE_GROUP_LABELS: Record<ExpenseCategory, string> = {
  fixed: "Koszty stałe",
  living: "Życie",
  investment: "Inwestycje",
  goal: "Cele",
};

export function CashflowAiPromptModal({ budget, anchorMonth, onClose }: CashflowAiPromptModalProps) {
  const [mode, setMode] = useState<PromptMode>("AMOUNT");
  const [months, setMonths] = useState<PeriodMonths>(1);
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
    () => buildCashflowPrompt({ mode, rangeMonths, incomes, expenses }),
    [mode, rangeMonths, incomes, expenses]
  );

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const net = totalIncome - totalExpenses;

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
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-blue-500/25 bg-[#081321] shadow-[0_30px_120px_rgba(0,0,0,.78)]">
        <div className="flex items-start justify-between gap-5 border-b border-slate-800/90 bg-[#0a1525] px-5 py-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blue-400/25 bg-blue-500/10 text-blue-300 shadow-[0_10px_35px_rgba(59,130,246,.12)]">
              <Sparkles size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-400">Cashflow AI</p>
              <h2 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Prompt do analizy przychodów i wydatków
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Freedom niczego nie wysyła do AI. Generuje gotowy prompt do skopiowania.
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
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">
                Zakres analizy
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMonths(option.value)}
                    className={`cursor-pointer rounded-xl border px-3.5 py-3 text-left transition ${
                      months === option.value
                        ? "border-blue-400/40 bg-blue-500/10 shadow-[inset_0_0_20px_rgba(59,130,246,.05)]"
                        : "border-slate-800 bg-slate-900/45 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <span
                      className={`block text-xs font-black ${
                        months === option.value ? "text-blue-300" : "text-slate-300"
                      }`}
                    >
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
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">
                Tryb danych
              </p>

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
                  <span
                    className={`block text-xs font-black ${
                      mode === "AMOUNT" ? "text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    Kwoty PLN
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-slate-600">
                    Dokładne oszczędności w PLN.
                  </span>
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
                  <span
                    className={`block text-xs font-black ${
                      mode === "PERCENT" ? "text-violet-300" : "text-slate-400"
                    }`}
                  >
                    Tylko procenty
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-slate-600">
                    Bez ujawniania kwot.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <MetricCard
                label="Przychody"
                value={String(incomes.length)}
                tone="emerald"
                icon={<TrendingUp size={15} />}
              />
              <MetricCard
                label="Wydatki"
                value={String(expenses.length)}
                tone="rose"
                icon={<TrendingDown size={15} />}
              />
            </div>

            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-600">
                Zakres danych
              </p>
              <p className="mt-2 text-xs font-bold capitalize text-slate-300">
                {formatMonth(rangeMonths[0])} – {formatMonth(rangeMonths[rangeMonths.length - 1])}
              </p>

              {mode === "AMOUNT" ? (
                <div className="mt-3 space-y-1.5 text-[10px] text-slate-500">
                  <div className="flex justify-between gap-3">
                    <span>Przychody</span>
                    <strong className="text-emerald-300">{money(totalIncome)}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Wydatki</span>
                    <strong className="text-rose-300">{money(totalExpenses)}</strong>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-slate-800 pt-1.5">
                    <span>Bilans</span>
                    <strong className={net >= 0 ? "text-sky-300" : "text-amber-300"}>
                      {money(net)}
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[10px] leading-4 text-violet-300/80">
                  Z promptu usuwane są wszystkie kwoty. Zostają udziały procentowe i relacje.
                </p>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-100">Gotowy prompt</p>
                <p className="mt-1 text-[10px] text-slate-600">
                  {mode === "AMOUNT"
                    ? "Pełna analiza z konkretnym potencjałem oszczędności w PLN."
                    : "Prywatna wersja procentowa — bez rzeczywistych kwot."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void copyPrompt()}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition ${
                  copied
                    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                    : "border-blue-400/25 bg-blue-500/10 text-blue-300 hover:border-blue-400/45 hover:bg-blue-500/15"
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
              className="min-h-[430px] flex-1 resize-none rounded-2xl border border-slate-800 bg-[#050c17] p-4 font-mono text-[11px] leading-5 text-slate-300 outline-none selection:bg-blue-500/30 sm:p-5"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
  icon: ReactNode;
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-300"
      : "border-rose-500/15 bg-rose-500/[0.06] text-rose-300";

  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.12em] opacity-70">
        {icon}
        {label}
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
};

function buildCashflowPrompt({ mode, rangeMonths, incomes, expenses }: BuildPromptArgs) {
  const amountMode = mode === "AMOUNT";
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const lines: string[] = [];

  lines.push(
    "Jesteś doświadczonym analitykiem budżetu domowego i optymalizacji cashflow. Przeanalizuj moje rzeczywiste przychody i wydatki. Odpowiedz po polsku."
  );
  lines.push("");
  lines.push("CEL ANALIZY");
  lines.push(
    "Chcę wiedzieć, które wydatki są rozsądne i powinny zostać, które są za wysokie, które są nadmiarowe, a których realnie nie da się lub nie powinno się usuwać. Zależy mi na poprawie cashflow bez bezmyślnego cięcia jakości życia, zdrowia, zobowiązań ani sensownych inwestycji."
  );
  lines.push("");
  lines.push("WAŻNE ZASADY");

  if (amountMode) {
    lines.push(
      "- Dane zawierają rzeczywiste kwoty PLN. Podawaj rekomendacje i potencjalne oszczędności w PLN."
    );
    lines.push(
      "- Dla każdej rekomendowanej redukcji policz realistyczną oszczędność miesięczną i roczną. Nie annualizuj jednorazowego wydatku tak, jakby występował co miesiąc."
    );
  } else {
    lines.push(
      "- Celowo nie podaję żadnych kwot. Nie próbuj ich odgadywać ani rekonstruować. Pracuj wyłącznie na procentach i punktach procentowych."
    );
    lines.push(
      "- Potencjalną poprawę pokaż jako spadek udziału wydatków, zmianę udziału kategorii oraz poprawę stopy oszczędności. Nie podawaj kwot PLN."
    );
  }

  lines.push(
    "- Każdy wydatek oceń w kontekście jego nazwy, kategorii, częstotliwości i całej struktury budżetu. Nie oceniaj pozycji tylko dlatego, że nominalnie jest duża."
  );
  lines.push(
    "- Wydatków oznaczonych jako Inwestycje lub Cele nie traktuj automatycznie jako konsumpcji do cięcia. Oceń, czy ich udział jest sensowny dla budowania majątku lub realizacji planów."
  );
  lines.push(
    "- Dla podatków, ZUS, czynszu, rat, leczenia, podstawowego jedzenia i podobnych pozycji odróżnij wydatek konieczny od opcjonalnego. Jeżeli nie masz pewności, użyj werdyktu DO WERYFIKACJI zamiast zgadywać."
  );
  lines.push(
    "- Nie proponuj usunięcia wydatku tylko dlatego, że jest przyjemnością. Oceń koszt względem częstotliwości, skali i wpływu na cashflow."
  );
  lines.push("- Nie wymyślaj subskrypcji ani kosztów, których nie ma w danych.");
  lines.push(
    "- Przychody oceń pod kątem stabilności, koncentracji na jednym źródle i możliwości zwiększenia, ale nie zakładaj możliwości podwyżki bez danych."
  );
  lines.push("");
  lines.push("DLA KAŻDEGO ISTOTNEGO WYDATKU UŻYJ JEDNEGO WERDYKTU");
  lines.push("- ZOSTAJE — poziom wydatku jest rozsądny lub daje adekwatną wartość.");
  lines.push("- OGRANICZ — wydatek ma sens, ale obecny poziom jest za wysoki.");
  lines.push(
    "- NADMIAROWY / DO USUNIĘCIA — mała wartość względem kosztu i realnie można go usunąć."
  );
  lines.push(
    "- KONIECZNY / TRUDNY DO USUNIĘCIA — koszt podstawowy, umowny, zdrowotny, podatkowy lub inny wydatek, którego redukcja jest ograniczona."
  );
  lines.push("- DO WERYFIKACJI — brakuje kontekstu, aby rzetelnie ocenić.");
  lines.push("");
  lines.push(
    `ZAKRES: ${rangeMonths.length} ${
      rangeMonths.length === 1 ? "miesiąc" : rangeMonths.length < 5 ? "miesiące" : "miesięcy"
    }, od ${formatMonth(rangeMonths[0])} do ${formatMonth(rangeMonths[rangeMonths.length - 1])}.`
  );
  lines.push("");

  if (amountMode) {
    const net = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : null;
    lines.push("PODSUMOWANIE CAŁEGO OKRESU");
    lines.push(`- przychody: ${money(totalIncome)}`);
    lines.push(`- wydatki i alokacje: ${money(totalExpenses)}`);
    lines.push(`- bilans: ${money(net)}`);
    lines.push(
      `- stopa oszczędności: ${
        savingsRate == null ? "brak miarodajnych danych" : pct(savingsRate)
      }`
    );
  } else {
    const expenseToIncome = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : null;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null;
    lines.push("PODSUMOWANIE CAŁEGO OKRESU");
    lines.push(
      `- wydatki jako część przychodów: ${
        expenseToIncome == null ? "brak miarodajnych danych" : pct(expenseToIncome)
      }`
    );
    lines.push(
      `- stopa oszczędności: ${
        savingsRate == null ? "brak miarodajnych danych" : pct(savingsRate)
      }`
    );
    lines.push(
      "- struktura przychodów i wydatków poniżej została zanonimizowana do udziałów procentowych."
    );
  }

  lines.push("");
  lines.push("TREND MIESIĘCZNY");

  for (const month of rangeMonths) {
    const monthIncomes = incomes.filter((item) => transactionMonth(item.date) === month);
    const monthExpenses = expenses.filter((item) => transactionMonth(item.date) === month);
    const monthIncome = monthIncomes.reduce((sum, item) => sum + item.amount, 0);
    const monthExpense = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

    if (amountMode) {
      const monthNet = monthIncome - monthExpense;
      const rate = monthIncome > 0 ? (monthNet / monthIncome) * 100 : null;
      lines.push(
        `- ${formatMonth(month)}: przychody ${money(monthIncome)} | wydatki ${money(
          monthExpense
        )} | bilans ${money(monthNet)} | oszczędności ${rate == null ? "—" : pct(rate)}`
      );
    } else {
      const expenseRatio = monthIncome > 0 ? (monthExpense / monthIncome) * 100 : null;
      const rate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : null;
      lines.push(
        `- ${formatMonth(month)}: wydatki ${
          expenseRatio == null ? "—" : pct(expenseRatio)
        } przychodów | stopa oszczędności ${rate == null ? "—" : pct(rate)} | udział miesiąca w wydatkach okresu ${share(
          monthExpense,
          totalExpenses
        )}`
      );
    }
  }

  lines.push("");
  lines.push("STRUKTURA WYDATKÓW WG KATEGORII");
  const categoryRows = aggregateExpenseCategories(expenses).sort((a, b) => b.amount - a.amount);

  if (!categoryRows.length) {
    lines.push("- brak wydatków w tym okresie");
  } else {
    for (const row of categoryRows) {
      if (amountMode) {
        lines.push(
          `- ${row.group} > ${row.name}: ${money(row.amount)} | ${share(
            row.amount,
            totalExpenses
          )} wszystkich wydatków | ${row.count} poz.`
        );
      } else {
        lines.push(
          `- ${row.group} > ${row.name}: ${share(row.amount, totalExpenses)} wszystkich wydatków | ${
            row.count
          } poz.`
        );
      }
    }
  }

  lines.push("");
  lines.push("STRUKTURA PRZYCHODÓW WG ŹRÓDEŁ");
  const incomeRows = aggregateIncomeSources(incomes).sort((a, b) => b.amount - a.amount);

  if (!incomeRows.length) {
    lines.push("- brak przychodów w tym okresie");
  } else {
    for (const row of incomeRows) {
      if (amountMode) {
        lines.push(
          `- ${row.name}: ${money(row.amount)} | ${share(row.amount, totalIncome)} przychodów | ${
            row.count
          } wpływów`
        );
      } else {
        lines.push(
          `- ${row.name}: ${share(row.amount, totalIncome)} przychodów | ${row.count} wpływów`
        );
      }
    }
  }

  lines.push("");
  lines.push("TRANSAKCJE — MIESIĄC PO MIESIĄCU");

  for (const month of [...rangeMonths].reverse()) {
    lines.push("");
    lines.push(`MIESIĄC: ${formatMonth(month).toUpperCase()}`);

    const monthIncomes = incomes
      .filter((item) => transactionMonth(item.date) === month)
      .slice()
      .sort(
        (a, b) =>
          transactionDate(b.date).localeCompare(transactionDate(a.date)) || b.amount - a.amount
      );
    const monthExpenses = expenses
      .filter((item) => transactionMonth(item.date) === month)
      .slice()
      .sort(
        (a, b) =>
          transactionDate(b.date).localeCompare(transactionDate(a.date)) || b.amount - a.amount
      );

    lines.push("PRZYCHODY:");

    if (!monthIncomes.length) {
      lines.push("- brak");
    } else {
      for (const item of monthIncomes) {
        const category = item.categoryName?.trim() || item.categoryGroup?.trim() || "Przychód";
        const frequency = item.recurring ? "powtarzalny" : "jednorazowy";
        const date = formatDate(item.date);

        if (amountMode) {
          lines.push(
            `- ${date} | ${category} | ${item.name} | ${money(item.amount)} | ${frequency}`
          );
        } else {
          lines.push(
            `- ${date} | ${category} | ${item.name} | ${share(
              item.amount,
              totalIncome
            )} przychodów okresu | ${frequency}`
          );
        }
      }
    }

    lines.push("WYDATKI:");

    if (!monthExpenses.length) {
      lines.push("- brak");
    } else {
      const categoryTotals = expenseCategoryTotals(expenses);

      for (const item of monthExpenses) {
        const group = EXPENSE_GROUP_LABELS[item.category];
        const category = expenseCategoryName(item);
        const frequency = item.recurring ? "powtarzalny" : "jednorazowy";
        const date = formatDate(item.date);
        const categoryTotal = categoryTotals.get(expenseCategoryKey(item)) ?? 0;

        if (amountMode) {
          lines.push(
            `- ${date} | ${group} > ${category} | ${item.name} | ${money(
              item.amount
            )} | ${frequency}`
          );
        } else {
          lines.push(
            `- ${date} | ${group} > ${category} | ${item.name} | ${share(
              item.amount,
              totalExpenses
            )} wszystkich wydatków | ${share(item.amount, categoryTotal)} kategorii | ${frequency}`
          );
        }
      }
    }
  }

  lines.push("");
  lines.push("ODPOWIEDŹ PRZYGOTUJ W TEJ STRUKTURZE");
  lines.push(
    "1. Ocena cashflow — czy żyję poniżej możliwości, czy budżet jest napięty, jak stabilne są przychody i co najbardziej obciąża wynik."
  );
  lines.push(
    "2. Przychody — oceń stabilność i koncentrację źródeł; wskaż, gdzie widzisz realną przestrzeń do zwiększenia, ale nie wymyślaj możliwości bez danych."
  );
  lines.push(
    "3. Wydatki konieczne — wskaż pozycje, które realnie powinny zostać i których cięcie byłoby nieracjonalne."
  );
  lines.push(
    "4. Wydatki do ograniczenia — podaj konkretne pozycje i dlaczego obecny poziom jest zbyt wysoki."
  );
  lines.push(
    "5. Wydatki nadmiarowe — wskaż pozycje, które można usunąć przy relatywnie małym koszcie dla jakości życia."
  );
  lines.push(
    "6. Inwestycje i cele — oceń osobno, żeby nie mieszać budowania majątku z konsumpcją."
  );
  lines.push(
    "7. Kategorie — uszereguj kategorie od najbardziej wymagającej optymalizacji do najlepiej zarządzanej."
  );
  lines.push("8. Plan zmian — najpierw łatwe ruchy bez bólu, potem większe kompromisy.");

  if (amountMode) {
    lines.push(
      "9. Realny efekt — policz wariant KONSERWATYWNY i AMBITNY: oszczędność miesięczna, roczna oraz nowa stopa oszczędności. Arytmetyka musi wynikać z danych."
    );
    lines.push(
      "10. Tabela końcowa: WYDATEK / KATEGORIA | WERDYKT | TERAZ PLN | CEL PLN | OSZCZĘDNOŚĆ MIES. PLN | OSZCZĘDNOŚĆ ROCZNA PLN | UZASADNIENIE. Dla jednorazowych pozycji zamiast sztucznej miesięcznej annualizacji zaznacz efekt jednorazowy."
    );
  } else {
    lines.push(
      "9. Realny efekt — policz wariant KONSERWATYWNY i AMBITNY jako procentową redukcję wydatków i zmianę stopy oszczędności w punktach procentowych."
    );
    lines.push(
      "10. Tabela końcowa: WYDATEK / KATEGORIA | WERDYKT | OBECNY UDZIAŁ | DOCELOWY UDZIAŁ | REDUKCJA PP / % | UZASADNIENIE. Nie podawaj żadnych kwot."
    );
  }

  lines.push("");
  lines.push(
    "Nie ograniczaj się do ogólników typu „wydawaj mniej”. Odnoś się do konkretnych nazw i kategorii z danych. Jeżeli jakiś wydatek jest duży, ale konieczny lub jednorazowy, powiedz to wprost. Jeżeli dane są zbyt krótkie, aby uznać coś za stały wzorzec, zaznacz to."
  );

  return lines.join("\n");
}

function aggregateExpenseCategories(expenses: Expense[]) {
  const rows = new Map<
    string,
    { group: string; name: string; amount: number; count: number }
  >();

  for (const item of expenses) {
    const key = expenseCategoryKey(item);
    const row = rows.get(key) ?? {
      group: EXPENSE_GROUP_LABELS[item.category],
      name: expenseCategoryName(item),
      amount: 0,
      count: 0,
    };
    row.amount += item.amount;
    row.count += 1;
    rows.set(key, row);
  }

  return [...rows.values()];
}

function aggregateIncomeSources(incomes: Income[]) {
  const rows = new Map<string, { name: string; amount: number; count: number }>();

  for (const item of incomes) {
    const name = item.categoryName?.trim() || item.categoryGroup?.trim() || item.name || "Przychód";
    const key = name.toLocaleLowerCase("pl-PL");
    const row = rows.get(key) ?? { name, amount: 0, count: 0 };
    row.amount += item.amount;
    row.count += 1;
    rows.set(key, row);
  }

  return [...rows.values()];
}

function expenseCategoryTotals(expenses: Expense[]) {
  const result = new Map<string, number>();

  for (const item of expenses) {
    const key = expenseCategoryKey(item);
    result.set(key, (result.get(key) ?? 0) + item.amount);
  }

  return result;
}

function expenseCategoryKey(item: Expense) {
  return `${item.category}::${expenseCategoryName(item).toLocaleLowerCase("pl-PL")}`;
}

function expenseCategoryName(item: Expense) {
  return item.categoryName?.trim() || EXPENSE_GROUP_LABELS[item.category];
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

function transactionDate(date?: string) {
  return date ?? "";
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(date?: string) {
  if (!date) return "brak daty";

  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}.${month}.${year}` : date;
}

function money(value: number) {
  return `${value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} PLN`;
}

function pct(value: number) {
  return `${value.toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function share(value: number, total: number) {
  return total > 0 ? pct((value / total) * 100) : "0,0%";
}
