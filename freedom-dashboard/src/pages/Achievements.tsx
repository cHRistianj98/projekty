import {
  Check,
  Crown,
  LockKeyhole,
  Sparkles,
  Target,
  TestTube2,
  Trophy,
} from "lucide-react";

import type { MonthlyBudget } from "../types/Cashflow";
import type { Asset } from "../types/Asset";
import type { Goal } from "../types/Goal";
import type { Liability } from "../types/Liability";
import {
  calculatePlayerLevel,
  calculateTotalAchievementXp,
  getAchievements,
  type Achievement,
  type AchievementRarity,
} from "../features/achievements/achievementEngine";

type AchievementsProps = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

const rarityStyles: Record<
  AchievementRarity,
  {
    label: string;
    border: string;
    background: string;
    text: string;
    badge: string;
  }
> = {
  common: {
    label: "COMMON",
    border: "border-slate-700",
    background: "bg-slate-900/50",
    text: "text-slate-300",
    badge: "bg-slate-700/50 text-slate-300",
  },
  rare: {
    label: "RARE",
    border: "border-blue-500/30",
    background: "bg-blue-500/5",
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400",
  },
  epic: {
    label: "EPIC",
    border: "border-violet-500/30",
    background: "bg-violet-500/5",
    text: "text-violet-400",
    badge: "bg-violet-500/10 text-violet-400",
  },
  legendary: {
    label: "LEGENDARY",
    border: "border-amber-500/30",
    background: "bg-amber-500/5",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400",
  },
};

