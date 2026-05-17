function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export interface EffortScoreInput {
  distanceMeters: number;
  durationSeconds: number;
  sufferScore: number | null;
  averageSpeedMps?: number;
}

/**
 * Normalized effort 0–1 from distance, pace, and optional Strava suffer score.
 * Tuned for treadmill-style runs (reference 2km, 12.6 km/h (3.5 m/s)).
 */
export function computeEffortScore(input: EffortScoreInput): number {
  const { distanceMeters, durationSeconds, sufferScore } = input;

  const distanceNorm = clamp01(distanceMeters / 2_000);

  const speedMps =
    input.averageSpeedMps ??
    (durationSeconds > 0 ? distanceMeters / durationSeconds : 0);
  const speedNorm = clamp01(speedMps / 3.5);

  const sufferNorm =
    sufferScore != null && sufferScore > 0 ? clamp01(sufferScore / 80) : null;

  let effort: number;
  if (sufferNorm != null) {
    effort = 0.5 * sufferNorm + 0.3 * distanceNorm + 0.2 * speedNorm;
  } else {
    effort = 0.55 * distanceNorm + 0.45 * speedNorm;
  }

  return Math.round(clamp01(effort) * 1000) / 1000;
}
