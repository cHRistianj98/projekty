import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const modalInputClass =
  "w-full rounded-2xl border border-slate-700/80 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-slate-600 focus:ring-2";

const accentMap = {
  emerald: {
    border: "focus:border-emerald-400 focus:ring-emerald-500/15",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    selected: "bg-emerald-500 text-slate-950",
    today: "border-emerald-400/40 text-emerald-300",
    hover: "hover:border-emerald-500/40 hover:bg-emerald-500/10",
  },
  blue: {
    border: "focus:border-cyan-400 focus:ring-cyan-500/15",
    badge: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    selected: "bg-cyan-400 text-slate-950",
    today: "border-cyan-400/40 text-cyan-300",
    hover: "hover:border-cyan-500/40 hover:bg-cyan-500/10",
  },
  violet: {
    border: "focus:border-violet-400 focus:ring-violet-500/15",
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    selected: "bg-violet-400 text-slate-950",
    today: "border-violet-400/40 text-violet-300",
    hover: "hover:border-violet-500/40 hover:bg-violet-500/10",
  },
} as const;

type Accent = keyof typeof accentMap;

const MONTHS_PL = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

const WEEKDAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Zamknij"
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
    >
      <X size={18} />
    </button>
  );
}

export function MoneyInput({
  value,
  onChange,
  accent = "blue",
  currency = "PLN",
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  accent?: Accent;
  currency?: string;
  placeholder?: string;
}) {
  const theme = accentMap[accent];
  return (
    <div className="relative">
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${modalInputClass} freedom-number-input pr-24 text-lg font-semibold tracking-[0.01em] ${theme.border}`}
      />
      <span
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${theme.badge}`}
      >
        {currency}
      </span>
    </div>
  );
}

export function DateInput({
  value,
  onChange,
  accent = "blue",
}: {
  value: string;
  onChange: (value: string) => void;
  accent?: Accent;
}) {
  const theme = accentMap[accent];
  const rootRef = useRef<HTMLDivElement>(null);
  const parsedValue = useMemo(() => parseDateOnly(value), [value]);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(parsedValue ?? new Date())
  );

  useEffect(() => {
    if (parsedValue) setVisibleMonth(startOfMonth(parsedValue));
  }, [parsedValue?.getFullYear(), parsedValue?.getMonth()]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const today = useMemo(() => startOfDay(new Date()), []);

  function chooseDate(date: Date) {
    onChange(formatDateOnly(date));
    setVisibleMonth(startOfMonth(date));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${modalInputClass} flex cursor-pointer items-center justify-between gap-3 text-left font-medium ${theme.border}`}
      >
        <span>{parsedValue ? formatDisplayDate(parsedValue) : "Wybierz datę"}</span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.badge}`}
        >
          <CalendarDays className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Wybierz datę"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[340px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[20px] border border-slate-700/80 bg-[#091321] p-3 shadow-2xl shadow-black/50 sm:w-[360px]"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-2.5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">Data transakcji</p>
              <p className="mt-0.5 text-[15px] font-black capitalize text-slate-100">
                {MONTHS_PL[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
                aria-label="Następny miesiąc"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 px-0.5 pb-1">
            {WEEKDAYS_PL.map((weekday) => (
              <div
                key={weekday}
                className="flex h-7 items-center justify-center text-[11px] font-black uppercase tracking-[0.06em] text-slate-500"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map(({ date, currentMonth }) => {
              const selected = parsedValue ? isSameDate(date, parsedValue) : false;
              const isToday = isSameDate(date, today);

              return (
                <button
                  type="button"
                  key={formatDateOnly(date)}
                  onClick={() => chooseDate(date)}
                  className={`relative flex h-10 cursor-pointer items-center justify-center rounded-xl border text-[13px] font-bold transition ${
                    selected
                      ? `${theme.selected} border-transparent shadow-sm`
                      : currentMonth
                        ? `border-transparent text-slate-200 ${theme.hover}`
                        : "border-transparent text-slate-700 hover:bg-slate-900/70 hover:text-slate-400"
                  } ${!selected && isToday ? theme.today : ""}`}
                >
                  {date.getDate()}
                  {isToday && !selected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-80" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
            >
              Anuluj
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => chooseDate(addDays(today, -1))}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
              >
                Wczoraj
              </button>
              <button
                type="button"
                onClick={() => chooseDate(today)}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-black transition ${theme.badge}`}
              >
                Dzisiaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckboxCard({
  checked,
  onChange,
  disabled,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
        disabled
          ? "cursor-not-allowed border-slate-800 bg-slate-950/35 opacity-60"
          : "cursor-pointer border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/75"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-600 bg-slate-950 text-cyan-400 accent-cyan-400 shadow-sm disabled:cursor-not-allowed"
      />
      <div>
        <p className="text-sm font-medium text-slate-100">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </label>
  );
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12, 0, 0, 0);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12, 0, 0, 0);
}

function calendarDays(month: Date) {
  const first = startOfMonth(month);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayIndex);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      currentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
