export type PortfolioImagePosition = "top" | "center" | "bottom";

export const portfolioImagePresets = [
  {
    key: "main",
    label: "Główny",
    url: "/portfolios/main.webp",
  },
  {
    key: "long-term",
    label: "Długoterminowy",
    url: "/portfolios/long-term.webp",
  },
  {
    key: "debt-payoff",
    label: "Nadpłaty kredytu",
    url: "/portfolios/debt-payoff.webp",
  },
  {
    key: "short-term",
    label: "Krótkoterminowy",
    url: "/portfolios/short-term.webp",
  },
  {
    key: "emergency-fund",
    label: "Poduszka finansowa",
    url: "/portfolios/emergency-fund.webp",
  },
] as const;

export const defaultPortfolioImage = "/portfolios/long-term.webp";

export function suggestedPortfolioImage(name: string): string {
  const normalized = name.toLocaleLowerCase("pl-PL");

  if (normalized.includes("poduszk") || normalized.includes("awaryj")) {
    return "/portfolios/emergency-fund.webp";
  }
  if (normalized.includes("kredyt") || normalized.includes("nadpłat") || normalized.includes("nadplat")) {
    return "/portfolios/debt-payoff.webp";
  }
  if (normalized.includes("krótkotermin") || normalized.includes("krotkotermin")) {
    return "/portfolios/short-term.webp";
  }
  if (normalized.includes("główn") || normalized.includes("glown")) {
    return "/portfolios/main.webp";
  }
  return defaultPortfolioImage;
}
