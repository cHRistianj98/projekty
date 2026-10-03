import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Banknote, CheckCircle2, Landmark, LoaderCircle, Plus, Scale, TriangleAlert, Wallet } from "lucide-react";
import { cashReconciliationApi, type CashReconciliationResponse } from "../../api/cashReconciliationApi";
import { PortfolioDialog, errorMessage } from "./PortfolioDialogs";
import { money } from "./portfolioView";

type Props = {
  onClose: () => void;
  onReconciled: () => Promise<void>;
  onAddCashAsset: () => void;
};

export function CashReconciliationDialog({ onClose, onReconciled, onAddCashAsset }: Props) {
  const [data, setData] = useState<CashReconciliationResponse | null>(null);
  const [targets, setTargets] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAdjustment, setSavedAdjustment] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    cashReconciliationApi.get()
      .then(response => {
        if (cancelled) return;
        setData(response);
        setTargets(Object.fromEntries(response.assets.map(asset => [asset.assetId, asset.value.toFixed(2)])));
      })
      .catch(cause => { if (!cancelled) setError(errorMessage(cause)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const targetRows = useMemo(() => (data?.assets ?? []).map(asset => ({
    asset,
    target: parseMoney(targets[asset.assetId]),
  })), [data, targets]);

  const targetTotal = targetRows.reduce((sum, row) => sum + (row.target ?? 0), 0);
  const currentTotal = data?.currentTotal ?? 0;
  const previewAdjustment = targetTotal - currentTotal;
  const invalid = targetRows.some(({ asset, target }) => target == null || target < asset.reserved - 0.005);
  const realCashAssets = data?.assets.filter(asset => !asset.systemCash) ?? [];

  function updateTarget(assetId: number, value: string) {
    setSavedAdjustment(null);
    setError("");
    setTargets(current => ({ ...current, [assetId]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!data || invalid || saving) return;
    setSaving(true);
    setError("");
    setSavedAdjustment(null);
    try {
      const response = await cashReconciliationApi.reconcile(targetRows.map(({ asset, target }) => ({
        assetId: asset.assetId,
        targetValue: target ?? 0,
      })));
      setData(response);
      setTargets(Object.fromEntries(response.assets.map(asset => [asset.assetId, asset.value.toFixed(2)])));
      setSavedAdjustment(response.adjustment);
      await onReconciled();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return <PortfolioDialog
    title="Uzgodnij gotówkę"
    subtitle="Ustaw rzeczywiste salda bez tworzenia fałszywych przychodów i wydatków."
    icon={<Scale size={24}/>}
    className="cash-reconciliation-dialog"
    wide
    busy={saving}
    onClose={onClose}
  >
    {loading ? <div className="cash-reconciliation-loading"><LoaderCircle className="animate-spin" size={22}/>Pobieranie sald…</div> : data && <form className="cash-reconciliation-form" onSubmit={submit}>
      <div className="cash-reconciliation-explainer">
        <span className="cash-reconciliation-explainer-icon"><Banknote size={20}/></span>
        <div>
          <strong>Środki nierozdzielone = bufor importu</strong>
          <p>Finanse nie mówi, czy płatność była kartą czy gotówką. Import nadal trafia więc do tego bufora, a tutaj okresowo uzgadniasz rzeczywiste konto i gotówkę.</p>
        </div>
      </div>

      {savedAdjustment != null && <div className="cash-reconciliation-success">
        <CheckCircle2 size={19}/><div><strong>Salda uzgodnione</strong><span>Korekta majątku: {signedMoney(savedAdjustment)}. Nie została dodana do przychodów ani wydatków.</span></div>
      </div>}

      <section className="cash-reconciliation-section">
        <div className="cash-reconciliation-section-heading">
          <div><h3>Rzeczywiste salda PLN</h3><p>Wpisz to, co faktycznie widzisz dziś na rachunkach i masz fizycznie w gotówce.</p></div>
          <button type="button" className="investment-button secondary" disabled={saving} onClick={onAddCashAsset}><Plus size={14}/>Dodaj konto / gotówkę</button>
        </div>

        {!realCashAssets.length && <div className="cash-reconciliation-empty">
          <Landmark size={22}/><div><strong>Nie masz jeszcze osobnego konta lub gotówki PLN.</strong><span>Dodaj np. „Konto PKO” i „Gotówka w portfelu”, a potem wróć do uzgodnienia.</span></div>
        </div>}

        <div className="cash-reconciliation-rows">
          {data.assets.map(asset => {
            const target = parseMoney(targets[asset.assetId]);
            const belowReserved = target != null && target < asset.reserved - 0.005;
            return <div className={`cash-reconciliation-row ${asset.systemCash ? "system" : ""}`} key={asset.assetId}>
              <span className="cash-reconciliation-asset-icon">{asset.systemCash ? <Wallet size={20}/> : <Landmark size={20}/>}</span>
              <div className="cash-reconciliation-asset-copy">
                <div className="cash-reconciliation-name"><strong>{asset.name}</strong>{asset.systemCash && <span className="portfolio-system-tag">AUTO</span>}</div>
                <span>Teraz {money(asset.value)}{asset.reserved > 0 ? ` · zarezerwowane ${money(asset.reserved)}` : ""}</span>
              </div>
              <label className="cash-reconciliation-target">
                <span>Saldo po uzgodnieniu</span>
                <div><input
                  type="number"
                  min={asset.reserved}
                  step="0.01"
                  value={targets[asset.assetId] ?? ""}
                  disabled={saving}
                  onChange={event => updateTarget(asset.assetId, event.target.value)}
                /><b>zł</b></div>
                {belowReserved && <small>Minimum: {money(asset.reserved)} przez istniejące rezerwacje.</small>}
              </label>
              {asset.systemCash && <button
                type="button"
                className="cash-reconciliation-zero"
                disabled={saving}
                onClick={() => updateTarget(asset.assetId, Math.max(0, asset.reserved).toFixed(2))}
                title="Zostaw tylko kwotę, której nie można ruszyć przez istniejące rezerwacje"
              >Wyzeruj</button>}
            </div>;
          })}
        </div>
      </section>

      <section className="cash-reconciliation-summary">
        <div><span>Obecnie w aktywach gotówkowych</span><strong>{money(currentTotal)}</strong></div>
        <div><span>Po uzgodnieniu</span><strong>{money(targetTotal)}</strong></div>
        <div className={previewAdjustment > .005 ? "positive" : previewAdjustment < -.005 ? "negative" : "neutral"}>
          <span>Korekta majątku</span><strong>{signedMoney(previewAdjustment)}</strong>
        </div>
        <p><TriangleAlert size={15}/>Korekta jest technicznym ruchem ledgerowym <b>RECONCILIATION_ADJUSTMENT</b>. Nie pojawi się w przychodach, wydatkach ani analizie cashflow.</p>
      </section>

      {error && <p className="investment-error" role="alert">{error}</p>}

      <footer className="cash-reconciliation-footer">
        <button type="button" className="investment-button secondary" disabled={saving} onClick={onClose}>Zamknij</button>
        <button type="submit" className="investment-button" disabled={saving || invalid || !data.assets.length}>{saving ? "Uzgadnianie…" : "Uzgodnij salda"}</button>
      </footer>
    </form>}
    {!loading && !data && <div className="cash-reconciliation-loading">{error || "Nie udało się pobrać danych."}</div>}
  </PortfolioDialog>;
}

function parseMoney(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
}

function signedMoney(value: number): string {
  const rounded = Math.abs(value) < .005 ? 0 : value;
  return `${rounded > 0 ? "+" : ""}${money(rounded)}`;
}
