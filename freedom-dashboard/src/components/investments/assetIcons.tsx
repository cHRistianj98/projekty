import type { LucideIcon } from "lucide-react";
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

export const assetIconOptions: Array<{
  key: AssetIconKey;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "landmark", label: "Bank", icon: Landmark },
  { key: "wallet", label: "Portfel", icon: WalletCards },
  { key: "banknote", label: "Gotówka", icon: Banknote },
  { key: "coins", label: "Monety", icon: Coins },
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
) as Record<AssetIconKey, LucideIcon>;

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
