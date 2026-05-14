import type { CompanionConfig } from '@ba-praktisch/shared-types';

export interface SavedCompanion extends CompanionConfig {
  id: string;
  name: string;
  createdAt: string;
}
