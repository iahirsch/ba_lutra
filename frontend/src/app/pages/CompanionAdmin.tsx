import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCompanionSocket } from '../store/useCompanionSocket';
import { deleteCompanion } from '../services/companion.service';
import {
  disconnectStrava,
  getStravaStatus,
  redirectToStravaAuth,
  type StravaStatus,
} from '../services/strava.service';
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

function StravaSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const oauthResult = searchParams.get('strava');

  function refreshStatus() {
    setLoading(true);
    getStravaStatus()
      .then(setStatus)
      .finally(() => setLoading(false));
  }

  useEffect(refreshStatus, []);

  useEffect(() => {
    if (oauthResult) {
      const next = new URLSearchParams(searchParams);
      next.delete('strava');
      setSearchParams(next, { replace: true });
    }
  }, [oauthResult, searchParams, setSearchParams]);

  async function handleDisconnect() {
    if (
      !window.confirm(
        'Disconnect Strava? The app will stop receiving new activities until you reconnect.',
      )
    )
      return;
    setDisconnecting(true);
    try {
      await disconnectStrava();
      setStatus({ connected: false, athleteName: null, athleteId: null });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className={styles.stravaSection}>
      <div className={styles.stravaHeader}>
        <span className={styles.stravaTitle}>Strava</span>

        {!loading &&
          (status?.connected ? (
            <span className={`${styles.badge} ${styles.badgeOnline}`}>
              <span className={styles.badgeDot} />
              {status.athleteName ?? 'Connected'}
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeOffline}`}>
              <span className={styles.badgeDot} />
              Not connected
            </span>
          ))}

        <div className={styles.stravaActions}>
          <button
            className={styles.stravaButton}
            onClick={redirectToStravaAuth}
          >
            {status?.connected ? 'Reconnect' : 'Connect'}
          </button>

          {status?.connected && (
            <button
              className={`${styles.stravaButton} ${styles.stravaButtonGhost}`}
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      {oauthResult === 'connected' && (
        <p className={`${styles.stravaFeedback} ${styles.stravaSuccess}`}>
          Strava account connected successfully.
        </p>
      )}
      {oauthResult === 'denied' && (
        <p className={`${styles.stravaFeedback} ${styles.stravaError}`}>
          Strava authorization was denied.
        </p>
      )}
      {oauthResult === 'scope_missing' && (
        <p className={`${styles.stravaFeedback} ${styles.stravaError}`}>
          Missing required scope. Make sure to allow{' '}
          <strong>activity:read_all</strong> during authorization.
        </p>
      )}
      {oauthResult === 'error' && (
        <p className={`${styles.stravaFeedback} ${styles.stravaError}`}>
          Something went wrong during Strava authorization. Check server logs.
        </p>
      )}

      {!status?.connected && !loading && (
        <p className={styles.stravaHint}>
          Connect the Strava account that should be used to fetch activities.
        </p>
      )}
    </div>
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
          <h1 className={styles.title}>Admin</h1>
          <ConnectionBadge connected={connected} />
        </div>
        <nav className={styles.nav}>
          <Link to="/companion" className={styles.navLink}>
            Builder
          </Link>
          <Link to="/hub" className={styles.navLink}>
            Hub
          </Link>
          <Link to="/interaction" className={styles.navLink}>
            Interaction
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        <StravaSection />

        <h1 className={styles.title}>All Companions</h1>

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
