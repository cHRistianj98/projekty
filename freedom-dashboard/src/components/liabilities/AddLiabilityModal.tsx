import { useState } from "react";
import { AlertCircle, Landmark, X } from "lucide-react";
import type { Liability, LiabilityImagePosition, LiabilityType } from "../../types/Liability";
import { LiabilityVisualFields } from "./LiabilityVisualFields";

type Props = { onClose: () => void; onAdd: (liability: Liability) => void };

export function AddLiabilityModal({ onClose, onAdd }: Props) {
  const [liabilityType, setLiabilityType] = useState<LiabilityType>("OTHER");
  const [name, setName] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [principalPayment, setPrincipalPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePosition, setImagePosition] = useState<LiabilityImagePosition>("center");
  const [iconKey, setIconKey] = useState("landmark");
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
    onAdd({ id: Date.now(), name: name.trim(), type: liabilityType, originalAmount: original, remainingAmount: remaining, monthlyPayment: currentPayment, principalPayment: currentPrincipal, interestPayment: currentPayment - currentPrincipal, interestRate: rate, imageUrl: imageUrl || undefined, imagePosition, iconKey });
    onClose();
  }

  return <ModalShell title="Dodaj zobowiązanie" subtitle="Dług też może wyglądać jak produkt premium." onClose={onClose}>
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      {error && <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={18}/>{error}</div>}
      <LiabilityVisualFields name={name} imageUrl={imageUrl} setImageUrl={setImageUrl} imagePosition={imagePosition} setImagePosition={setImagePosition} iconKey={iconKey} setIconKey={setIconKey}/>
      <Field label="Nazwa" value={name} onChange={setName} placeholder="np. Kredyt hipoteczny" type="text" />
      <SelectType value={liabilityType} onChange={setLiabilityType}/>
      <div className="grid grid-cols-2 gap-4"><Field label="Kwota początkowa" value={originalAmount} onChange={setOriginalAmount} placeholder="400000"/><Field label="Pozostało do spłaty" value={remainingAmount} onChange={setRemainingAmount} placeholder="350000"/></div>
      <div className="border-t border-slate-800 pt-5"><h3 className="text-lg font-black">Aktualna rata</h3><p className="mt-1 text-xs text-slate-500">Podaj ratę i kapitał. Odsetki liczymy automatycznie.</p></div>
      <Field label="Pełna rata" value={monthlyPayment} onChange={setMonthlyPayment} placeholder="2137.42"/>
      <div className="grid grid-cols-2 gap-4"><Field label="Część kapitałowa" value={principalPayment} onChange={setPrincipalPayment} placeholder="1684.17"/><CalculatedInterest value={interestPayment}/></div>
      {payment > 0 && principal <= payment && <PaymentBar payment={payment} principalShare={principalShare} interestShare={interestShare}/>} 
      <Field label="Aktualne oprocentowanie (%)" value={interestRate} onChange={setInterestRate} placeholder="7.2"/>
      <Actions onClose={onClose} submit="Dodaj zobowiązanie"/>
    </form>
  </ModalShell>;
}

export function ModalShell({title,subtitle,onClose,children}:{title:string;subtitle:string;onClose:()=>void;children:React.ReactNode}) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800 bg-[#0b1322] shadow-2xl"><div className="flex items-center justify-between border-b border-slate-800 px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Landmark size={21}/></div><div><h2 className="text-2xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div></div><button type="button" onClick={onClose} className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"><X size={20}/></button></div>{children}</div></div> }
export function Field({label,value,onChange,placeholder,type="number"}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:"text"|"number"}) { return <div><label className="mb-2 block text-sm font-bold text-slate-300">{label}</label><input type={type} min={type==="number"?"0":undefined} step={type==="number"?"0.01":undefined} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-base font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"/></div> }
export function SelectType({value,onChange}:{value:LiabilityType;onChange:(v:LiabilityType)=>void}) { return <div><label className="mb-2 block text-sm font-bold text-slate-300">Typ zobowiązania</label><select value={value} onChange={e=>onChange(e.target.value as LiabilityType)} className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 font-semibold text-white outline-none transition focus:border-blue-500"><option value="MORTGAGE">Kredyt hipoteczny</option><option value="CASH_LOAN">Kredyt gotówkowy</option><option value="CAR_LOAN">Kredyt samochodowy</option><option value="LEASING">Leasing</option><option value="INSTALLMENTS">Raty</option><option value="CREDIT_CARD">Karta kredytowa</option><option value="OTHER">Inne</option></select></div> }
export function CalculatedInterest({value}:{value:number}) { return <div><label className="mb-2 block text-sm font-bold text-slate-300">Część odsetkowa</label><div className="rounded-xl border border-orange-500/15 bg-orange-500/5 px-4 py-3.5 font-black text-orange-400">{value.toLocaleString("pl-PL",{minimumFractionDigits:2,maximumFractionDigits:2})} zł</div><p className="mt-1 text-xs text-slate-600">Wyliczane automatycznie</p></div> }
export function PaymentBar({payment,principalShare,interestShare}:{payment:number;principalShare:number;interestShare:number}) { return <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"><div className="flex justify-between"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Struktura raty</span><span className="font-black">{payment.toLocaleString("pl-PL")} zł</span></div><div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800"><div className="bg-emerald-500" style={{width:`${principalShare}%`}}/><div className="bg-orange-500" style={{width:`${interestShare}%`}}/></div><div className="mt-2 flex justify-between text-xs font-bold"><span className="text-emerald-400">Kapitał {principalShare.toFixed(1)}%</span><span className="text-orange-400">Odsetki {interestShare.toFixed(1)}%</span></div></div> }
export function Actions({onClose,submit}:{onClose:()=>void;submit:string}) { return <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800">Anuluj</button><button type="submit" className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500">{submit}</button></div> }
