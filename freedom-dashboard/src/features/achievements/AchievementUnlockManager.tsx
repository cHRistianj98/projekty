import { useEffect, useMemo, useRef, useState } from "react";
import { Zap } from "lucide-react";
import type { MonthlyBudget } from "../../types/Cashflow";
import type { Asset } from "../../types/Asset";
import type { Goal } from "../../types/Goal";
import type { Liability } from "../../types/Liability";
import {
  getAchievements,
  type Achievement,
} from "./achievementEngine";
import { AchievementUnlockPopup } from "./AchievementUnlockPopup";

type Props = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

const STORAGE_KEY = "freedom-seen-achievements-v1";

export function AchievementUnlockManager(props: Props) {
  const achievements = useMemo(
    () => getAchievements(props),
    [
      props.netWorth,
      props.portfolio,
      props.goals,
      props.liabilities,
      props.monthlyBudget,
    ]
  );

  const [queue, setQueue] = useState<Achievement[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    const unlocked = achievements.filter(
      (achievement) => achievement.unlocked
    );

    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // Pierwsze uruchomienie feature'a:
      // zapisujemy obecne unlocki bez spamowania popupami.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(unlocked.map((achievement) => achievement.id))
      );
      initialized.current = true;
      return;
    }

    let seen: string[] = [];

    try {
      seen = JSON.parse(stored);
    } catch {
      seen = [];
    }

    const newUnlocks = unlocked.filter(
      (achievement) => !seen.includes(achievement.id)
    );

    if (newUnlocks.length > 0) {
      const updatedSeen = [
        ...new Set([
          ...seen,
          ...newUnlocks.map((achievement) => achievement.id),
        ]),
      ];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedSeen)
      );

      setQueue((current) => {
        const queuedIds = new Set(
          current.map((achievement) => achievement.id)
        );

        return [
          ...current,
          ...newUnlocks.filter(
            (achievement) => !queuedIds.has(achievement.id)
          ),
        ];
      });
    }

    initialized.current = true;
  }, [achievements]);

  useEffect(() => {
    function handleTest() {
      const testAchievement: Achievement = {
        id: `dev-test-${Date.now()}`,
        name: "Monster Month",
        description:
          "DEV TEST — tak będzie wyglądało prawdziwe odblokowanie achievementu.",
        category: "cashflow",
        rarity: "epic",
        xp: 350,
        unlocked: true,
        progress: 100,
        current: 20_000,
        target: 20_000,
        unit: "money",
        icon: <Zap size={22} />,
      };

      setQueue((current) => [...current, testAchievement]);
    }

    window.addEventListener(
      "freedom:test-achievement",
      handleTest
    );

    return () => {
      window.removeEventListener(
        "freedom:test-achievement",
        handleTest
      );
    };
  }, []);

  const currentAchievement = queue[0];

  if (!currentAchievement) return null;

  return (
    <AchievementUnlockPopup
      achievement={currentAchievement}
      onClose={() =>
        setQueue((current) => current.slice(1))
      }
    />
  );
}
