import type { CompanionConfig } from './companion.types';

/** Companion row returned from REST and emitted when entering the hub. */
export interface SavedCompanion extends CompanionConfig {
  id: string;
  name: string;
  createdAt: string;
}
