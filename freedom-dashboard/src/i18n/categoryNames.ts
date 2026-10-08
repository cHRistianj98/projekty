import type { AppLanguage } from "./LanguageContext";

const categoryBySlug: Record<string, { pl: string; en: string }> = {
  groceries: { pl: "Artykuły spożywcze", en: "Groceries" },
  hairdresser: { pl: "Fryzjer", en: "Hairdresser" },
  "eating-out": { pl: "Jedzenie na mieście", en: "Eating out" },
  care: { pl: "Pielęgnacja", en: "Personal care" },
  transport: { pl: "Transport", en: "Transport" },
  home: { pl: "Dom i wyposażenie", en: "Home & furnishings" },
  pharmacy: { pl: "Apteka", en: "Pharmacy" },
  dentist: { pl: "Dentysta", en: "Dentist" },
  massage: { pl: "Masaż", en: "Massage" },
  supplements: { pl: "Suplementy", en: "Supplements" },
  therapy: { pl: "Terapeuta", en: "Therapy" },
  internet: { pl: "Internet", en: "Internet" },
  loan: { pl: "Kredyt", en: "Loan" },
  fines: { pl: "Mandaty", en: "Fines" },
  electricity: { pl: "Prąd", en: "Electricity" },
  subscriptions: { pl: "Subskrypcje", en: "Subscriptions" },
  phone: { pl: "Telefon", en: "Phone" },
  "housing-fees": { pl: "Wspólnota / czynsz", en: "Housing fees / rent" },
  taxes: { pl: "Podatki", en: "Taxes" },
  development: { pl: "Rozwój", en: "Development" },
  zus: { pl: "ZUS", en: "Social insurance" },
  education: { pl: "Edukacja", en: "Education" },
  toastmasters: { pl: "Toastmasters", en: "Toastmasters" },
  gym: { pl: "Siłownia", en: "Gym" },
  dance: { pl: "Tańce", en: "Dance" },
  investments: { pl: "Inwestycje", en: "Investments" },
  "investment-fees": { pl: "Prowizje i opłaty", en: "Investment fees" },
  "currency-spread": { pl: "Spread walutowy", en: "Currency spread" },
  gaming: { pl: "Gaming", en: "Gaming" },
  chess: { pl: "Szachy", en: "Chess" },
  "hair-transplant": { pl: "Przeszczep włosów", en: "Hair transplant" },
  equipment: { pl: "Sprzęt", en: "Equipment" },
  clothes: { pl: "Ubrania", en: "Clothing" },
  health: { pl: "Zdrowie", en: "Health" },
  donations: { pl: "Donejty", en: "Donations" },
  cat: { pl: "Kot", en: "Cat" },
  gifts: { pl: "Prezenty", en: "Gifts" },
  wedding: { pl: "Ślub", en: "Wedding" },
  trips: { pl: "Wycieczki", en: "Trips" },
  car: { pl: "Samochód", en: "Car" },
  sport: { pl: "Sport", en: "Sport" },
  notary: { pl: "Notariusz", en: "Notary" },
  other: { pl: "Inne", en: "Other" },
  salary: { pl: "Wypłata", en: "Salary" },
  gift: { pl: "Prezent", en: "Gift" },
  interest: { pl: "Procent / odsetki", en: "Interest" },
  "tax-refund": { pl: "Zwrot z podatku", en: "Tax refund" },
  family: { pl: "Rodzina", en: "Family" },
  sale: { pl: "Sprzedaż", en: "Sale" },
};

const byAnyName = new Map<string, { pl: string; en: string }>();
for (const entry of Object.values(categoryBySlug)) {
  byAnyName.set(entry.pl.toLocaleLowerCase("pl-PL"), entry);
  byAnyName.set(entry.en.toLocaleLowerCase("en-US"), entry);
}

const legacyNameAliases: Record<string, { pl: string; en: string }> = {
  "odsetki": { pl: "Odsetki", en: "Interest" },
  "koszt stały": { pl: "Koszt stały", en: "Fixed cost" },
  "przychód": { pl: "Przychód", en: "Income" },
  "wydatek": { pl: "Wydatek", en: "Expense" },
};
for (const [key, entry] of Object.entries(legacyNameAliases)) {
  byAnyName.set(key, entry);
  byAnyName.set(entry.en.toLocaleLowerCase("en-US"), entry);
}

export function localizedCategoryName(
  name: string | undefined,
  language: AppLanguage,
  slug?: string
) {
  if (slug && categoryBySlug[slug]) return categoryBySlug[slug][language];
  if (!name) return language === "pl" ? "Kategoria" : "Category";
  const match = byAnyName.get(name.toLocaleLowerCase(language === "pl" ? "pl-PL" : "en-US"));
  return match ? match[language] : name;
}

export function localizedCategoryGroup(group: string, language: AppLanguage) {
  const labels: Record<string, { pl: string; en: string }> = {
    FIXED: { pl: "Stałe", en: "Fixed" },
    LIVING: { pl: "Życie", en: "Living" },
    HEALTH: { pl: "Zdrowie", en: "Health" },
    GROWTH: { pl: "Rozwój", en: "Growth" },
    LIFESTYLE: { pl: "Lifestyle", en: "Lifestyle" },
    WEALTH: { pl: "Majątek", en: "Wealth" },
    GOALS: { pl: "Cele", en: "Goals" },
    INCOME: { pl: "Dochody", en: "Income" },
    OTHER: { pl: "Inne", en: "Other" },
  };
  return labels[group]?.[language] ?? group;
}
