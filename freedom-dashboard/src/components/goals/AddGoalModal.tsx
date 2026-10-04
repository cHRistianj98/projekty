import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";

import type { Goal, GoalPriority, GoalType } from "../../types/Goal";
import { GOAL_TYPE_OPTIONS, getGoalTypeOption, readGoalImageFile } from "./goalCatalog";

type AddGoalModalProps = {
  onClose: () => void;
  onAdd: (goal: Goal) => void;
};

const colors = [
  "#3b82f6", "#2563eb", "#06b6d4", "#14b8a6", "#10b981",
  "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444",
  "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6",
  "#6366f1", "#64748b", "#94a3b8",
];

export function AddGoalModal({ onClose, onAdd }: AddGoalModalProps) {
  const [name, setName] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [priority, setPriority] = useState<GoalPriority>("MEDIUM");
  const [goalType, setGoalType] = useState<GoalType>("OTHER");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [imageUrl, setImageUrl] = useState(getGoalTypeOption("OTHER").image);
  const [imagePosition, setImagePosition] = useState<"center" | "top" | "bottom">("center");
  const [customImage, setCustomImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const selectedType = useMemo(() => getGoalTypeOption(goalType), [goalType]);

  const parsedCurrentAmount = parseMoney(currentAmount || "0");
  const parsedTargetAmount = parseMoney(targetAmount || "0");
  const parsedMonthlyContribution = parseMoney(monthlyContribution || "0");
  const canSubmit =
    name.trim().length > 0 &&
    Number.isFinite(parsedTargetAmount) &&
    parsedTargetAmount > 0 &&
    Number.isFinite(parsedCurrentAmount) &&
    parsedCurrentAmount >= 0 &&
    Number.isFinite(parsedMonthlyContribution) &&
    parsedMonthlyContribution >= 0;

  function parseMoney(value: string) {
    return Number(value.replace(/\s/g, "").replace(",", "."));
  }

  function chooseType(type: GoalType) {
    const next = getGoalTypeOption(type);
    setGoalType(type);
    setColor(next.color);
    if (!customImage) {
      setImageUrl(next.image);
      setImagePosition("center");
    }
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setImageError("");
    try {
      setImageUrl(await readGoalImageFile(file));
      setCustomImage(true);
      setImagePosition("center");
    } catch (reason) {
      setImageError(reason instanceof Error ? reason.message : "Nie udało się dodać zdjęcia.");
    }
  }

  function restorePreset() {
    setImageUrl(selectedType.image);
    setImagePosition("center");
    setCustomImage(false);
    setImageError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const current = parseMoney(currentAmount);
    const target = parseMoney(targetAmount);
    const monthly = parseMoney(monthlyContribution || "0");

    if (!name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(current) || current < 0 || !Number.isFinite(monthly) || monthly < 0) return;

    onAdd({
      id: Date.now(),
      name: name.trim(),
      currentAmount: current,
      targetAmount: target,
      monthlyContribution: monthly,
      priority,
      type: goalType,
      targetDate: targetDate || undefined,
      color,
      imageUrl: imageUrl || undefined,
      imagePosition,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020610]/80 p-3 backdrop-blur-md sm:p-5">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-[26px] border border-violet-500/25 bg-[#081321] shadow-[0_30px_120px_rgba(0,0,0,.75)]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/90 bg-[#081321]/95 px-5 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300 shadow-[0_10px_35px_rgba(124,58,237,.12)]">
              <Target size={23} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-400">Nowy cel</p>
              <h2 className="mt-0.5 text-xl font-black text-white sm:text-2xl">Dodaj cel finansowy</h2>
              <p className="mt-1 text-xs text-slate-500">Określ, na co zbierasz. Freedom policzy postęp, tempo i finansowanie.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 text-slate-500 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)] lg:p-7">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-white">Na co zbierasz?</h3>
                  <p className="mt-1 text-xs text-slate-500">Typ ustawia sensowną miniaturę, kolor i pomaga grupować cele w analizie.</p>
                </div>
                <Sparkles size={18} className="text-violet-400" />
              </div>

              <div className="max-h-[330px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
                  {GOAL_TYPE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => chooseType(item.value)}
                      title={item.description}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 ${goalType === item.value ? "border-violet-400/70 bg-violet-500/10 ring-2 ring-violet-500/15" : "border-slate-800 bg-slate-900/50 hover:border-slate-600"}`}
                    >
                      <div className="relative h-[72px] overflow-hidden bg-slate-900">
                        <img src={item.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07101d]/90 via-transparent to-transparent" />
                        {goalType === item.value && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-violet-500 text-[10px] font-black text-white">✓</span>}
                      </div>
                      <span className="block truncate px-2.5 py-2 text-[10px] font-black text-slate-200">{item.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Nazwa celu <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="np. BMW F36 430i M Sport"
                    className="w-full rounded-xl border border-slate-700 bg-[#0a1627] px-4 py-3.5 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>

                <MoneyInput label="Aktualnie odłożone" value={currentAmount} onChange={setCurrentAmount} step={100} />
                <MoneyInput label="Kwota celu" value={targetAmount} onChange={setTargetAmount} step={1000} required />
                <MoneyInput label="Miesięczna wpłata" value={monthlyContribution} onChange={setMonthlyContribution} step={100} />

                <GoalDatePicker value={targetDate} onChange={setTargetDate} />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-black uppercase tracking-[.12em] text-slate-500">Priorytet</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["HIGH", "MEDIUM", "LOW"] as GoalPriority[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPriority(item)}
                      className={`cursor-pointer rounded-xl border px-3 py-3 text-xs font-black transition ${priority === item ? item === "HIGH" ? "border-rose-400/45 bg-rose-500/10 text-rose-300" : item === "MEDIUM" ? "border-amber-400/45 bg-amber-500/10 text-amber-300" : "border-blue-400/45 bg-blue-500/10 text-blue-300" : "border-slate-800 bg-slate-900/60 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}
                    >
                      {item === "HIGH" ? "Wysoki" : item === "MEDIUM" ? "Średni" : "Niski"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Kolor akcentu</p>
                  <span className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-700">{color.toUpperCase()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {colors.map((availableColor) => (
                    <button
                      key={availableColor}
                      type="button"
                      aria-label={`Kolor ${availableColor}`}
                      onClick={() => setColor(availableColor)}
                      className={`relative h-8 w-8 cursor-pointer rounded-full border-2 border-[#081321] transition hover:scale-110 ${color.toLowerCase() === availableColor.toLowerCase() ? "scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-[#081321]" : ""}`}
                      style={{ backgroundColor: availableColor }}
                    >
                      {color.toLowerCase() === availableColor.toLowerCase() && (
                        <Check size={13} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.8)]" />
                      )}
                    </button>
                  ))}

                  <label className="group relative flex h-8 cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-slate-700 bg-[#0e1d31] pl-2 pr-3 text-[10px] font-black text-slate-400 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-300">
                    <Palette size={13} />
                    Paleta
                    <span className="h-4 w-4 rounded-full border border-white/15 shadow-inner" style={{ backgroundColor: color }} />
                    <input
                      type="color"
                      value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#3b82f6"}
                      onChange={(event) => setColor(event.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Wybierz własny kolor"
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
                <div>
                  <p className="text-sm font-black text-white">Zdjęcie celu</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">Preset typu albo własny obraz.</p>
                </div>
                <ImageIcon size={18} className="text-violet-400" />
              </div>

              <div className="p-4">
                <div className="relative h-48 overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Podgląd celu" className={`h-full w-full object-cover ${imagePosition === "top" ? "object-top" : imagePosition === "bottom" ? "object-bottom" : "object-center"}`} />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-700"><ImageIcon size={30} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050b16]/90 via-transparent to-black/10" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">{selectedType.shortLabel}</p>
                    <p className="mt-1 truncate font-black text-white">{name || "Nowy cel finansowy"}</p>
                  </div>
                </div>

                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/30 bg-violet-500/[0.06] px-4 py-3 text-xs font-black text-violet-300 transition hover:border-violet-400/60 hover:bg-violet-500/10">
                  <Upload size={15} /> {customImage ? "Zmień własne zdjęcie" : "Wgraj własne zdjęcie"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                </label>

                {imageError && <p className="mt-2 text-xs font-bold text-rose-300">{imageError}</p>}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button type="button" onClick={restorePreset} className="flex cursor-pointer items-center gap-1.5 text-[10px] font-bold text-slate-500 transition hover:text-violet-300">
                    <RotateCcw size={13} /> Obraz typu
                  </button>
                  <div className="flex gap-1.5">
                    {(["top", "center", "bottom"] as const).map((position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => setImagePosition(position)}
                        className={`cursor-pointer rounded-lg border px-2 py-1.5 text-[9px] font-black transition ${imagePosition === position ? "border-violet-400/40 bg-violet-500/10 text-violet-300" : "border-slate-800 bg-slate-900 text-slate-600 hover:text-slate-300"}`}
                      >
                        {position === "top" ? "Góra" : position === "bottom" ? "Dół" : "Środek"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] p-4">
              <div className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Sparkles size={17} /></div>
                <div>
                  <p className="text-xs font-black text-slate-200">Po co typ celu?</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Freedom używa go do domyślnego zdjęcia, czytelnych opisów, grupowania oraz kontekstu w analizie AI. Nie zmienia sposobu księgowania pieniędzy.</p>
                </div>
              </div>
            </section>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white">Anuluj</button>
              <button
                type="submit"
                disabled={!canSubmit}
                title={!canSubmit ? "Uzupełnij nazwę celu i ustaw kwotę celu większą od 0." : "Dodaj cel"}
                className={`flex-1 rounded-xl px-5 py-3 text-sm font-black transition ${
                  canSubmit
                    ? "cursor-pointer bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-[0_10px_30px_rgba(79,70,229,.2)] hover:-translate-y-0.5 hover:from-violet-500 hover:to-blue-500"
                    : "cursor-not-allowed border border-slate-800 bg-slate-900/70 text-slate-600 shadow-none"
                }`}
              >
                Dodaj cel
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}


type GoalDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function GoalDatePicker({ value, onChange }: GoalDatePickerProps) {
  const parsed = value ? new Date(`${value}T12:00:00`) : null;
  const initial = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const monthLabel = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth, 1));

  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const previousMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayOffset = index - firstWeekday + 1;
    if (dayOffset < 1) {
      const date = new Date(viewYear, viewMonth - 1, previousMonthDays + dayOffset);
      return { date, outside: true };
    }
    if (dayOffset > daysInMonth) {
      const date = new Date(viewYear, viewMonth + 1, dayOffset - daysInMonth);
      return { date, outside: true };
    }
    return { date: new Date(viewYear, viewMonth, dayOffset), outside: false };
  });

  function iso(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  function changeMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function selectDate(date: Date) {
    onChange(iso(date));
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setOpen(false);
  }

  const selectedDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "dd.mm.rrrr";

  return (
    <div className="relative">
      <label className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Deadline</label>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-[#0a1627] px-4 py-3.5 text-left text-sm font-bold transition ${
          open
            ? "border-violet-500 ring-2 ring-violet-500/10"
            : "border-slate-700 hover:border-slate-600"
        }`}
      >
        <CalendarDays size={16} className={open ? "text-violet-300" : "text-slate-500"} />
        <span className={selectedDate ? "flex-1 text-slate-200" : "flex-1 text-slate-600"}>{displayValue}</span>
        <ChevronDown size={15} className={`text-slate-600 transition ${open ? "rotate-180 text-violet-300" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-[318px] overflow-hidden rounded-2xl border border-slate-700/90 bg-[#081321] shadow-[0_24px_80px_rgba(0,0,0,.72)]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0b1727] px-3 py-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-800 bg-slate-950/50 text-slate-500 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-300"
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-600">Wybierz termin</p>
              <p className="mt-0.5 text-sm font-black capitalize text-slate-100">{monthLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-800 bg-slate-950/50 text-slate-500 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-300"
              aria-label="Następny miesiąc"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="p-3">
            <div className="mb-1 grid grid-cols-7">
              {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
                <div key={day} className="py-1.5 text-center text-[9px] font-black uppercase tracking-[.08em] text-slate-700">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map(({ date, outside }, index) => {
                const selected = selectedDate ? sameDay(date, selectedDate) : false;
                const today = sameDay(date, new Date());
                return (
                  <button
                    key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${index}`}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={`relative grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-[11px] font-black transition ${
                      selected
                        ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-[0_6px_16px_rgba(124,58,237,.28)]"
                        : outside
                          ? "text-slate-800 hover:bg-slate-900/70 hover:text-slate-500"
                          : "text-slate-300 hover:bg-violet-500/10 hover:text-violet-200"
                    }`}
                  >
                    {date.getDate()}
                    {today && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-violet-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/35 px-3 py-2.5">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="cursor-pointer rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
            >
              Wyczyść
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="cursor-pointer rounded-lg border border-violet-400/20 bg-violet-500/[0.08] px-2.5 py-1.5 text-[10px] font-black text-violet-300 transition hover:border-violet-400/40 hover:bg-violet-500/15"
            >
              Dzisiaj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type MoneyInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  required?: boolean;
};

function MoneyInput({ label, value, onChange, step, required = false }: MoneyInputProps) {
  function numericValue() {
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function bump(direction: 1 | -1) {
    const next = Math.max(0, numericValue() + direction * step);
    onChange(String(Math.round(next * 100) / 100));
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">{label}{required ? " *" : ""}</label>
      <div className="group relative overflow-hidden rounded-xl border border-slate-700 bg-[#0a1627] transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9,.\s]/g, ""))}
          placeholder="0"
          className="w-full bg-transparent py-3.5 pl-4 pr-[86px] text-sm font-bold text-white outline-none placeholder:text-slate-700"
        />
        <div className="absolute inset-y-0 right-0 flex items-stretch border-l border-slate-700 bg-[#0e1d31]">
          <span className="flex items-center px-2.5 text-[10px] font-black tracking-[.08em] text-slate-500">PLN</span>
          <div className="flex w-8 flex-col border-l border-slate-700">
            <button type="button" tabIndex={-1} onClick={() => bump(1)} className="grid flex-1 cursor-pointer place-items-center border-b border-slate-700 text-slate-500 transition hover:bg-violet-500/15 hover:text-violet-300" title={`+${step}`}><ChevronUp size={12} /></button>
            <button type="button" tabIndex={-1} onClick={() => bump(-1)} className="grid flex-1 cursor-pointer place-items-center text-slate-500 transition hover:bg-violet-500/15 hover:text-violet-300" title={`-${step}`}><ChevronDown size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
