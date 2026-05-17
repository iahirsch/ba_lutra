import type { Activity } from '@ba-praktisch/shared-types';
import styles from './CompanionActivitySummary.module.scss';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatSpeed(meters: number, seconds: number): string {
  if (seconds <= 0) return '—';
  const kmh = (meters / seconds) * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

interface CompanionActivitySummaryProps {
  activity: Activity;
}

export function CompanionActivitySummary({
  activity,
}: CompanionActivitySummaryProps) {
  const effortPercent = Math.round(activity.effortScore * 100);
  const title = activity.name?.trim() || activity.type;
  const when = new Date(activity.startedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className={styles.activity} aria-label="Linked Strava activity">
      <div className={styles.activityHeader}>
        <span className={styles.activityTitle}>{title}</span>
        <span className={styles.activityType}>{activity.type}</span>
      </div>
      <time className={styles.activityWhen}>{when}</time>

      <dl className={styles.stats}>
        <div>
          <dt>Distance</dt>
          <dd>{formatDistance(activity.distanceMeters)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(activity.durationSeconds)}</dd>
        </div>
        <div>
          <dt>Avg speed</dt>
          <dd>
            {formatSpeed(activity.distanceMeters, activity.durationSeconds)}
          </dd>
        </div>
      </dl>

      <div className={styles.effort}>
        <div className={styles.effortLabelRow}>
          <span className={styles.effortLabel}>Effort</span>
          <span className={styles.effortValue}>{effortPercent}%</span>
        </div>
        <div
          className={styles.effortTrack}
          role="meter"
          aria-valuenow={effortPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Effort score ${effortPercent} percent`}
        >
          <div
            className={styles.effortFill}
            style={{ width: `${effortPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
