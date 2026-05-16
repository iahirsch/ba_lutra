import { io, type Socket } from 'socket.io-client';

/** Default Socket.IO client for this app */
export function createMainSocket(): Socket {
  return io({ path: '/socket.io' });
}
