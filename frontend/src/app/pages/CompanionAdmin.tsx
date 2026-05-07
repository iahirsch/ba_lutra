import { Link } from 'react-router-dom';
import { useCompanionSocket } from '../store/useCompanionSocket';
import { deleteCompanion } from '../services/companion.service';
import { CompanionCard } from '../components/admin/CompanionCard';
import styles from './CompanionAdmin.module.scss';

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

export function CompanionAdmin() {
  const { companions, connected, error } = useCompanionSocket();

  async function handleDelete(id: string) {
    try {
      await deleteCompanion(id);
    } catch (err) {
      console.error('Failed to delete companion:', err);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Admin — All Companions</h1>
          <ConnectionBadge connected={connected} />
        </div>
        <nav className={styles.nav}>
          <Link to="/companion" className={styles.navLink}>
            Builder
          </Link>
          <Link to="/hub" className={styles.navLink}>
            Hub
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {!error && companions.length === 0 && connected && (
          <div className={styles.emptyState}>
            <p>No companions saved yet.</p>
            <p>
              <Link to="/companion">Create the first one</Link>.
            </p>
          </div>
        )}

        <div className={styles.grid}>
          {companions.map((companion) => (
            <CompanionCard
              key={companion.id}
              companion={companion}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
