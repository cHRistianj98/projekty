import { useRef, useState } from "react";
import { CheckCircle2, Database, FileUp, LoaderCircle, ShieldCheck, X } from "lucide-react";
import {
  myFinanceImportApi,
  type MyFinanceImportPreview,
  type MyFinanceImportResult,
} from "../../api/myFinanceImportApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => Promise<void> | void;
};

const money = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 2,
});

export function MyFinanceImportModal({ open, onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MyFinanceImportPreview | null>(null);
  const [result, setResult] = useState<MyFinanceImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    if (loading) return;
    reset();
    onClose();
  }

  async function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setPreview(null);
    setResult(null);
    setError("");
    if (!nextFile) return;

    setLoading(true);
    try {
      setPreview(await myFinanceImportApi.preview(nextFile));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się odczytać backupu.");
    } finally {
      setLoading(false);
    }
  }

  async function importFile() {
    if (!file || !preview || preview.newTransactions === 0) return;
    setLoading(true);
    setError("");
    try {
      const imported = await myFinanceImportApi.importBackup(file);
      setResult(imported);
      setPreview(null);
      await onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import nie powiódł się.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[#09111f] shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-7 py-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Database size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-400">Import danych</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Backup z aplikacji Finanse</h2>
              <p className="mt-1 text-sm text-slate-400">Wczytaj plik .mmbackup. Powtarzające się transakcje zostaną pominięte.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-7">
          {!result && (
            <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-5 py-5 transition hover:border-blue-500/60 hover:bg-blue-500/5">
              <div className="flex min-w-0 items-center gap-4">
                <FileUp className="shrink-0 text-blue-400" size={24} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{file?.name ?? "Wybierz plik .mmbackup"}</p>
                  <p className="mt-1 text-xs text-slate-500">Freedom odczyta MyFinance.db po stronie backendu.</p>
                </div>
              </div>
              <span className="shrink-0 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">Wybierz</span>
              <input
                ref={inputRef}
                type="file"
                accept=".mmbackup"
                className="hidden"
                disabled={loading}
                onChange={(event) => void selectFile(event.target.files?.[0] ?? null)}
              />
            </label>
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 text-sm text-blue-200">
              <LoaderCircle className="animate-spin" size={18} />
              Analizuję backup…
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">{error}</div>
          )}

          {preview && !loading && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="W backupie" value={String(preview.sourceTransactions)} />
                <Stat label="Już mam" value={String(preview.alreadyImported)} />
                <Stat label="Nowe" value={String(preview.newTransactions)} accent />
                <Stat label="Nowe kategorie" value={String(preview.newCategories)} />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <MoneyRow label={`Przychody (${preview.newIncomes})`} value={preview.newIncomeAmount} positive />
                  <MoneyRow label={`Wydatki (${preview.newExpenses})`} value={preview.newExpenseAmount} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-sm font-semibold text-slate-300">Zmiana nierozdzielonych środków po imporcie</span>
                  <span className={`text-lg font-black ${preview.systemCashChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {preview.systemCashChange >= 0 ? "+" : ""}{money.format(preview.systemCashChange)}
                  </span>
                </div>
                {(preview.earliestDate || preview.latestDate) && (
                  <p className="mt-3 text-xs text-slate-500">Zakres danych: {preview.earliestDate ?? "—"} — {preview.latestDate ?? "—"}</p>
                )}
              </div>

              <div className="flex gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-5 py-4 text-sm text-slate-300">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={18} />
                <p>Duplikaty są rozpoznawane po oryginalnym UUID transakcji z Finanse, nie po kwocie czy opisie. Import jest wykonywany atomowo: błąd wycofuje całą paczkę.</p>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={close} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-400 hover:text-white">Anuluj</button>
                <button
                  type="button"
                  disabled={preview.newTransactions === 0 || loading}
                  onClick={() => void importFile()}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {preview.newTransactions === 0 ? "Wszystko już zaimportowane" : `Importuj ${preview.newTransactions} nowych`}
                </button>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-5">
              <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={24} />
                <div>
                  <h3 className="font-bold text-white">Import zakończony</h3>
                  <p className="mt-1 text-sm text-slate-300">Dodano {result.importedTransactions} transakcji, a {result.duplicatesSkipped} istniejących pominięto.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Przychody" value={String(result.importedIncomes)} />
                <Stat label="Wydatki" value={String(result.importedExpenses)} />
                <Stat label="Pominięte" value={String(result.duplicatesSkipped)} />
                <Stat label="Kategorie" value={`+${result.categoriesCreated}`} />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                <span className="text-sm text-slate-400">Zmiana nierozdzielonych środków</span>
                <span className={`font-black ${result.systemCashChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {result.systemCashChange >= 0 ? "+" : ""}{money.format(result.systemCashChange)}
                </span>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={close} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500">Gotowe</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${accent ? "text-blue-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function MoneyRow({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>{money.format(value)}</p>
    </div>
  );
}
