import { useMemo } from 'react';
import { useLatestActivitiesByCompanion } from './useLatestActivitiesByCompanion';

/** Sum of effortScore across all companions with linked activities. */
export function useTotalEffortScore(refreshToken?: number): number {
  const latestActivitiesByCompanion = useLatestActivitiesByCompanion(
    [],
    refreshToken,
  );

  return useMemo(() => {
    let total = 0;
    for (const activity of latestActivitiesByCompanion.values()) {
      total += activity.effortScore;
    }
    return total;
  }, [latestActivitiesByCompanion]);
}
