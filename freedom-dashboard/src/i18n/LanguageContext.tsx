import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "pl" | "en";

const STORAGE_KEY = "freedom.language";

const messages = {
  pl: {
    settings: "Ustawienia",
    language: "Język aplikacji",
    languageDescription: "Wybierz jeden język dla całego interfejsu Freedom.",
    polish: "Polski",
    english: "Angielski",
    polishDescription: "Pełny interfejs po polsku.",
    englishDescription: "Full interface in English.",
    savedLocally: "Ustawienie jest zapisywane lokalnie w tej przeglądarce.",
    dashboard: "Pulpit",
    freedomEngine: "Silnik Freedom",
    finances: "Finanse",
    investments: "Inwestycje",
    goals: "Cele",
    budget: "Budżet",
    liabilities: "Zobowiązania",
    analytics: "Analizy",
    timeline: "Oś czasu",
    review: "Przegląd",
    simulator: "Symulator",
    achievements: "Osiągnięcia",
    signedIn: "Zalogowano",
    signOut: "Wyloguj",
    yourFinancialGame: "Twoja gra finansowa",
    playerLevel: "Poziom gracza",
    totalXp: "XP łącznie",
    toNextLevel: "Do następnego poziomu",
    maxPlayerLevel: "Maksymalny poziom gracza",
    levelExplanation: "Poziom rośnie dzięki XP za osiągnięcia. Majątek ma osobną ścieżkę kamieni milowych.",
    hello: "Cześć, Andrew!",
    level: "Poziom",
    financialCommandCenter: "Finansowe centrum dowodzenia",
    currentFinancialPicture: "Twój aktualny obraz finansów i droga do wolności.",
    historicalFinancialPicture: "Historyczny obraz Twoich finansów.",
    today: "Dzisiaj",
    currentMonth: "Bieżący miesiąc",
    history: "Historia",
    previousMonth: "Poprzedni miesiąc",
    nextMonth: "Następny miesiąc",
    thisIsCurrentMonth: "To jest bieżący miesiąc",
    managePortfolios: "Zarządzaj portfelami",
    seeAll: "Zobacz wszystkie",
    all: "Wszystkie",
    debtControl: "Kontrola zadłużenia",
    monthlyCashflow: "Miesięczne przepływy pieniężne",
    wealthCharts: "Wykresy majątku",
    portfolioStructure: "Struktura portfeli",
    netWorthHistory: "Historia majątku",
    monthlyOperatingSystem: "Miesięczny system operacyjny",
    netWorth: "Majątek netto",
    primaryMission: "Główna misja",
    currentTrajectory: "Bieżąca trajektoria",
    nextMove: "Twój następny ruch",
    lastReview: "Ostatni przegląd",
    monthScore: "Wynik miesiąca",
    monthStatus: "Status miesiąca",
    nextAction: "Następne działanie",
    wealthMilestone: "Kamień milowy majątku",
    monthOverMonth: "Miesiąc do miesiąca",
    quickInsight: "Szybki wgląd",
    freedomRoad: "Droga do wolności",
  },
  en: {
    settings: "Settings",
    language: "App language",
    languageDescription: "Choose one language for the entire Freedom interface.",
    polish: "Polish",
    english: "English",
    polishDescription: "Full interface in Polish.",
    englishDescription: "Full interface in English.",
    savedLocally: "This setting is saved locally in this browser.",
    dashboard: "Dashboard",
    freedomEngine: "Freedom Engine",
    finances: "Finances",
    investments: "Investments",
    goals: "Goals",
    budget: "Budget",
    liabilities: "Liabilities",
    analytics: "Analytics",
    timeline: "Timeline",
    review: "Review",
    simulator: "Simulator",
    achievements: "Achievements",
    signedIn: "Signed in",
    signOut: "Sign out",
    yourFinancialGame: "Your financial game",
    playerLevel: "Player level",
    totalXp: "XP total",
    toNextLevel: "To next level",
    maxPlayerLevel: "Maximum player level",
    levelExplanation: "Your level grows from achievement XP. Net worth has a separate milestone path.",
    hello: "Hi, Andrew!",
    level: "Level",
    financialCommandCenter: "Financial Command Center",
    currentFinancialPicture: "Your current financial picture and path to freedom.",
    historicalFinancialPicture: "Historical view of your finances.",
    today: "Today",
    currentMonth: "Current month",
    history: "History",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    thisIsCurrentMonth: "This is the current month",
    managePortfolios: "Manage portfolios",
    seeAll: "See all",
    all: "All",
    debtControl: "Debt Control",
    monthlyCashflow: "Monthly cashflow",
    wealthCharts: "Net worth charts",
    portfolioStructure: "Portfolio structure",
    netWorthHistory: "Net worth history",
    monthlyOperatingSystem: "Monthly operating system",
    netWorth: "Net worth",
    primaryMission: "Primary mission",
    currentTrajectory: "Current trajectory",
    nextMove: "Your next move",
    lastReview: "Last review",
    monthScore: "Month score",
    monthStatus: "Month status",
    nextAction: "Next action",
    wealthMilestone: "Wealth milestone",
    monthOverMonth: "Month over month",
    quickInsight: "Quick insight",
    freedomRoad: "Freedom road",
  },
} as const;

