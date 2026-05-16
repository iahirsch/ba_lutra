import { useCompanionSocket } from '../hooks/useCompanionSocket';
import { HubCanvas } from '../components/hub/HubCanvas';
import { ConnectionBadge } from '../components/common/ConnectionBadge';
import styles from './Hub.module.scss';

export function Hub() {
  const { companions, connected, error } = useCompanionSocket();

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <HubCanvas companions={companions} />
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
              {companions.length} companion{companions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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
