import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardSectionLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-black text-cyan-400 transition hover:bg-cyan-500/10 hover:text-cyan-300"
    >
      {children}
      <ArrowRight size={15} />
    </button>
  );
}
