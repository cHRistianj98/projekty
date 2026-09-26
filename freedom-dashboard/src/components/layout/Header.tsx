import {
  Crown,
  CalendarDays,
} from "lucide-react";

type HeaderProps = {
  level: number;
  levelName: string;
};

export function Header({
  level,
  levelName,
}: HeaderProps) {
  return (
    <header
      className="
        flex items-center
        justify-between
        border-b border-slate-800
        pb-6
      "
    >
      <div className="flex items-center gap-4">

        <div
          className="
            flex h-14 w-14
            items-center justify-center
            rounded-2xl
            border border-amber-500/20
            bg-amber-500/10
            text-amber-400
          "
        >
          <Crown size={30} />
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Cześć, Andrew!
          </h2>

          <p className="text-slate-400">
            Level {level} • {levelName}
          </p>
        </div>

      </div>

      <div
        className="
          flex items-center gap-3
          rounded-xl
          border border-slate-800
          bg-slate-900
          px-4 py-3
          text-sm text-slate-300
        "
      >
        <CalendarDays size={18} />

        <span>
          26 września 2026
        </span>
      </div>
    </header>
  );
}