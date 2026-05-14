export interface Activity {
  id: string;
  stravaActivityId: string;
  companionId: string | null;
  name: string | null;
  type: string;
  durationSeconds: number;
  distanceMeters: number;
  intensityScore: number;
  startedAt: string;
  createdAt: string;
}
