import axios from 'axios';
import type { Activity } from '@ba-praktisch/shared-types';

export async function getActivities(): Promise<Activity[]> {
  const { data } = await axios.get<Activity[]>('/api/activity');
  return data;
}

/** Latest linked activity per companion (by `startedAt`). */
export function latestActivityByCompanion(
  activities: Activity[],
): Map<string, Activity> {
  const map = new Map<string, Activity>();
  for (const activity of activities) {
    if (!activity.companionId) continue;
    const existing = map.get(activity.companionId);
    if (
      !existing ||
      new Date(activity.startedAt).getTime() >
        new Date(existing.startedAt).getTime()
    ) {
      map.set(activity.companionId, activity);
    }
  }
  return map;
}

export async function fetchLatestActivitiesByCompanion(): Promise<
  Map<string, Activity>
> {
  return latestActivityByCompanion(await getActivities());
}