export type TranslationKey = keyof typeof messages.pl;

const levelPairs: Record<string, { pl: string; en: string }> = {
  Rookie: { pl: "Debiutant", en: "Rookie" },
  Planner: { pl: "Planista", en: "Planner" },
  Saver: { pl: "Oszczędzający", en: "Saver" },
  Builder: { pl: "Budowniczy", en: "Builder" },
  Investor: { pl: "Inwestor", en: "Investor" },
  Strategist: { pl: "Strateg", en: "Strategist" },
  Capitalist: { pl: "Kapitalista", en: "Capitalist" },
  Mogul: { pl: "Mogoł", en: "Mogul" },
  Tycoon: { pl: "Magnat", en: "Tycoon" },
  Starter: { pl: "Start", en: "Starter" },
  Accelerator: { pl: "Akcelerator", en: "Accelerator" },
  Millionaire: { pl: "Milioner", en: "Millionaire" },
  Independent: { pl: "Niezależny", en: "Independent" },
  FREE: { pl: "Wolność", en: "Free" },
};

const phrasePairs: Array<{ pl: string; en: string }> = [
  { pl: "Finanse", en: "Finances" },
  { pl: "Inwestycje", en: "Investments" },
  { pl: "Cele", en: "Goals" },
  { pl: "Budżet", en: "Budget" },
  { pl: "Zobowiązania", en: "Liabilities" },
  { pl: "Analizy", en: "Analytics" },
  { pl: "Oś czasu", en: "Timeline" },
  { pl: "Przegląd", en: "Review" },
  { pl: "Symulator", en: "Simulator" },
  { pl: "Osiągnięcia", en: "Achievements" },
  { pl: "Ustawienia", en: "Settings" },
  { pl: "Twoja gra finansowa", en: "Your financial game" },
  { pl: "Zalogowano", en: "Signed in" },
  { pl: "Wyloguj", en: "Sign out" },
  { pl: "Poziom gracza", en: "Player level" },
  { pl: "Maksymalny poziom gracza", en: "Maximum player level" },
  { pl: "Cześć, Andrew!", en: "Hi, Andrew!" },
  { pl: "Finansowe centrum dowodzenia", en: "Financial Command Center" },
  { pl: "Kontrola zadłużenia", en: "Debt Control" },
  { pl: "Miesięczny cashflow", en: "Monthly Cashflow" },
  { pl: "Twój następny ruch", en: "Your Next Move" },
  { pl: "Ostatni przegląd", en: "Last Review" },
  { pl: "Bieżący majątek netto", en: "Current Net Worth" },
  { pl: "Bieżące tempo", en: "Current Pace" },
  { pl: "Bieżąca trajektoria", en: "Current Trajectory" },
  { pl: "Wykresy majątku", en: "Net worth charts" },
  { pl: "Struktura portfeli", en: "Portfolio structure" },
  { pl: "Historia majątku", en: "Net worth history" },
  { pl: "Zarządzaj portfelami", en: "Manage portfolios" },
  { pl: "Zobacz wszystkie", en: "See all" },
  { pl: "Wszystkie", en: "All" },
  { pl: "Portfele", en: "Portfolios" },
  { pl: "Kapitał według strategii", en: "Capital by strategy" },
  { pl: "Wszystkie strategie inwestycyjne i ich aktualna wartość.", en: "All investment strategies and their current value." },
  { pl: "Pobieranie portfeli…", en: "Loading portfolios…" },
  { pl: "Wartość", en: "Value" },
  { pl: "Rezerwa", en: "Reserve" },
  { pl: "aktywów", en: "assets" },
  { pl: "Moje główne cele", en: "My main goals" },
  { pl: "Nie masz jeszcze żadnych celów.", en: "You do not have any goals yet." },
  { pl: "Wszystkie aktywne cele są już zrealizowane. ✓", en: "All active goals are already completed. ✓" },
  { pl: "Zobacz historię celów", en: "View goal history" },
  { pl: "Dodaj pierwszy cel", en: "Add your first goal" },
  { pl: "Najważniejsze długi, koszt rat i postęp spłaty.", en: "Key debts, payment costs and repayment progress." },
  { pl: "Pozostały dług", en: "Remaining debt" },
  { pl: "Raty / miesiąc", en: "Payments / month" },
  { pl: "Odsetki w ratach", en: "Interest in payments" },
  { pl: "Pozostało do spłaty", en: "Remaining to repay" },
  { pl: "Spłacono", en: "Repaid" },
  { pl: "miesiąc", en: "month" },
  { pl: "Zero zobowiązań. Piękny widok 😎", en: "Zero liabilities. Beautiful 😎" },
  { pl: "Wydatki pod kontrolą", en: "Spending under control" },
  { pl: "Szybki obraz miesiąca bez starego wielkiego donuta.", en: "A quick monthly snapshot without the old giant donut chart." },
  { pl: "Dodaj wydatek", en: "Add expense" },
  { pl: "Wpływy", en: "Income" },
  { pl: "Wydatki", en: "Expenses" },
  { pl: "Wolne środki", en: "Free cash" },
  { pl: "Stopa oszczędności", en: "Savings rate" },
  { pl: "Top kategorie", en: "Top categories" },
  { pl: "Gdzie realnie uciekają pieniądze", en: "Where your money actually goes" },
  { pl: "Ostatnie wydatki", en: "Recent expenses" },
  { pl: "Najświeższe transakcje miesiąca", en: "Latest transactions this month" },
  { pl: "Brak wydatków w tym miesiącu.", en: "No expenses this month." },
  { pl: "Stałe", en: "Fixed" },
  { pl: "Życie", en: "Living" },
  { pl: "Nazwa", en: "Name" },
  { pl: "Kwota", en: "Amount" },
  { pl: "Data", en: "Date" },
  { pl: "Kategoria", en: "Category" },
  { pl: "Wybrano ✓", en: "Selected ✓" },
  { pl: "Anuluj", en: "Cancel" },
  { pl: "Zapisz", en: "Save" },
  { pl: "Zapisz zmiany", en: "Save changes" },
  { pl: "Usuń", en: "Delete" },
  { pl: "Edytuj", en: "Edit" },
  { pl: "Dodaj", en: "Add" },
  { pl: "Gotowe", en: "Done" },
  { pl: "Dzisiaj", en: "Today" },
  { pl: "Historia", en: "History" },
  { pl: "Bieżący miesiąc", en: "Current month" },
  { pl: "Poprzedni miesiąc", en: "Previous month" },
  { pl: "Następny miesiąc", en: "Next month" },
  { pl: "To jest bieżący miesiąc", en: "This is the current month" },
  { pl: "Twój aktualny obraz finansów i droga do wolności.", en: "Your current financial picture and path to freedom." },
  { pl: "Historyczny obraz Twoich finansów.", en: "Historical view of your finances." },
  { pl: "Przychody", en: "Income" },
  { pl: "Przychód", en: "Income" },
  { pl: "Dodaj przychód", en: "Add income" },
  { pl: "Edytuj przychód", en: "Edit income" },
  { pl: "Edytuj wydatek", en: "Edit expense" },
  { pl: "Powtarzaj co miesiąc", en: "Repeat monthly" },
  { pl: "Transakcja będzie oznaczona jako cykliczna.", en: "The transaction will be marked as recurring." },
  { pl: "Gdzie trafiają pieniądze", en: "Where the money goes" },
  { pl: "Źródło środków", en: "Source of funds" },
  { pl: "Bez powiązanego celu", en: "No linked goal" },
  { pl: "Powiązanie z celem", en: "Goal link" },
  { pl: "Wydatek z celu", en: "Goal expense" },
  { pl: "Dodaj aktywo", en: "Add asset" },
  { pl: "Edytuj aktywo", en: "Edit asset" },
  { pl: "Dodaj portfel", en: "Add portfolio" },
  { pl: "Edytuj portfel", en: "Edit portfolio" },
  { pl: "Dodaj cel", en: "Add goal" },
  { pl: "Edytuj cel", en: "Edit goal" },
  { pl: "Dodaj zobowiązanie", en: "Add liability" },
  { pl: "Edytuj zobowiązanie", en: "Edit liability" },
  { pl: "Brak danych", en: "No data" },
  { pl: "Brak aktywów", en: "No assets" },
  { pl: "Brak zobowiązań", en: "No liabilities" },
  { pl: "Generuj prompt", en: "Generate prompt" },
  { pl: "Gotowy prompt", en: "Prompt ready" },
  { pl: "Zamknij miesiąc", en: "Close month" },
  { pl: "Zamknięte miesiące", en: "Closed months" },
  { pl: "Cel finansowy", en: "Financial goal" },
  { pl: "Cel", en: "Target" },
  { pl: "Bez kwoty docelowej", en: "No target amount" },
  { pl: "Gotówka", en: "Cash" },
  { pl: "Akcje / ETF", en: "Stocks / ETFs" },
  { pl: "Obligacje", en: "Bonds" },
  { pl: "Nieruchomości", en: "Real estate" },
  { pl: "Złoto", en: "Gold" },
  { pl: "Krypto", en: "Crypto" },
  { pl: "Inne", en: "Other" },
  { pl: "Hipoteka", en: "Mortgage" },
  { pl: "Kredyt gotówkowy", en: "Cash loan" },
  { pl: "Raty", en: "Installments" },
  { pl: "Karta", en: "Card" },
  { pl: "Wróć", en: "Back" },
  { pl: "Dalej", en: "Next" },
  { pl: "Szczegóły", en: "Details" },
  { pl: "Postęp", en: "Progress" },
  { pl: "Priorytet", en: "Priority" },
  { pl: "Termin", en: "Deadline" },
  { pl: "Miesięczny system operacyjny", en: "Monthly operating system" },
  { pl: "Majątek netto", en: "Net worth" },
  { pl: "Poziom gracza", en: "Player level" },
  { pl: "Główna misja", en: "Primary mission" },
  { pl: "Bieżąca trajektoria", en: "Current trajectory" },
  { pl: "Twój następny ruch", en: "Your next move" },
  { pl: "Rozdziel nadwyżkę", en: "Deploy surplus" },
  { pl: "Luka do terminu", en: "Deadline gap" },
  { pl: "Zgodnie z planem", en: "On track" },
  { pl: "Niedobór", en: "Shortfall" },
  { pl: "Ostatni przegląd", en: "Last review" },
  { pl: "Stopa oszczędności", en: "Savings rate" },
  { pl: "Wynik miesiąca", en: "Month score" },
  { pl: "Status miesiąca", en: "Month status" },
  { pl: "Gotowy do zamknięcia", en: "Ready to close" },
  { pl: "Zamknięty", en: "Closed" },
  { pl: "Plan", en: "Plan" },
  { pl: "Śledź", en: "Track" },
  { pl: "Przegląd", en: "Review" },
  { pl: "Zamknij miesiąc", en: "Close month" },
  { pl: "Rozdziel środki", en: "Route money" },
  { pl: "Lista końca miesiąca", en: "Month end checklist" },
  { pl: "Następne działanie", en: "Next action" },
  { pl: "Otwórz przegląd miesiąca", en: "Open monthly review" },
  { pl: "Zobacz oś finansową", en: "View financial timeline" },
  { pl: "Zamknięta nadwyżka", en: "Closed surplus" },
  { pl: "Zamknięte oszczędności", en: "Closed savings" },
  { pl: "Kamień milowy majątku", en: "Wealth milestone" },
  { pl: "Miesiąc do miesiąca", en: "Month over month" },
  { pl: "Szybki wgląd", en: "Quick insight" },
  { pl: "Droga do wolności", en: "Freedom road" },
  { pl: "TY", en: "YOU" },
  { pl: "GOTOWE", en: "DONE" },
  { pl: "Silnik Freedom", en: "Freedom Engine" },
  { pl: "Pewność danych", en: "Data confidence" },
  { pl: "Cel wolności", en: "Freedom target" },
  { pl: "Wynik Freedom", en: "Freedom score" },
  { pl: "Składowe wyniku", en: "Score breakdown" },
  { pl: "Twoja droga do wolności", en: "Your freedom path" },
  { pl: "Kapitał netto", en: "Net worth" },
  { pl: "Przepływy pieniężne", en: "Cashflow" },
  { pl: "średni przepływ pieniężny", en: "rolling cashflow" },
  { pl: "średnia stopa oszczędności", en: "rolling savings rate" },
  { pl: "Misje", en: "Missions" },
  { pl: "Oparte na celach", en: "Goal driven" },
  { pl: "Inteligencja Freedom", en: "Freedom Intelligence" },
  { pl: "Silnik", en: "Engine" },
  { pl: "Tryb miesięczny", en: "Monthly plan" },
  { pl: "Dodatkowa gotówka", en: "Extra cash" },
  { pl: "SFINANSOWANO", en: "FUNDED" },
  { pl: "ZGODNIE Z PLANEM", en: "ON TRACK" },
  { pl: "NIEDOBÓR", en: "SHORTFALL" },
  { pl: "Październik", en: "October" },
  { pl: "Wrzesień", en: "September" },
  { pl: "Sierpień", en: "August" },
  { pl: "Lipiec", en: "July" },
  { pl: "Czerwiec", en: "June" },
  { pl: "Maj", en: "May" },
  { pl: "Kwiecień", en: "April" },
  { pl: "Marzec", en: "March" },
  { pl: "Luty", en: "February" },
  { pl: "Styczeń", en: "January" },
  { pl: "Listopad", en: "November" },
  { pl: "Grudzień", en: "December" },
  { pl: "Potrzebuje uwagi", en: "Needs attention" },
  { pl: "Budowanie", en: "Building" },
  { pl: "Mocny miesiąc", en: "Strong month" },
  { pl: "Świetny miesiąc", en: "Excellent month" },
  { pl: "Odbudowa", en: "Recovery" },
  { pl: "Solidny miesiąc", en: "Solid month" },
  { pl: "Uruchamianie Freedom", en: "Initializing Freedom" },
  { pl: "DEV: Załaduj dane demo", en: "DEV: Load demo data" },
  { pl: "Symulator Freedom", en: "Freedom Simulator" },
  { pl: "Bieżąca pozycja", en: "Current position" },
  { pl: "Dane na żywo", en: "Live data" },
  { pl: "Prognoza", en: "Projection" },
  { pl: "Laboratorium scenariuszy", en: "Scenario Lab" },
  { pl: "Aktywny", en: "Active" },
  { pl: "Kamienie milowe", en: "Milestones" },
  { pl: "Majątek // Prognoza", en: "Wealth // Projection" },
  { pl: "Werdykt Freedom", en: "Freedom Verdict" },
  { pl: "Miesiąc zamknięty", en: "Month Closed" },
  { pl: "Zmiana przepływów", en: "Cashflow movement" },
  { pl: "Zmiana majątku", en: "Wealth movement" },
  { pl: "Majątek netto a przepływy", en: "Net Worth vs cashflow" },
  { pl: "Zmiana celów", en: "Goals movement" },
  { pl: "+ DODAJ ŚRODKI", en: "+ ADD MONEY" },
  { pl: "Ukończone", en: "Completed" },
  { pl: "Zamykanie celu", en: "Goal completion" },
  { pl: "Portfel → Cel", en: "Portfolio → Goal" },
  { pl: "Wygląd celu", en: "Visual Goal" },
  { pl: "Podgląd", en: "Preview" },
  { pl: "Pokój trofeów", en: "Trophy room" },
  { pl: "Łączne XP", en: "Total XP" },
  { pl: "Kolekcja", en: "Collection" },
  { pl: "Następne odblokowanie", en: "Next unlock" },
  { pl: "Kamienie milowe majątku", en: "Wealth milestones" },
  { pl: "Kolekcja trofeów", en: "Trophy collection" },
  { pl: "Ultra rzadkie", en: "Ultra rare" },
  { pl: "Legendarne", en: "Legendary" },
  { pl: "System budowania majątku", en: "Wealth Operating System" },
  { pl: "System online", en: "System online" },
  { pl: "Buduj majątek.", en: "Build wealth." },
  { pl: "Kupuj wolność.", en: "Buy freedom." },
  { pl: "Twój kapitał. Twoja strategia. Twoja wolność.", en: "Your capital. Your strategy. Your freedom." },
  { pl: "Hasło", en: "Password" },
  { pl: "Potwierdź hasło", en: "Confirm password" },
  { pl: "Bezpieczna sesja JWT", en: "JWT secured session" },
  { pl: "Finansowa oś czasu", en: "Financial Timeline" },
  { pl: "Status osi czasu", en: "Timeline status" },
  { pl: "Trajektoria majątku", en: "Wealth trajectory" },
  { pl: "Na żywo", en: "Live" },
  { pl: "Częściowy", en: "Partial" },
  { pl: "Postęp", en: "Progress" },
  { pl: "Wysoki koszt", en: "High cost" },
  { pl: "Aktywo → Rezerwa zobowiązania", en: "Asset → Liability Reserve" },
  { pl: "Kolejka misji", en: "Mission queue" },
  { pl: "Misje celów", en: "Goal missions" },
  { pl: "Główna misja", en: "Primary mission" },
  { pl: "Router środków", en: "Money Router" },
  { pl: "Tryb miesięczny", en: "Monthly Operating Mode" },
  { pl: "Symulacja jednorazowa", en: "One-Off Simulation" },
  { pl: "Miesięczny plan", en: "Monthly Plan" },
  { pl: "Dodatkowa gotówka", en: "Extra Cash" },
  { pl: "Analiza terminów", en: "Deadline Intelligence" },
  { pl: "Następny kamień milowy", en: "Next milestone" },
  { pl: "Wnioski silnika", en: "Engine insights" },
  { pl: "Główna", en: "Primary" },
  { pl: "Ukończone", en: "Complete" },
  { pl: "Silne", en: "Strong" },
  { pl: "Uwaga", en: "Watch" },
  { pl: "Misja", en: "Mission" },
  { pl: "Szansa", en: "Opportunity" },
  { pl: "Ceny krypto na żywo", en: "Live crypto pricing" },
  { pl: "Ceny akcji / ETF na żywo", en: "Live stock / ETF pricing" },
  { pl: "Importuj XLS", en: "Import XLS" },
  { pl: "NA ŻYWO", en: "LIVE" },
  { pl: "Opłata", en: "fee" },
  { pl: "Bezpieczna sesja", en: "secured session" },
  { pl: "Miesięczne przepływy pieniężne", en: "Monthly Cashflow" },
  { pl: "Analiza przepływów AI", en: "Cashflow AI" },
  { pl: "Budżet AI", en: "Budget AI" },
  { pl: "Osiągnięcie odblokowane", en: "Achievement unlocked" },
  { pl: "Termin", en: "Deadline" },
  { pl: "WYSOKA", en: "HIGH" },
  { pl: "ŚREDNIA", en: "MEDIUM" },
  { pl: "NISKA", en: "LOW" },
  { pl: "Pulpit", en: "Dashboard" },
  { pl: "Angielski", en: "English" },
  { pl: "w tym miesiącu", en: "this month" },
  { pl: "długu", en: "debt" },
  { pl: "Brak aktywnej misji", en: "No active mission" },
  { pl: "Brak trajektorii", en: "No trajectory" },
  { pl: "Bieżąca nadwyżka tego miesiąca — plan alokacji, jeszcze bez automatycznego wykonania.", en: "Current monthly surplus — allocation plan, not executed automatically yet." },
  { pl: "kolejnych pozycji", en: "more items" },
  { pl: "Zamknięty zapis stanu", en: "Closed snapshot" },
  { pl: "Nadwyżka", en: "Surplus" },
  { pl: "Zmiana NW", en: "Net worth change" },
  { pl: "Pierwszy zapis stanu", en: "First snapshot" },
  { pl: "Brak zamkniętego miesiąca.", en: "No closed month yet." },
  { pl: "Porównanie do poprzedniego miesiąca", en: "Comparison with the previous month" },
  { pl: "Miesiąc w skrócie", en: "Month at a glance" },
  { pl: "Gdzie poszły pieniądze?", en: "Where did the money go?" },
  { pl: "Wpływy", en: "Income" },
  { pl: "Bilans", en: "Balance" },
  { pl: "Największa kategoria", en: "Largest category" },
  { pl: "Brak zaksięgowanych przychodów w tym miesiącu.", en: "No income has been posted this month." },
  { pl: "Miesiąc jest obecnie pod kreską.", en: "The month is currently below zero." },
  { pl: "🔥 Ponad połowa dochodu zostaje po wydatkach.", en: "🔥 More than half of your income remains after expenses." },
  { pl: "Solidna nadwyżka. Jesteś powyżej 30% oszczędności.", en: "Solid surplus. You are saving more than 30%." },
  { pl: "Miesiąc jest na plusie, ale jest przestrzeń na większą nadwyżkę.", en: "The month is positive, but there is room for a larger surplus." },
  { pl: "Nadwyżka jest niewielka względem przychodów.", en: "The surplus is small relative to income." },
  { pl: "Zbuduj tarczę", en: "Build The Shield" },
  { pl: "Atak na dług", en: "Debt Attack" },
  { pl: "Tryb inwestora", en: "Investor Mode" },
  { pl: "Zmień przepływy na dodatnie", en: "Turn Cashflow Green" },
  { pl: "Utrzymaj maszynę w ruchu", en: "Keep The Machine Running" },
  { pl: "Droga do wolności", en: "Road To FREE" },
  { pl: "Następny kamień milowy", en: "Next Milestone" },
  { pl: "Nagroda", en: "Reward" },
  { pl: "Zbuduj płynną poduszkę równą 6 miesiącom średnich wydatków.", en: "Build a liquid emergency fund equal to 6 months of average expenses." },
  { pl: "Zredukuj zobowiązania poniżej 10% wartości aktywów brutto.", en: "Reduce liabilities below 10% of gross asset value." },
  { pl: "Zwiększ udział kapitału inwestycyjnego do 50% aktywów brutto.", en: "Increase invested capital to 50% of gross assets." },
  { pl: "Doprowadź średni przepływ pieniężny do dodatniej wartości.", en: "Bring rolling cashflow into positive territory." },
  { pl: "Utrzymuj dodatnie przepływy pieniężne i wysoką stopę oszczędności.", en: "Maintain positive cashflow and a high savings rate." },
  { pl: "Buduj majątek w kierunku głównego celu FREEDOM.", en: "Build wealth toward the main FREEDOM target." },
  { pl: "Przegląd miesiąca", en: "Monthly review" },
  { pl: "Cele · Wydawanie i zamykanie", en: "Goals · Spend & complete" },
  { pl: "Inteligencja zobowiązań", en: "Debt intelligence" },
  { pl: "Kategorie", en: "Categories" },
  { pl: "Szczegółowe kategorie", en: "Detailed categories" },
  { pl: "Wydawanie i zamykanie", en: "Spend & complete" },
  { pl: "Każdy portfel osobno — bez mieszania wszystkich aktywów w jednym wykresie.", en: "Each portfolio is shown separately — assets are not mixed into one chart." },
  { pl: "Codzienny zapis: aktywa minus zobowiązania", en: "Daily snapshot: assets minus liabilities" },
  { pl: "Codzienny snapshot: aktywa minus zobowiązania", en: "Daily snapshot: assets minus liabilities" },
  { pl: "Brak terminu", en: "No deadline" },
  { pl: "Brak deadline", en: "No deadline" },
  { pl: "Cel osiągnięty", en: "Goal reached" },
  { pl: "do celu", en: "to goal" },
  { pl: "Twój finansowy silnik", en: "Your financial engine" },
  { pl: "Składowe wyniku", en: "Score breakdown" },
  { pl: "Kapitał inwestycyjny", en: "Invested capital" },
  { pl: "Płynność", en: "Liquidity" },
  { pl: "aktywa brutto", en: "gross assets" },
  { pl: "aktywów brutto", en: "of gross assets" },
  { pl: "mies. średnich kosztów", en: "months of average expenses" },
  { pl: "drogi do WOLNOŚCI", en: "of the road to FREE" },
  { pl: "Co robimy teraz?", en: "What are we doing now?" },
  { pl: "Usuń z fokusu", en: "Remove from focus" },
  { pl: "Ustaw jako fokus", en: "Set as focus" },
  { pl: "Jak działa kolejka?", en: "How does the queue work?" },
  { pl: "Plan miesięczny", en: "Monthly plan" },
  { pl: "Dodatkowa gotówka", en: "Extra cash" },
  { pl: "Analiza terminów", en: "Deadline Intelligence" },
  { pl: "Miesięczne minimum celów z terminem zabezpieczone", en: "Monthly deadline minimum secured" },
  { pl: "Wymagane", en: "Required" },
  { pl: "przydzielone", en: "allocated" },
  { pl: "Zarządzaj miesięcznymi przepływami pieniężnymi.", en: "Manage your monthly cashflow." },
  { pl: "Wydatki i alokacje", en: "Expenses & allocations" },
  { pl: "Kapitał gotowy do alokacji", en: "Capital ready to allocate" },
  { pl: "Miesiąc na minusie", en: "Month below zero" },
  { pl: "DOSTĘPNE", en: "AVAILABLE" },
  { pl: "WYDATKI", en: "OUTFLOW" },
  { pl: "STOPA OSZCZĘDNOŚCI", en: "SAVINGS RATE" },
  { pl: "Śr. dochód", en: "Avg. income" },
  { pl: "Śr. wydatki", en: "Avg. expenses" },
  { pl: "Śr. nadwyżka", en: "Avg. surplus" },
  { pl: "Wszystkie kamienie milowe osiągnięte.", en: "All milestones reached." },
  { pl: "Twoja droga do wolności", en: "Your freedom path" },
  { pl: "Droga do 3 milionów", en: "Road to PLN 3 million" },
  { pl: "Wybierz swoją główną misję.", en: "Choose your primary mission." },
  { pl: "Źródło", en: "Source" },
  { pl: "Pobierane automatycznie z aktualnych danych finansowych.", en: "Pulled automatically from current financial data." },
  { pl: "Mam dodatkowo", en: "Extra amount" },
  { pl: "Brak dodatniej nadwyżki do rozdysponowania.", en: "No positive surplus available to allocate." },
  { pl: "Classify legacy assets", en: "Classify legacy assets" },
  { pl: "Transakcje cykliczne", en: "Recurring transactions" },
  { pl: "aktywna reguła", en: "active rule" },
  { pl: "aktywnych reguł", en: "active rules" },
  { pl: "Dodaj regułę", en: "Add rule" },
  { pl: "Brak transakcji cyklicznych.", en: "No recurring transactions." },
  { pl: "Nowa reguła cykliczna", en: "New recurring rule" },
  { pl: "Edytuj regułę", en: "Edit recurring rule" },
  { pl: "Zdefiniuj miesięczną transakcję.", en: "Define a monthly transaction." },
  { pl: "Dzień miesiąca", en: "Day of month" },
  { pl: "Obowiązuje od", en: "Starts on" },
  { pl: "W krótszym miesiącu użyjemy ostatniego dnia.", en: "For shorter months, the last day will be used." },
  { pl: "Powtarzalny", en: "Recurring" },
  { pl: "Jednorazowy", en: "One-off" },
  { pl: "Główny", en: "Main" },
  { pl: "Środki nierozdzielone", en: "Unallocated funds" },
  { pl: "Clearing systemowy", en: "System clearing" },
  { pl: "Wybierz źródło pieniędzy", en: "Choose source of funds" },
  { pl: "Wartość portfeli w czasie", en: "Portfolio value over time" },
  { pl: "Łączny majątek", en: "Total net worth" },
  { pl: "Wartość aktywów", en: "Asset value" },
];

