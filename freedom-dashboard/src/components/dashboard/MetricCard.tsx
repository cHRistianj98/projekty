import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  progress: number;
  icon: ReactNode;
  progressColor?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  progress,
  icon,
  progressColor = "bg-blue-500",
}: MetricCardProps) {
  return (
    <div className="
      rounded-2xl
      border border-slate-800
      bg-slate-900/70
      p-5
      shadow-xl
    ">
      <div className="flex items-center gap-3">

        <div className="
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          bg-slate-800
        ">
          {icon}
        </div>

        <span className="
          text-xs
          font-semibold
          uppercase
          tracking-wider
          text-slate-400
        ">
          {title}
        </span>

      </div>

      <div className="mt-4 text-3xl font-bold">
        {value}
      </div>

      <div className="mt-1 text-sm text-slate-400">
        {subtitle}
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">

          <div
            className={`h-full rounded-full ${progressColor}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />

        </div>

        <div className="mt-2 text-right text-xs text-slate-400">
          {progress.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}