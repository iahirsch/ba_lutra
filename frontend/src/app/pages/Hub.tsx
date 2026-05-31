import { useEffect, useState } from 'react';
import {
  GRASS_DEBUG_SLIDER,
  GRASS_GROW_EFFORT_REF,
} from '../constants/environment-vegetation';
import { useCompanionSocket } from '../hooks/useCompanionSocket';
import { useTotalEffortScore } from '../hooks/useTotalEffortScore';
import { useLatestActivitiesByCompanion } from '../hooks/useLatestActivitiesByCompanion';
import { HubCanvas } from '../components/hub/HubCanvas';
import { ConnectionBadge } from '../components/common/ConnectionBadge';
import styles from './Hub.module.scss';

export function Hub() {
  const { companions, connected, error } = useCompanionSocket();
  const latestActivitiesByCompanion = useLatestActivitiesByCompanion(
    companions.map((c) => c.id),
  );
  const liveEffort = useTotalEffortScore();
  const [totalEffortScore, setTotalEffortScore] = useState(0);

  useEffect(() => {
    setTotalEffortScore(liveEffort);
  }, [liveEffort]);

  const effortForGrass = GRASS_DEBUG_SLIDER ? totalEffortScore : liveEffort;

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <HubCanvas
          companions={companions}
          latestActivitiesByCompanion={latestActivitiesByCompanion}
          totalEffortScore={effortForGrass}
        />
      </div>

      <header className={styles.overlay}>
        <div className={styles.left}>
          <span className={styles.title}>Companion Hub</span>
          <ConnectionBadge
            connected={connected}
            className={`${styles.badge} ${connected ? styles.badgeOnline : styles.badgeOffline}`}
            dotClassName={styles.badgeDot}
          />
          {companions.length > 0 && (
            <span className={styles.count}>
              {companions.length} companion
              {companions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Temporary debug slider. Controlled by GRASS_DEBUG_SLIDER in environment-vegetation.ts */}
        {GRASS_DEBUG_SLIDER && (
          <div className={styles.debugControl}>
            <label className={styles.debugLabel} htmlFor="hub-effort-score">
              Total effort
            </label>
            <input
              id="hub-effort-score"
              type="range"
              min={0}
              max={GRASS_GROW_EFFORT_REF}
              step={0.01}
              value={totalEffortScore}
              className={styles.debugSlider}
              onChange={(e) => setTotalEffortScore(parseFloat(e.target.value))}
            />
            <span className={styles.debugValue}>
              {totalEffortScore.toFixed(2)}
            </span>
          </div>
        )}
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {!error && companions.length === 0 && connected && (
        <div className={styles.emptyState}>
          <p>Waiting for the first companion to arrive…</p>
        </div>
      )}
    </div>
  );
}
