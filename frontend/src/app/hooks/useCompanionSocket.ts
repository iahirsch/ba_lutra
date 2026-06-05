import { useEffect, useState } from 'react';
import { type Socket } from 'socket.io-client';
import { createMainSocket } from '../utils/createMainSocket';
import {
  FLOW_EVENTS,
  COMPANION_EVENTS,
  type CompanionDeletedPayload,
  type SavedCompanion,
} from '@ba-praktisch/shared-types';
import { getCompanions } from '../services/companion.service';

export function useCompanionSocket() {
  const [companions, setCompanions] = useState<SavedCompanion[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityRefreshToken, setActivityRefreshToken] = useState(0);

  useEffect(() => {
    const socket: Socket = createMainSocket();

    getCompanions()
      .then((data) => setCompanions(data))
      .catch(() => setError('Failed to load companions'));

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', () => setError('WebSocket connection failed'));

    // Companions only enter the hub world after completing the interaction flow.
    socket.on(
      FLOW_EVENTS.COMPANION_ENTERED_HUB,
      (newCompanion: SavedCompanion) => {
        setCompanions((prev) => [newCompanion, ...prev].slice(0, 10));
      },
    );

    socket.on(COMPANION_EVENTS.DELETED, ({ id }: CompanionDeletedPayload) => {
      setCompanions((prev) => prev.filter((c) => c.id !== id));
    });

    socket.on(FLOW_EVENTS.ACTIVITY_UPDATED, () => {
      setActivityRefreshToken((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { companions, connected, error, activityRefreshToken };
}