const exactLookup = {
  pl: new Map<string, string>(),
  en: new Map<string, string>(),
};

for (const pair of phrasePairs) {
  exactLookup.pl.set(pair.pl, pair.pl);
  exactLookup.pl.set(pair.en, pair.pl);
  exactLookup.en.set(pair.pl, pair.en);
  exactLookup.en.set(pair.en, pair.en);
}

for (const [source, pair] of Object.entries(levelPairs)) {
  exactLookup.pl.set(source, pair.pl);
  exactLookup.en.set(source, pair.en);
  exactLookup.pl.set(pair.pl, pair.pl);
  exactLookup.en.set(pair.pl, pair.en);
}

function translateExact(value: string, language: AppLanguage) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!core) return value;

  const direct = exactLookup[language].get(core);
  if (direct != null) return `${leading}${direct}${trailing}`;

  const levelMatch = core.match(/^Level\s+(\d+)\s+[•·]\s+(.+)$/i) ?? core.match(/^Poziom\s+(\d+)\s+[•·]\s+(.+)$/i) ?? core.match(/^LVL\s+(\d+)\s+[•·]\s+(.+)$/i);
  if (levelMatch) {
    const [, level, rawName] = levelMatch;
    const name = translateLevelName(rawName, language);
    return `${leading}${messages[language].level} ${level} • ${name}${trailing}`;
  }

  const levelOnlyMatch = core.match(/^LEVEL\s+(\d+)$/i) ?? core.match(/^POZIOM\s+(\d+)$/i);
  if (levelOnlyMatch) {
    return `${leading}${language === "pl" ? "POZIOM" : "LEVEL"} ${levelOnlyMatch[1]}${trailing}`;
  }

  const nextLevelMatch = core.match(/^Do następnego poziomu:\s*(.+)$/) ?? core.match(/^To next level:\s*(.+)$/i);
  if (nextLevelMatch) {
    return `${leading}${messages[language].toNextLevel}: ${nextLevelMatch[1]}${trailing}`;
  }

  const monthComparison = core.match(/^(.+?\s+\d{4})\s+(?:vs|a)\s+(.+?\s+\d{4})$/i);
  if (monthComparison) {
    const left = translateSegments(monthComparison[1], language);
    const right = translateSegments(monthComparison[2], language);
    return `${leading}${left} ${language === "pl" ? "a" : "vs"} ${right}${trailing}`;
  }

  return `${leading}${translateSegments(core, language)}${trailing}`;
}

