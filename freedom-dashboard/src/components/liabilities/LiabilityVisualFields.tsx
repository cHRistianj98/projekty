import {
  Banknote, Building2, Car, CreditCard, Home, Image, ImageOff,
  Landmark, Laptop, ReceiptText, RotateCcw, WalletCards,
} from "lucide-react";
import type { LiabilityImagePosition } from "../../types/Liability";

export const LIABILITY_ICONS = [
  { key: "landmark", label: "Bank", Icon: Landmark },
  { key: "home", label: "Dom", Icon: Home },
  { key: "car", label: "Auto", Icon: Car },
  { key: "card", label: "Karta", Icon: CreditCard },
  { key: "wallet", label: "Portfel", Icon: WalletCards },
  { key: "banknote", label: "Gotówka", Icon: Banknote },
  { key: "laptop", label: "Sprzęt", Icon: Laptop },
  { key: "building", label: "Firma", Icon: Building2 },
  { key: "receipt", label: "Raty", Icon: ReceiptText },
];

export function getLiabilityIcon(key?: string) {
  return LIABILITY_ICONS.find((item) => item.key === key)?.Icon ?? Landmark;
}

type Props = {
  name: string;
  imageUrl: string;
  setImageUrl: (value: string) => void;
  imagePosition: LiabilityImagePosition;
  setImagePosition: (value: LiabilityImagePosition) => void;
  iconKey: string;
  setIconKey: (value: string) => void;
};

export function LiabilityVisualFields({
  name, imageUrl, setImageUrl, imagePosition, setImagePosition, iconKey, setIconKey,
}: Props) {
  function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Wybierz plik graficzny.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Zdjęcie może mieć maksymalnie 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && setImageUrl(reader.result);
    reader.readAsDataURL(file);
  }

  const PreviewIcon = getLiabilityIcon(iconKey);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">Wygląd zobowiązania</p>
          <p className="mt-1 text-xs text-slate-500">Zdjęcie i ikona będą widoczne na karcie długu.</p>
        </div>
        <Image size={19} className="text-violet-400" />
      </div>

      <div className="relative h-36 overflow-hidden rounded-2xl border border-slate-800 bg-[#07101f]">
        {imageUrl ? (
          <img src={imageUrl} alt="Podgląd" className={`h-full w-full object-cover ${imagePosition === "top" ? "object-top" : imagePosition === "bottom" ? "object-bottom" : "object-center"}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-700"><ImageOff size={30} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050b16]/95 via-[#050b16]/55 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/75 text-blue-400 backdrop-blur"><PreviewIcon size={20} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Preview</p>
            <p className="font-black text-white">{name || "Nowe zobowiązanie"}</p>
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm font-black text-blue-300 transition hover:border-blue-400/60 hover:bg-blue-500/10">
        <Image size={17} /> {imageUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie z komputera"}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }} />
      </label>

      {imageUrl && (
        <button type="button" onClick={() => setImageUrl("")} className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-red-400">
          <RotateCcw size={14} /> Usuń zdjęcie
        </button>
      )}

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[.12em] text-slate-500">Ikona</p>
        <div className="grid grid-cols-9 gap-2">
          {LIABILITY_ICONS.map(({ key, label, Icon }) => (
            <button key={key} type="button" title={label} onClick={() => setIconKey(key)} className={`flex aspect-square cursor-pointer items-center justify-center rounded-xl border transition ${iconKey === key ? "border-blue-400 bg-blue-500/20 text-blue-300 ring-2 ring-blue-500/20" : "border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-600 hover:text-white"}`}>
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>

      {imageUrl && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[.12em] text-slate-500">Kadrowanie zdjęcia</p>
          <div className="grid grid-cols-3 gap-2">
            {(["top", "center", "bottom"] as LiabilityImagePosition[]).map((position) => (
              <button key={position} type="button" onClick={() => setImagePosition(position)} className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition ${imagePosition === position ? "border-violet-500/40 bg-violet-500/15 text-violet-300" : "border-slate-800 bg-slate-900 text-slate-500 hover:text-white"}`}>
                {position === "top" ? "Góra" : position === "bottom" ? "Dół" : "Środek"}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
