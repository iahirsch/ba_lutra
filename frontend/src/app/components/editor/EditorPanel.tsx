import { useState } from 'react';
import { useCompanionStore } from '../../store/companionStore';
import type { PartCategory } from '../../store/companionStore';
import { COMPANION_THUMBNAIL_BASE } from '@ba-praktisch/shared-types';
import { saveCompanion } from '../../services/companion.service';
import { PART_VARIANTS } from '../../constants/companion-part-variants';
import {
  EYE_SCLERA_PRESETS,
  IRIS_COLOR_PRESETS,
} from '../../constants/eye-color-presets';
import { FUR_COLOR_PRESETS } from '../../constants/fur-color-presets';
import { NOSE_COLOR_PRESETS } from '../../constants/nose-color-presets';
import styles from './EditorPanel.module.scss';

type AnyCategory = PartCategory | 'body' | 'fur' | 'nose' | 'eyes';

type EyeColorSubcategory = 'eye' | 'iris';

const CATEGORIES: { key: AnyCategory; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'fur', label: 'Fur' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'nose', label: 'Nose' },
  { key: 'clothing', label: 'Clothing' },
];

const OPTIONAL_PART_CATEGORIES: PartCategory[] = ['clothing'];

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

function EyesColorPicker() {
  const [subcategory, setSubcategory] = useState<EyeColorSubcategory>('eye');
  const eyeColor = useCompanionStore((s) => s.eyeColor);
  const setEyeColorPart = useCompanionStore((s) => s.setEyeColorPart);

  const presets =
    subcategory === 'eye' ? EYE_SCLERA_PRESETS : IRIS_COLOR_PRESETS;
  const activeKey = subcategory === 'eye' ? 'primary' : 'secondary';

  return (
    <div className={styles.eyesSection}>
      <div
        className={styles.subTabBar}
        role="tablist"
        aria-label="Eye color parts"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subcategory === 'eye'}
          className={`${styles.subTab} ${subcategory === 'eye' ? styles.subTabActive : ''}`}
          onClick={() => setSubcategory('eye')}
        >
          Eye
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subcategory === 'iris'}
          className={`${styles.subTab} ${subcategory === 'iris' ? styles.subTabActive : ''}`}
          onClick={() => setSubcategory('iris')}
        >
          Iris
        </button>
      </div>
      <div className={styles.grid}>
        {presets.map((preset) => {
          const selected = eyeColor[activeKey] === preset;
          return (
            <button
              type="button"
              key={preset}
              className={`${styles.cell} ${styles.colorSwatch} ${selected ? styles.cellActive : ''}`}
              onClick={() => setEyeColorPart(activeKey, preset)}
              aria-pressed={selected}
              aria-label={`${subcategory === 'eye' ? 'Eye' : 'Iris'} color ${preset}`}
            >
              <span
                className={styles.colorSwatchPreview}
                style={{ background: preset }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NoseColorPicker() {
  const noseColor = useCompanionStore((s) => s.noseColor);
  const setNoseColor = useCompanionStore((s) => s.setNoseColor);

  return (
    <div className={styles.grid}>
      {NOSE_COLOR_PRESETS.map((preset) => {
        const selected = noseColor === preset;
        return (
          <button
            type="button"
            key={preset}
            className={`${styles.cell} ${styles.colorSwatch} ${selected ? styles.cellActive : ''}`}
            onClick={() => setNoseColor(preset)}
            aria-pressed={selected}
            aria-label={`Nose color ${preset}`}
          >
            <span
              className={styles.colorSwatchPreview}
              style={{ background: preset }}
            />
          </button>
        );
      })}
    </div>
  );
}

function FurColorPicker() {
  const furColor = useCompanionStore((s) => s.furColor);
  const setFurColor = useCompanionStore((s) => s.setFurColor);

  return (
    <div className={styles.grid}>
      {FUR_COLOR_PRESETS.map((preset) => {
        const selected =
          furColor.primary === preset.primary &&
          furColor.secondary === preset.secondary;
        return (
          <button
            type="button"
            key={`${preset.primary}-${preset.secondary}`}
            className={`${styles.cell} ${styles.colorSwatch} ${selected ? styles.cellActive : ''}`}
            onClick={() => setFurColor(preset)}
            aria-pressed={selected}
            aria-label={`Fur colors ${preset.primary} and ${preset.secondary}`}
          >
            <span
              className={styles.colorSwatchPreview}
              style={{
                background: `linear-gradient(90deg, ${preset.primary} 50%, ${preset.secondary} 50%)`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

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

  const allowNone = OPTIONAL_PART_CATEGORIES.includes(category);

  return (
    <div className={styles.grid}>
      {allowNone && (
        <button
          type="button"
          className={`${styles.cell} ${selected === '' ? styles.cellActive : ''}`}
          onClick={() => setPartVariant(category, '')}
          aria-pressed={selected === ''}
        >
          <span className={styles.nonePlaceholder} aria-hidden="true">
            —
          </span>
          <span className={styles.variantLabel}>None</span>
        </button>
      )}
      {variants.map((variantId) => (
        <button
          type="button"
          key={variantId}
          className={`${styles.cell} ${selected === variantId ? styles.cellActive : ''}`}
          onClick={() => setPartVariant(category, variantId)}
          aria-pressed={selected === variantId}
        >
          <img
            src={`${COMPANION_THUMBNAIL_BASE}/${category}/${variantId}.png`}
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

export function EditorPanel() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeCategory = useCompanionStore((s) => s.activeCategory);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const state = useCompanionStore.getState();
      await saveCompanion({
        furColor: state.furColor,
        eyeColor: state.eyeColor,
        noseColor: state.noseColor,
        clothing: state.clothing,
        ears: state.ears,
        tail: state.tail,
        backpack: state.backpack,
        bodyMorphs: state.bodyMorphs,
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
        ) : activeCategory === 'fur' ? (
          <FurColorPicker />
        ) : activeCategory === 'nose' ? (
          <NoseColorPicker />
        ) : activeCategory === 'eyes' ? (
          <EyesColorPicker />
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
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Create'}
        </button>
      </div>
    </div>
  );
}
