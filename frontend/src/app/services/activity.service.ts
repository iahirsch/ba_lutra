import axios from 'axios';
import type { Activity } from '@ba-praktisch/shared-types';

export async function getActivities(): Promise<Activity[]> {
  const { data } = await axios.get<Activity[]>('/api/activity');
  return data;
}
