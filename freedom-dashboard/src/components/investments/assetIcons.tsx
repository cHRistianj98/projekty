import type { ComponentType } from "react";
import {
  Banknote,
  Bitcoin,
  BriefcaseBusiness,
  Building2,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  Coins,
  Gem,
  House,
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Vault,
  WalletCards,
} from "lucide-react";

import type { AssetIconKey } from "../../types/Asset";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

function GoldBars({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 13.25h6.75l1.5 5.25H3l1.5-5.25Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12.75 13.25h6.75L21 18.5h-9.75l1.5-5.25Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M8.6 5.5h6.8l1.5 5.25H7.1L8.6 5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9.8 8.25h4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".75"/>
    </svg>
  );
}

function SilverCoin({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="12" cy="12" r="5.4" stroke="currentColor" strokeWidth="1.2" opacity=".65"/>
      <path d="M14.8 8.8c-.65-.62-1.55-.95-2.62-.95-1.4 0-2.48.69-2.48 1.8 0 1.14.95 1.55 2.6 1.94 1.49.35 2.25.76 2.25 1.82 0 1.17-1.04 1.9-2.55 1.9-1.15 0-2.13-.38-2.9-1.12M12 6.8v10.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
    </svg>
  );
}

export const assetIconOptions: Array<{
  key: AssetIconKey;
  label: string;
  icon: IconComponent;
}> = [
  { key: "landmark", label: "Bank", icon: Landmark },
  { key: "wallet", label: "Portfel", icon: WalletCards },
  { key: "banknote", label: "Gotówka", icon: Banknote },
  { key: "coins", label: "Monety", icon: Coins },
  { key: "goldBars", label: "Sztabki złota", icon: GoldBars },
  { key: "silverCoin", label: "Srebrna moneta", icon: SilverCoin },
  { key: "piggyBank", label: "Oszczędności", icon: PiggyBank },
  { key: "trendingUp", label: "Wzrost", icon: TrendingUp },
  { key: "chart", label: "Rynek", icon: ChartNoAxesCombined },
  { key: "bitcoin", label: "Bitcoin", icon: Bitcoin },
  { key: "circleDollar", label: "Kapitał", icon: CircleDollarSign },
  { key: "building", label: "Nieruchomość", icon: Building2 },
  { key: "house", label: "Dom", icon: House },
  { key: "briefcase", label: "Biznes", icon: BriefcaseBusiness },
  { key: "car", label: "Samochód", icon: Car },
  { key: "shield", label: "Bezpieczeństwo", icon: ShieldCheck },
  { key: "gem", label: "Wartość", icon: Gem },
  { key: "vault", label: "Sejf", icon: Vault },
];

const iconMap = Object.fromEntries(
  assetIconOptions.map((option) => [option.key, option.icon])
) as Record<AssetIconKey, IconComponent>;

export function AssetIcon({
  iconKey,
  size = 22,
  className,
}: {
  iconKey: AssetIconKey;
  size?: number;
  className?: string;
}) {
  const Icon = iconMap[iconKey] ?? CircleDollarSign;
  return <Icon size={size} className={className} />;
}
