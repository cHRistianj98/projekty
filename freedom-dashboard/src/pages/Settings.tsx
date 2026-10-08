import { Check, Languages, Settings2 } from "lucide-react";
import { useLanguage, type AppLanguage } from "../i18n/LanguageContext";

export function Settings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#050b16] p-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <Settings2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{t("settings")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("languageDescription")}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-800 bg-[#0b1322] p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Languages size={19} />
            </div>
            <div>
              <h2 className="font-black text-white">{t("language")}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t("savedLocally")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <LanguageCard
              value="pl"
              selected={language === "pl"}
              title={t("polish")}
              description={t("polishDescription")}
              flag="🇵🇱"
              onSelect={setLanguage}
            />
            <LanguageCard
              value="en"
              selected={language === "en"}
              title={t("english")}
              description={t("englishDescription")}
              flag="🇬🇧"
              onSelect={setLanguage}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function LanguageCard({
  value,
  selected,
  title,
  description,
  flag,
  onSelect,
}: {
  value: AppLanguage;
  selected: boolean;
  title: string;
  description: string;
  flag: string;
  onSelect: (value: AppLanguage) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,.12)]"
          : "border-slate-800 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/70"
      }`}
    >
      <span className="text-2xl">{flag}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-white">{title}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
          selected
            ? "border-cyan-400 bg-cyan-400 text-slate-950"
            : "border-slate-700 text-transparent group-hover:border-slate-500"
        }`}
      >
        <Check size={15} strokeWidth={3} />
      </span>
    </button>
  );
}
