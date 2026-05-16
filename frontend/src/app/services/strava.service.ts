import axios from 'axios';

export interface StravaStatus {
  connected: boolean;
  athleteName: string | null;
  athleteId: string | null;
}

export async function getStravaStatus(): Promise<StravaStatus> {
  const { data } = await axios.get<StravaStatus>('/api/strava/status');
  return data;
}

export function redirectToStravaAuth(): void {
  window.location.href = '/api/strava/auth';
}

export async function disconnectStrava(): Promise<void> {
  await axios.delete('/api/strava/connection');
}
