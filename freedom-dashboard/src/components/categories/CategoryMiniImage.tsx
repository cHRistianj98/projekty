import { useMemo, useState } from "react";
import { CategoryIcon } from "./CategoryIcon";

type CategoryMiniImageProps = {
  name: string;
  iconKey: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const categoryPhotoFiles: Record<string, string> = {
  "artykuły spożywcze": "groceries.webp",
  "fryzjer": "hairdresser.webp",
  "jedzenie na mieście": "eating-out.webp",
  "pielęgnacja": "care.webp",
  "transport": "transport.webp",
  "dom i wyposażenie": "home.webp",
  "apteka": "pharmacy.webp",
  "dentysta": "dentist.webp",
  "masaż": "massage.webp",
  "suplementy": "supplements.webp",
  "terapeuta": "therapy.webp",
  "internet": "internet.webp",
  "kredyt": "loan.webp",
  "mandaty": "fines.webp",
  "prąd": "electricity.webp",
  "subskrypcje": "subscriptions.webp",
  "telefon": "phone.webp",
  "wspólnota / czynsz": "housing-fees.webp",
  "podatki": "taxes.webp",
  "rozwój": "development.webp",
  "zus": "zus.webp",
  "edukacja": "education.webp",
  "toastmasters": "toastmasters.webp",
  "siłownia": "gym.webp",
  "tańce": "dance.webp",
  "inwestycje": "investments.webp",
  "prowizje i opłaty": "investments.webp",
  "spread walutowy": "fx-spread.webp",
  "gaming": "gaming.webp",
  "szachy": "chess.webp",
  "przeszczep włosów": "hair-transplant.webp",
  "sprzęt": "equipment.webp",
  "ubrania": "clothes.webp",
  "zdrowie": "health.webp",
  "donejty": "donations.webp",
  "kot": "cat.webp",
  "prezenty": "gifts.webp",
  "ślub": "wedding.webp",
  "wycieczki": "trips.webp",
  "samochód": "car.webp",
  "sport": "sport.webp",
  "notariusz": "notary.webp",
  "inne": "other.webp",

  "wypłata": "salary.webp",
  "prezent": "gift-income.webp",
  "procent / odsetki": "interest.webp",
  "zwrot z podatku": "tax-refund.webp",
  "rodzina": "family.webp",
  "sprzedaż": "sale.webp",
  "przychód": "income.webp",
};

const sizeClasses = {
  sm: "h-9 w-11 rounded-xl",
  md: "h-11 w-14 rounded-xl",
  lg: "h-14 w-20 rounded-2xl",
};

export function CategoryMiniImage({
  name,
  iconKey,
  color,
  size = "md",
  className = "",
}: CategoryMiniImageProps) {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeCategoryName(name);
  const fileName = categoryPhotoFiles[normalized];

  const src = useMemo(
    () => fileName ? `/categories/${fileName}` : null,
    [fileName]
  );

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-white/10 bg-slate-950 shadow-[0_8px_24px_rgba(0,0,0,.24)] ${sizeClasses[size]} ${className}`}
      style={{ color, backgroundColor: `${color}16` }}
      title={name}
    >
      {src && !failed ? (
        <>
          <img
            src={src}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setFailed(true)}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <span
            className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-md border border-white/15 bg-slate-950/75 shadow-lg backdrop-blur-sm"
            style={{ color }}
          >
            <CategoryIcon iconKey={iconKey} className="h-3 w-3" />
          </span>
        </>
      ) : (
        <CategoryIcon iconKey={iconKey} className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </span>
  );
}

function normalizeCategoryName(value: string) {
  return value.trim().toLocaleLowerCase("pl-PL");
}