const segmentPairs = [...phrasePairs].sort((a, b) => {
  const aLength = Math.max(a.pl.length, a.en.length);
  const bLength = Math.max(b.pl.length, b.en.length);
  return bLength - aLength;
});

function translateSegments(value: string, language: AppLanguage) {
  let result = value;
  const sourceKey = language === "pl" ? "en" : "pl";
  const targetKey = language;

  for (const pair of segmentPairs) {
    const source = pair[sourceKey];
    const target = pair[targetKey];
    if (!source || source === target || !result.includes(source)) continue;
    result = result.split(source).join(target);
  }

  if (language === "pl") {
    result = result
      .replace(/\bLVL\s+(\d+)/g, "POZIOM $1")
      .replace(/\bScore\b/g, "Wynik")
      .replace(/\blive\b/gi, "na żywo")
      .replace(/\bsnapshot\b/gi, "zapis stanu");
  } else {
    result = result
      .replace(/\bPOZIOM\s+(\d+)/g, "LEVEL $1")
      .replace(/\bWynik\b/g, "Score")
      .replace(/\bna żywo\b/gi, "live")
      .replace(/\bzapis stanu\b/gi, "snapshot");
  }

  return result;
}

function translateAttributes(root: ParentNode, language: AppLanguage) {
  const elements = root instanceof Element
    ? [root, ...Array.from(root.querySelectorAll("[title], [aria-label], [placeholder]"))]
    : Array.from(root.querySelectorAll("[title], [aria-label], [placeholder]"));
  for (const element of elements) {
    for (const attribute of ["title", "aria-label", "placeholder"]) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const translated = translateExact(value, language);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }
}

