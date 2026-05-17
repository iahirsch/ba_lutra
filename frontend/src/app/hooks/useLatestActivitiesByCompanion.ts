import { useEffect, useState } from 'react';
import type { Activity } from '@ba-praktisch/shared-types';
import { fetchLatestActivitiesByCompanion } from '../services/activity.service';

function companionIdsKey(ids: readonly string[]): string {
  return [...ids].sort().join(',');
}

/**
 * Latest linked activity per companion; shared by admin and hub.
 * Refetches when `companionIds` changes (e.g. a companion enters the hub).
 */
export function useLatestActivitiesByCompanion(companionIds: readonly string[]) {
  const [byCompanion, setByCompanion] = useState<Map<string, Activity>>(
    () => new Map(),
  );

  const key = companionIdsKey(companionIds);

  useEffect(() => {
    let cancelled = false;

    fetchLatestActivitiesByCompanion()
      .then((map) => {
        if (!cancelled) setByCompanion(map);
      })
      .catch((err) => {
        console.error('Failed to load activities:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return byCompanion;
}