export function Achievements(props: AchievementsProps) {
  const achievements = getAchievements(props);
  const unlocked = achievements.filter((item) => item.unlocked);
  const locked = achievements.filter((item) => !item.unlocked);
  const totalXp = calculateTotalAchievementXp(achievements);
  const playerLevel = calculatePlayerLevel(totalXp);

  const completion =
    achievements.length > 0
      ? (unlocked.length / achievements.length) * 100
      : 0;

  const nextAchievement = [...locked].sort(
    (a, b) => b.progress - a.progress
  )[0];

  function testPopup() {
    window.dispatchEvent(
      new CustomEvent("freedom:test-achievement")
    );
  }

  return (
    <main className="min-h-screen bg-[#050b16] p-8 text-white">
      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-400">
              Achievements
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Twoja finansowa gra
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Buduj majątek, utrzymuj dodatni cashflow i odblokowuj
            kolejne osiągnięcia.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={testPopup}
            className="flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-violet-300 transition hover:bg-violet-500/20"
          >
            <TestTube2 size={17} />
            DEV: test popup
          </button>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Trophy room
            </p>
            <p className="mt-1 text-2xl font-black">
              {unlocked.length} / {achievements.length}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-[#0b1322] to-[#0b1322] p-7 xl:col-span-2">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-blue-400 shadow-lg shadow-blue-500/10">
                  <Crown size={38} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                    Player level
                  </p>
                  <h2 className="mt-1 text-3xl font-black">
                    LEVEL {playerLevel.level}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {playerLevel.name}
                  </p>
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                  Total XP
                </p>
                <p className="mt-1 text-3xl font-black text-blue-400">
                  {totalXp.toLocaleString("pl-PL")} XP
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  LEVEL {playerLevel.level}
                </span>
                <span className="font-bold text-blue-400">
                  {playerLevel.currentXp.toLocaleString("pl-PL")} /{" "}
                  {playerLevel.requiredXp.toLocaleString("pl-PL")} XP
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                  style={{ width: `${playerLevel.progress}%` }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-600">
                <span>{playerLevel.progress.toFixed(0)}% poziomu</span>
                <span>
                  {playerLevel.remainingXp.toLocaleString("pl-PL")} XP
                  do następnego
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Collection
          </p>
          <p className="mt-3 text-4xl font-black">
            {completion.toFixed(0)}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            ukończonej kolekcji
          </p>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <SmallMetric
              label="Odblokowane"
              value={`${unlocked.length}`}
              accent
            />
            <SmallMetric
              label="Pozostało"
              value={`${locked.length}`}
            />
          </div>
        </div>
      </section>

      {nextAchievement && (
        <section className="mt-5 rounded-2xl border border-blue-500/20 bg-[#0b1322] p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <Target size={25} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                  Next unlock
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {nextAchievement.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {nextAchievement.description}
                </p>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  {formatAchievementValue(
                    nextAchievement.current,
                    nextAchievement.unit
                  )}
                </span>
                <span className="font-bold text-blue-400">
                  {formatAchievementValue(
                    nextAchievement.target,
                    nextAchievement.unit
                  )}
                </span>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${nextAchievement.progress}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-right text-xs font-bold text-amber-400">
                +{nextAchievement.xp} XP
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
          Wealth milestones
        </p>
        <h2 className="mt-2 text-xl font-black">Droga do FREE</h2>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
          {achievements
            .filter((item) => item.category === "wealth")
            .map((achievement, index) => (
              <WealthMilestone
                key={achievement.id}
                achievement={achievement}
                artworkIndex={index}
              />
            ))}
        </div>
      </section>

      <section className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          Trophy collection
        </p>
        <h2 className="mt-2 text-2xl font-black">Osiągnięcia</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-[#0b1322] to-violet-500/5 p-7">
        <div className="flex items-center gap-3">
          <Sparkles size={22} className="text-amber-400" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Ultra rare
            </p>
            <h2 className="mt-1 text-xl font-black">
              Legendarne osiągnięcia
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {achievements
            .filter((item) => item.rarity === "legendary")
            .map((achievement) => (
              <LegendaryCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
        </div>
      </section>
    </main>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  const style = rarityStyles[achievement.rarity];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition ${
        achievement.unlocked
          ? `${style.border} ${style.background}`
          : "border-slate-800 bg-[#0b1322] opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            achievement.unlocked
              ? style.badge
              : "bg-slate-800 text-slate-600"
          }`}
        >
          {achievement.unlocked ? (
            achievement.icon
          ) : (
            <LockKeyhole size={21} />
          )}
        </div>

        <div className="text-right">
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-black tracking-wider ${
              achievement.unlocked
                ? style.badge
                : "bg-slate-800 text-slate-600"
            }`}
          >
            {style.label}
          </span>
          <p className="mt-2 text-xs font-bold text-amber-400">
            +{achievement.xp} XP
          </p>
        </div>
      </div>

      <h3
        className={`mt-5 text-lg font-black ${
          achievement.unlocked
            ? "text-white"
            : "text-slate-500"
        }`}
      >
        {achievement.name}
      </h3>

      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
        {achievement.description}
      </p>

      <div className="mt-5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">
            {formatAchievementValue(
              achievement.current,
              achievement.unit
            )}
          </span>
          <span
            className={
              achievement.unlocked
                ? style.text
                : "text-slate-600"
            }
          >
            {achievement.unlocked
              ? "UNLOCKED"
              : formatAchievementValue(
                  achievement.target,
                  achievement.unit
                )}
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${
              achievement.unlocked
                ? getProgressColor(achievement.rarity)
                : "bg-slate-700"
            }`}
            style={{ width: `${achievement.progress}%` }}
          />
        </div>
      </div>

      {achievement.unlocked && (
        <div className="absolute right-4 top-20 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <Check size={15} />
        </div>
      )}
    </div>
  );
}

function WealthMilestone({
  achievement,
  artworkIndex,
}: {
  achievement: Achievement;
  artworkIndex: number;
}) {
  return (
    <div
      className={`group relative min-h-[150px] overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        achievement.unlocked
          ? "border-blue-400/40 shadow-blue-500/10"
          : "border-slate-800"
      }`}
    >
      <div
        className="absolute inset-0 bg-no-repeat transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: "url('/levels/levels.png')",
          backgroundSize: "700% 100%",
          backgroundPosition: `${(artworkIndex / 6) * 100}% center`,
        }}
      />

      <div
        className={`absolute inset-0 ${
          achievement.unlocked
            ? "bg-gradient-to-t from-[#06101f] via-[#06101f]/55 to-transparent"
            : "bg-gradient-to-t from-[#050b16] via-[#050b16]/80 to-[#050b16]/45 grayscale-[55%]"
        }`}
      />

      <div className="relative flex min-h-[150px] flex-col items-center justify-between p-3 text-center">
        <div className="flex w-full justify-end">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md ${
              achievement.unlocked
                ? "border-blue-400/40 bg-blue-500/20 text-blue-300"
                : "border-slate-600/50 bg-black/35 text-slate-400"
            }`}
          >
            {achievement.unlocked ? (
              <Check size={16} />
            ) : (
              <LockKeyhole size={14} />
            )}
          </div>
        </div>

        <div className="w-full rounded-xl border border-white/10 bg-black/30 px-2 py-2 backdrop-blur-sm">
          <p className="text-sm font-black text-white drop-shadow-lg">
            {formatCompactMoney(achievement.target)}
          </p>
          <p className={`mt-1 text-[9px] font-black uppercase tracking-wider ${
            achievement.unlocked ? "text-blue-300" : "text-slate-400"
          }`}>
            {achievement.name}
          </p>
        </div>
      </div>
    </div>
  );
}

function LegendaryCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 text-center ${
        achievement.unlocked
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-slate-800 bg-[#08111f]"
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
          achievement.unlocked
            ? "bg-amber-500/15 text-amber-400"
            : "bg-slate-800 text-slate-600"
        }`}
      >
        {achievement.unlocked ? (
          achievement.icon
        ) : (
          <LockKeyhole size={26} />
        )}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-500">
        Legendary
      </p>
      <h3 className="mt-2 text-xl font-black">{achievement.name}</h3>
      <p className="mt-2 text-sm text-slate-500">
        {achievement.description}
      </p>
      <p className="mt-5 font-black text-amber-400">
        +{achievement.xp} XP
      </p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-black ${
          accent ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getProgressColor(rarity: AchievementRarity) {
  switch (rarity) {
    case "common":
      return "bg-slate-400";
    case "rare":
      return "bg-blue-500";
    case "epic":
      return "bg-violet-500";
    case "legendary":
      return "bg-amber-500";
  }
}

function formatAchievementValue(
  value: number,
  unit: Achievement["unit"]
) {
  if (unit === "money") {
    return `${Math.round(value).toLocaleString("pl-PL")} zł`;
  }

  if (unit === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return Math.round(value).toLocaleString("pl-PL");
}

function formatCompactMoney(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("pl-PL", {
      maximumFractionDigits: 1,
    })}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return `${value}`;
}
