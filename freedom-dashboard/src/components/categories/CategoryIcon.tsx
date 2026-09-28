import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function CategoryIcon({ iconKey, className = "h-5 w-5" }: { iconKey: string; className?: string }) {
  const Icon = ((Icons as unknown as Record<string, LucideIcon>)[iconKey] ?? Icons.CircleHelp) as LucideIcon;
  return <Icon className={className} strokeWidth={2} />;
}
