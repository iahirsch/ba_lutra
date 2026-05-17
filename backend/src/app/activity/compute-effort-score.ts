function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export interface EffortScoreInput {
  distanceMeters: number;
  durationSeconds: number;
  sufferScore: number | null;
}

/** Reference duration 5min. */
const DURATION_REF_SECONDS = 5 * 60;

/** Reference distance 1km. */
const DISTANCE_REF_METERS = 1_000;

/** Reference suffer score 80. */
const SUFFER_REF = 80;

/**
 * Normalized effort 0–1 for exhibition session.
 */
export function computeEffortScore(input: EffortScoreInput): number {
  const { distanceMeters, durationSeconds, sufferScore } = input;

  const durationNorm = clamp01(durationSeconds / DURATION_REF_SECONDS);
  const distanceNorm = clamp01(distanceMeters / DISTANCE_REF_METERS);

  const sufferNorm =
    sufferScore != null && sufferScore > 0
      ? clamp01(sufferScore / SUFFER_REF)
      : null;

  const effort =
    sufferNorm != null
      ? 0.45 * durationNorm + 0.45 * distanceNorm + 0.1 * sufferNorm
      : 0.5 * durationNorm + 0.5 * distanceNorm;

  return Math.round(clamp01(effort) * 1000) / 1000;
}
