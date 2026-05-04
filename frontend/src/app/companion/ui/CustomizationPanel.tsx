import { useState } from 'react';
import axios from 'axios';
import { CategoryTabBar } from './CategoryTabBar';
import { VariantGrid } from './VariantGrid';
import { useCompanionStore, CompanionConfig } from '../store/companion.store';
import styles from './CustomizationPanel.module.scss';

function extractConfig(): CompanionConfig {
  const { eyes, nose, ears, tail, backpack, bodyMorphs } =
    useCompanionStore.getState();
  return { eyes, nose, ears, tail, backpack, bodyMorphs };
}

export function CustomizationPanel() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const config = extractConfig();
      await axios.post('/api/companion/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save companion config:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.panel}>
      <CategoryTabBar />
      <VariantGrid />
      <div className={styles.footer}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
}