function translateTree(root: ParentNode, language: AppLanguage) {
  if (root instanceof Element && ["SCRIPT", "STYLE", "TEXTAREA"].includes(root.tagName)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
      const original = node.nodeValue ?? "";
      const translated = translateExact(original, language);
      if (translated !== original) node.nodeValue = translated;
    }
    node = walker.nextNode();
  }

  translateAttributes(root, language);
}

type LanguageContextValue = {
  language: AppLanguage;
  locale: "pl-PL" | "en-US";
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  levelName: (name: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "pl";
  });

  const setLanguage = (next: AppLanguage) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;

    const apply = (root: ParentNode = document.body) => translateTree(root, language);
    apply();

    const observer = new MutationObserver((mutations) => {
      observer.disconnect();
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target.parentNode) {
          translateTree(mutation.target.parentNode, language);
          continue;
        }
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) translateTree(node, language);
          else if (node.parentNode) translateTree(node.parentNode, language);
        }
      }
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["title", "aria-label", "placeholder"],
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "aria-label", "placeholder"],
    });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: language === "pl" ? "pl-PL" : "en-US",
      setLanguage,
      t: (key) => messages[language][key],
      levelName: (name) => translateLevelName(name, language),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function translateLevelName(name: string, language: AppLanguage) {
  const direct = levelPairs[name];
  if (direct) return direct[language];
  const entry = Object.values(levelPairs).find((pair) => pair.pl === name || pair.en === name);
  return entry ? entry[language] : name;
}
