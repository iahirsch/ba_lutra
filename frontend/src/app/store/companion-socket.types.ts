import type { CompanionConfig } from './companion.store';

export interface SavedCompanion extends CompanionConfig {
  id: string;
  name: string;
  createdAt: string;
}
