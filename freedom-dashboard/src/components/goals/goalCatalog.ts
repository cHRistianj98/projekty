import type { GoalType } from "../../types/Goal";

export type GoalTypeOption = {
  value: GoalType;
  label: string;
  shortLabel: string;
  description: string;
  image: string;
  color: string;
};

export const GOAL_TYPE_OPTIONS: GoalTypeOption[] = [
  { value: "EMERGENCY_FUND", label: "Poduszka finansowa", shortLabel: "Poduszka", description: "Rezerwa bezpieczeństwa i płynności.", image: "/goals/emergency-fund.webp", color: "#22d3ee" },
  { value: "HOME", label: "Dom / mieszkanie", shortLabel: "Dom", description: "Zakup własnej nieruchomości lub wkład własny.", image: "/goals/home.webp", color: "#3b82f6" },
  { value: "CAR", label: "Samochód", shortLabel: "Samochód", description: "Zakup lub zmiana samochodu.", image: "/goals/car.webp", color: "#8b5cf6" },
  { value: "TRAVEL", label: "Podróż", shortLabel: "Podróż", description: "Większa podróż, wyjazd lub wyprawa.", image: "/goals/travel.webp", color: "#38bdf8" },
  { value: "VACATION", label: "Wakacje", shortLabel: "Wakacje", description: "Urlop i wypoczynek bez finansowania z przyszłego cashflow.", image: "/goals/vacation.webp", color: "#14b8a6" },
  { value: "EDUCATION", label: "Edukacja", shortLabel: "Edukacja", description: "Studia, kursy, certyfikaty i rozwój kompetencji.", image: "/goals/education.webp", color: "#f59e0b" },
  { value: "HEALTH", label: "Zdrowie", shortLabel: "Zdrowie", description: "Leczenie, badania lub większy wydatek zdrowotny.", image: "/goals/health.webp", color: "#ef4444" },
  { value: "DENTAL", label: "Leczenie zębów", shortLabel: "Zęby", description: "Stomatologia, implanty, ortodoncja i odbudowa.", image: "/goals/dental.webp", color: "#0ea5e9" },
  { value: "WEDDING", label: "Ślub / wesele", shortLabel: "Ślub", description: "Budżet ceremonii, wesela lub podróży poślubnej.", image: "/goals/wedding.webp", color: "#ec4899" },
  { value: "CHILD", label: "Dziecko / rodzina", shortLabel: "Rodzina", description: "Wyprawka, opieka, edukacja lub rodzinny kapitał.", image: "/goals/child.webp", color: "#f472b6" },
  { value: "RENOVATION", label: "Remont", shortLabel: "Remont", description: "Remont, wyposażenie lub modernizacja domu.", image: "/goals/renovation.webp", color: "#f97316" },
  { value: "ELECTRONICS", label: "Sprzęt / elektronika", shortLabel: "Sprzęt", description: "Komputer, telefon, RTV lub większy zakup technologiczny.", image: "/goals/electronics.webp", color: "#6366f1" },
  { value: "BUSINESS", label: "Własny biznes", shortLabel: "Biznes", description: "Kapitał na firmę, produkt lub rozwój działalności.", image: "/goals/business.webp", color: "#2563eb" },
  { value: "INVESTMENT", label: "Kapitał inwestycyjny", shortLabel: "Inwestycje", description: "Budowa kapitału przeznaczonego do inwestowania.", image: "/goals/investment.webp", color: "#10b981" },
  { value: "DEBT_PAYOFF", label: "Spłata długu", shortLabel: "Spłata długu", description: "Kapitał na wcześniejszą spłatę zobowiązania.", image: "/goals/debt-payoff.webp", color: "#f59e0b" },
  { value: "RETIREMENT", label: "Emerytura / wolność", shortLabel: "Emerytura", description: "Długoterminowy kapitał na niezależność finansową.", image: "/goals/retirement.webp", color: "#06b6d4" },
  { value: "HOBBY", label: "Hobby / pasja", shortLabel: "Hobby", description: "Sprzęt lub projekt związany z pasją.", image: "/goals/hobby.webp", color: "#a855f7" },
  { value: "SECOND_PROPERTY", label: "Druga nieruchomość", shortLabel: "Nieruchomość", description: "Zakup działki, lokalu lub kolejnej nieruchomości.", image: "/goals/second-property.webp", color: "#0ea5e9" },
  { value: "LUXURY_PURCHASE", label: "Duży / luksusowy zakup", shortLabel: "Duży zakup", description: "Zegarek, sprzęt premium lub inna nagroda za wynik.", image: "/goals/luxury.webp", color: "#d946ef" },
  { value: "OTHER", label: "Inny cel", shortLabel: "Inny", description: "Dowolny własny cel finansowy.", image: "/goals/other.webp", color: "#64748b" },
];

export const GOAL_TYPE_BY_VALUE = new Map(GOAL_TYPE_OPTIONS.map((item) => [item.value, item]));

export function getGoalTypeOption(type?: GoalType | null): GoalTypeOption {
  return GOAL_TYPE_BY_VALUE.get(type ?? "OTHER") ?? GOAL_TYPE_BY_VALUE.get("OTHER")!;
}

export function getGoalTypeLabel(type?: GoalType | null) {
  return getGoalTypeOption(type).shortLabel;
}

export function getGoalTypeImage(type?: GoalType | null) {
  return getGoalTypeOption(type).image;
}

export async function readGoalImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Wybierz plik graficzny.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Zdjęcie może mieć maksymalnie 8 MB.");

  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Nie udało się odczytać zdjęcia."));
    reader.onerror = () => reject(new Error("Nie udało się odczytać zdjęcia."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nie udało się wczytać zdjęcia."));
    img.src = rawUrl;
  });

  const maxWidth = 1600;
  const maxHeight = 1000;
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return rawUrl;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/webp", 0.86);
}
