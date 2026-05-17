/** Socket.IO events for companion lifecycle (not part of the multi-screen flow). */
export const COMPANION_EVENTS = {
  CREATED: 'companion:created',
  DELETED: 'companion:deleted',
} as const;

export interface CompanionDeletedPayload {
  id: string;
}
