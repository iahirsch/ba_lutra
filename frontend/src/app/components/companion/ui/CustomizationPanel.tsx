import { useState } from 'react';
import { useCompanionStore } from '../../../store/companion.store';
import type { PartCategory } from '../../../store/companion.store';
import { saveCompanion } from '../../../services/companion.service';
import { PART_VARIANTS } from '../CompanionPart';
import styles from './CustomizationPanel.module.scss';

type AnyCategory = PartCategory | 'body';

const CATEGORIES: { key: AnyCategory; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'fur', label: 'Fur' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'nose', label: 'Nose' },
  { key: 'clothing', label: 'Clothing' },
  // { key: 'ears',    label: 'Ears'    },  // reserved
  // { key: 'tail',   label: 'Tail'    },  // reserved
  // { key: 'backpack', label: 'Backpack' }, // reserved
];

function CategoryTabs() {
  const activeCategory = useCompanionStore((s) => s.activeCategory);
  const setActiveCategory = useCompanionStore((s) => s.setActiveCategory);

  return (
    <nav
      className={styles.tabBar}
      role="tablist"
      aria-label="Customization categories"
    >
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeCategory === key}
          className={`${styles.tab} ${activeCategory === key ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory(key)}
        >
          {label}
          {activeCategory === key && (
            <span className={styles.tabIndicator} aria-hidden="true" />
          )}
        </button>
      ))}
    </nav>
  );
}

// Body Morph Sliders
interface MorphSliderDef {
  morphName: string;
  label: string;
}

const MORPH_SLIDERS: MorphSliderDef[] = [
  { morphName: 'body_fat', label: 'Body' },
  { morphName: 'face_fat', label: 'Face' },
];

function BodySliders() {
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);
  const setBodyMorph = useCompanionStore((s) => s.setBodyMorph);

  return (
    <div className={styles.sliderList}>
      {MORPH_SLIDERS.map(({ morphName, label }) => {
        const value = bodyMorphs[morphName] ?? 0;
        return (
          <div key={morphName} className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>{label}</span>
              <span className={styles.sliderValue}>
                {Math.round(value * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={value}
              className={styles.slider}
              aria-label={label}
              onChange={(e) =>
                setBodyMorph(morphName, parseFloat(e.target.value))
              }
            />
          </div>
        );
      })}
    </div>
  );
}

// Part Variant Grid
function PartGrid({ category }: { category: PartCategory }) {
  const selected = useCompanionStore((s) => s[category]);
  const setPartVariant = useCompanionStore((s) => s.setPartVariant);
  const variants = PART_VARIANTS[category];

  if (variants.length === 0) {
    return (
      <div className={styles.emptyCategory}>
        <p>No variants available yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {variants.map((variantId) => (
        <button
          key={variantId}
          className={`${styles.cell} ${selected === variantId ? styles.cellActive : ''}`}
          onClick={() => setPartVariant(category, variantId)}
          aria-pressed={selected === variantId}
        >
          <img
            src={`/assets/companion/thumbnails/${category}/${variantId}.png`}
            alt={variantId}
            className={styles.thumbnail}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className={styles.variantLabel}>{variantId}</span>
        </button>
      ))}
    </div>
  );
}

// Panel
export function CustomizationPanel() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeCategory = useCompanionStore((s) => s.activeCategory);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { fur, clothing, eyes, nose, ears, tail, backpack, bodyMorphs } =
        useCompanionStore.getState();
      await saveCompanion({
        fur,
        clothing,
        eyes,
        nose,
        ears,
        tail,
        backpack,
        bodyMorphs,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save companion:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.panel}>
      <CategoryTabs />

      <div className={styles.content}>
        {activeCategory === 'body' ? (
          <BodySliders />
        ) : (
          <PartGrid category={activeCategory} />
        )}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
        >
          {/* TODO: better wording or confirmation popup */}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
}
