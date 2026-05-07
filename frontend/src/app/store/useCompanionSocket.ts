import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCompanions } from '../services/companion.service';
import type { SavedCompanion } from './companion-socket.types';

const COMPANION_CREATED_EVENT = 'companion:created';

export function useCompanionSocket() {
  const [companions, setCompanions] = useState<SavedCompanion[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io({ path: '/socket.io' });

    socket.on('connect', () => {
      setConnected(true);
      getCompanions()
        .then((data) => setCompanions(data))
        .catch(() => setError('Failed to load companions'));
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', () => setError('WebSocket connection failed'));

    socket.on(COMPANION_CREATED_EVENT, (newCompanion: SavedCompanion) => {
      setCompanions((prev) => [newCompanion, ...prev]);
    });

    socket.on('companion:deleted', ({ id }: { id: string }) => {
      setCompanions((prev) => prev.filter((c) => c.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { companions, connected, error };
}
