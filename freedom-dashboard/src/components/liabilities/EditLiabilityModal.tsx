import { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Liability, LiabilityImagePosition, LiabilityType } from "../../types/Liability";
import { LiabilityVisualFields } from "./LiabilityVisualFields";
import { Actions, CalculatedInterest, Field, ModalShell, PaymentBar, SelectType } from "./AddLiabilityModal";

type Props = { liability: Liability; onClose: () => void; onUpdate: (liability: Liability) => void };

export function EditLiabilityModal({ liability, onClose, onUpdate }: Props) {
  const [liabilityType, setLiabilityType] = useState<LiabilityType>(liability.type ?? "OTHER");
  const [name, setName] = useState(liability.name);
  const [originalAmount, setOriginalAmount] = useState(String(liability.originalAmount));
  const [remainingAmount, setRemainingAmount] = useState(String(liability.remainingAmount));
  const [monthlyPayment, setMonthlyPayment] = useState(String(liability.monthlyPayment));
  const [principalPayment, setPrincipalPayment] = useState(String(liability.principalPayment ?? 0));
  const [interestRate, setInterestRate] = useState(String(liability.interestRate));
  const [imageUrl, setImageUrl] = useState(liability.imageUrl ?? "");
  const [imagePosition, setImagePosition] = useState<LiabilityImagePosition>(liability.imagePosition ?? "center");
  const [iconKey, setIconKey] = useState(liability.iconKey ?? "landmark");
  const [error, setError] = useState("");

  const payment = Number(monthlyPayment) || 0;
  const principal = Number(principalPayment) || 0;
  const interestPayment = Math.max(payment - principal, 0);
  const principalShare = payment > 0 ? Math.min((principal / payment) * 100, 100) : 0;
  const interestShare = payment > 0 ? Math.min((interestPayment / payment) * 100, 100) : 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const original = Number(originalAmount), remaining = Number(remainingAmount), currentPayment = Number(monthlyPayment), currentPrincipal = Number(principalPayment), rate = Number(interestRate);
    if (!name.trim()) return setError("Podaj nazwę zobowiązania.");
    if (!Number.isFinite(original) || original <= 0) return setError("Kwota początkowa musi być większa od 0.");
    if (!Number.isFinite(remaining) || remaining < 0 || remaining > original) return setError("Pozostała kwota musi mieścić się między 0 a kwotą początkową.");
    if (!Number.isFinite(currentPayment) || currentPayment < 0) return setError("Rata nie może być ujemna.");
    if (!Number.isFinite(currentPrincipal) || currentPrincipal < 0 || currentPrincipal > currentPayment) return setError("Część kapitałowa musi mieścić się między 0 a całą ratą.");
    if (!Number.isFinite(rate) || rate < 0) return setError("Oprocentowanie nie może być ujemne.");
    onUpdate({ ...liability, name: name.trim(), type: liabilityType, originalAmount: original, remainingAmount: remaining, monthlyPayment: currentPayment, principalPayment: currentPrincipal, interestPayment: currentPayment - currentPrincipal, interestRate: rate, imageUrl: imageUrl || undefined, imagePosition, iconKey });
    onClose();
  }

  return <ModalShell title="Edytuj zobowiązanie" subtitle="Zaktualizuj dług, ratę i wygląd karty." onClose={onClose}>
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      {error && <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={18}/>{error}</div>}
      <LiabilityVisualFields name={name} imageUrl={imageUrl} setImageUrl={setImageUrl} imagePosition={imagePosition} setImagePosition={setImagePosition} iconKey={iconKey} setIconKey={setIconKey}/>
      <Field label="Nazwa" value={name} onChange={setName} type="text"/>
      <SelectType value={liabilityType} onChange={setLiabilityType}/>
      <div className="grid grid-cols-2 gap-4"><Field label="Kwota początkowa" value={originalAmount} onChange={setOriginalAmount}/><Field label="Pozostało do spłaty" value={remainingAmount} onChange={setRemainingAmount}/></div>
      <div className="border-t border-slate-800 pt-5"><h3 className="text-lg font-black">Aktualna rata</h3><p className="mt-1 text-xs text-slate-500">Podaj ratę i kapitał. Odsetki liczymy automatycznie.</p></div>
      <Field label="Pełna rata" value={monthlyPayment} onChange={setMonthlyPayment}/>
      <div className="grid grid-cols-2 gap-4"><Field label="Część kapitałowa" value={principalPayment} onChange={setPrincipalPayment}/><CalculatedInterest value={interestPayment}/></div>
      {payment > 0 && principal <= payment && <PaymentBar payment={payment} principalShare={principalShare} interestShare={interestShare}/>} 
      <Field label="Aktualne oprocentowanie (%)" value={interestRate} onChange={setInterestRate}/>
      <Actions onClose={onClose} submit="Zapisz zmiany"/>
    </form>
  </ModalShell>;
}
