import { Crown } from "lucide-react";

type HeaderProps = {
  level: number;
  levelName: string;
};

export function Header({ level, levelName }: HeaderProps) {
  return (
    <header className="flex items-center border-b border-slate-800 pb-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 shadow-lg shadow-amber-950/10">
          <Crown size={23} className="text-amber-400" />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Cześć, Andrew!</h1>
          <p className="mt-0.5 text-sm font-medium text-blue-300">Level {level} • {levelName}</p>
        </div>
      </div>
    </header>
  );
}
