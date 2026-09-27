import { Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Achievement,
  AchievementRarity,
} from "./achievementEngine";

type Props = {
  achievement: Achievement;
  onClose: () => void;
  duration?: number;
};

const styles: Record<
  AchievementRarity,
  {
    label: string;
    border: string;
    glow: string;
    icon: string;
    badge: string;
    bar: string;
  }
> = {
  common: {
    label: "COMMON",
    border: "border-slate-500/40",
    glow: "shadow-[0_0_50px_rgba(148,163,184,0.12)]",
    icon: "bg-slate-500/10 text-slate-300",
    badge: "bg-slate-500/10 text-slate-300",
    bar: "bg-slate-400",
  },
  rare: {
    label: "RARE",
    border: "border-blue-500/40",
    glow: "shadow-[0_0_55px_rgba(59,130,246,0.18)]",
    icon: "bg-blue-500/10 text-blue-400",
    badge: "bg-blue-500/10 text-blue-400",
    bar: "bg-blue-500",
  },
  epic: {
    label: "EPIC",
    border: "border-violet-500/40",
    glow: "shadow-[0_0_60px_rgba(139,92,246,0.22)]",
    icon: "bg-violet-500/10 text-violet-400",
    badge: "bg-violet-500/10 text-violet-400",
    bar: "bg-violet-500",
  },
  legendary: {
    label: "LEGENDARY",
    border: "border-amber-500/50",
    glow: "shadow-[0_0_70px_rgba(245,158,11,0.24)]",
    icon: "bg-amber-500/10 text-amber-400",
    badge: "bg-amber-500/10 text-amber-400",
    bar: "bg-amber-500",
  },
};

export function AchievementUnlockPopup({
  achievement,
  onClose,
  duration = 5000,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const style = styles[achievement.rarity];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const closeTimer = window.setTimeout(() => beginClose(), duration);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(closeTimer);
    };
  }, [achievement.id, duration]);

  function beginClose() {
    setClosing(true);
    window.setTimeout(onClose, 280);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-start justify-center px-5 pt-8">
      <div
        className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border bg-[#08111f]/95 backdrop-blur-xl transition-all duration-300 ${style.border} ${style.glow} ${
          visible && !closing
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-5 scale-95 opacity-0"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <button
          onClick={beginClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
          aria-label="Zamknij"
        >
          <X size={18} />
        </button>

        <div className="p-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Trophy size={31} />
          </div>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.28em] text-amber-400">
            Achievement unlocked
          </p>

          <div
            className={`mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-3xl ${style.icon}`}
          >
            <div className="scale-150">{achievement.icon}</div>
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight text-white">
            {achievement.name}
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            {achievement.description}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <span
              className={`rounded-lg px-3 py-1.5 text-[10px] font-black tracking-[0.18em] ${style.badge}`}
            >
              {style.label}
            </span>

            <span className="text-sm font-black text-amber-400">
              +{achievement.xp} XP
            </span>
          </div>
        </div>

        <div className="h-1 bg-slate-800">
          <div
            key={achievement.id}
            className={`h-full ${style.bar}`}
            style={{
              animation: `achievementTimer ${duration}ms linear forwards`,
            }}
          />
        </div>

        <style>{`
          @keyframes achievementTimer {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
