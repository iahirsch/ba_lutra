import axios from 'axios';
import type { CompanionConfig, SavedCompanion } from '@ba-praktisch/shared-types';

export async function saveCompanion(
  config: CompanionConfig,
): Promise<SavedCompanion> {
  const { data } = await axios.post<SavedCompanion>(
    '/api/companion/config',
    config,
  );
  return data;
}

export async function getCompanions(): Promise<SavedCompanion[]> {
  const { data } = await axios.get<SavedCompanion[]>('/api/companion/config');
  return data;
}

export async function deleteCompanion(id: string): Promise<void> {
  await axios.delete(`/api/companion/config/${id}`);
}
