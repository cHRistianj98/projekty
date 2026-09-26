import { freedomLevels } from "../data/levels";
import type { FreedomLevel } from "../types/Level";

export type LevelProgress = {
  currentLevel: FreedomLevel;
  nextLevel: FreedomLevel | null;

  progress: number;

  currentAmount: number;
  targetAmount: number | null;
  remainingAmount: number;
};

export function calculateLevelProgress(
  netWorth: number
): LevelProgress {
  const safeNetWorth = Math.max(netWorth, 0);

  const currentLevel =
    [...freedomLevels]
      .reverse()
      .find(
        (level) =>
          safeNetWorth >= level.minNetWorth
      ) ?? freedomLevels[0];

  const nextLevel =
    freedomLevels.find(
      (level) =>
        level.level === currentLevel.level + 1
    ) ?? null;

  if (
    currentLevel.maxNetWorth === null ||
    nextLevel === null
  ) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      currentAmount: safeNetWorth,
      targetAmount: null,
      remainingAmount: 0,
    };
  }

  const range =
    currentLevel.maxNetWorth -
    currentLevel.minNetWorth;

  const progressInsideLevel =
    safeNetWorth -
    currentLevel.minNetWorth;

  const progress =
    range <= 0
      ? 100
      : Math.min(
          Math.max(
            (progressInsideLevel / range) * 100,
            0
          ),
          100
        );

  return {
    currentLevel,
    nextLevel,
    progress,
    currentAmount: safeNetWorth,
    targetAmount: currentLevel.maxNetWorth,
    remainingAmount: Math.max(
      currentLevel.maxNetWorth - safeNetWorth,
      0
    ),
  };
}