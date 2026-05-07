import { Link } from 'react-router-dom';
import { useCompanionSocket } from '../store/useCompanionSocket';
import { HubScene } from '../components/hub/HubScene';
import styles from './CompanionHub.module.scss';

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`${styles.badge} ${connected ? styles.badgeOnline : styles.badgeOffline}`}
    >
      <span className={styles.badgeDot} />
      {connected ? 'Live' : 'Connecting…'}
    </span>
  );
}

export function CompanionHub() {
  const { companions, connected, error } = useCompanionSocket();

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <HubScene companions={companions} />
      </div>

      <header className={styles.overlay}>
        <div className={styles.left}>
          <span className={styles.title}>Companion Hub</span>
          <ConnectionBadge connected={connected} />
          {companions.length > 0 && (
            <span className={styles.count}>
              {companions.length} companion{companions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <nav className={styles.nav}>
          <Link to="/companion" className={styles.navLink}>
            Builder
          </Link>
          <Link to="/admin" className={styles.navLink}>
            Admin
          </Link>
        </nav>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {!error && companions.length === 0 && connected && (
        <div className={styles.emptyState}>
          <p>No companions yet.</p>
          <Link to="/companion" className={styles.emptyLink}>
            Create the first one →
          </Link>
        </div>
      )}
    </div>
  );
}
