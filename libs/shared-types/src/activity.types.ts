export interface Activity {
  id: string;
  stravaActivityId: string;
  companionId: string | null;
  name: string | null;
  type: string;
  durationSeconds: number;
  distanceMeters: number;
  sufferScore: number;
  /** Normalized effort 0–1. */
  effortScore: number;
  startedAt: string;
  createdAt: string;
}
