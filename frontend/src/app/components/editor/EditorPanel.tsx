import { useState } from 'react';
import {
  useCompanionStore,
  type EditorSection,
  type EditorTab,
  type PartCategory,
} from '../../store/companionStore';
import { saveCompanion } from '../../services/companion.service';
import { COMPANION_THUMBNAIL_BASE } from '@ba-praktisch/shared-types';
import { PART_VARIANTS } from '../../constants/companion-part-variants';
import {
  EYE_SCLERA_PRESETS,
  IRIS_COLOR_PRESETS,
} from '../../constants/eye-color-presets';
import { FUR_COLOR_PRESETS } from '../../constants/fur-color-presets';
import { NOSE_COLOR_PRESETS } from '../../constants/nose-color-presets';
import styles from './EditorPanel.module.scss';

const SECTIONS: { key: EditorSection; label: string }[] = [
  { key: 'lutra', label: 'Lutra' },
  { key: 'clothing', label: 'Clothing' },
];

const LUTRA_TABS: { key: EditorTab; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'fur', label: 'Fur' },
  { key: 'eyes', label: 'Sclera' },
  { key: 'iris', label: 'Iris' },
  { key: 'nose', label: 'Nose' },
];

const CLOTHING_TABS: { key: EditorTab; label: string }[] = [
  { key: 'clothingTop', label: 'Shirt' },
  { key: 'clothingBottom', label: 'Pants' },
];

const OPTIONAL_PART_CATEGORIES: PartCategory[] = [
  'clothingTop',
  'clothingBottom',
];

function SectionTabs() {
  const activeSection = useCompanionStore((s) => s.activeSection);
  const setActiveSection = useCompanionStore((s) => s.setActiveSection);

  return (
    <nav
      className={styles.tabBar}
      role="tablist"
      aria-label="Customization sections"
    >
      {SECTIONS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeSection === key}
          className={`${styles.tab} ${activeSection === key ? styles.tabActive : ''}`}
          onClick={() => setActiveSection(key)}
        >
          {label}
          {activeSection === key && (
            <span className={styles.tabIndicator} aria-hidden="true" />
          )}
        </button>
      ))}
    </nav>
  );
}

function CategorySubTabs({
  tabs,
}: {
  tabs: { key: EditorTab; label: string }[];
}) {
  const activeCategory = useCompanionStore((s) => s.activeCategory);
  const setActiveCategory = useCompanionStore((s) => s.setActiveCategory);

  return (
    <div
      className={styles.subTabBar}
      role="tablist"
      aria-label="Customization options"
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeCategory === key}
          className={`${styles.subTab} ${activeCategory === key ? styles.subTabActive : ''}`}
          onClick={() => setActiveCategory(key)}
        >
          {label}
        </button>
      ))}
    </div>
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

function EyeScleraPicker() {
  const eyeColor = useCompanionStore((s) => s.eyeColor);
  const setEyeColorPart = useCompanionStore((s) => s.setEyeColorPart);

  return (
    <div className={styles.grid}>
      {EYE_SCLERA_PRESETS.map((preset) => {
        const selected = eyeColor.primary === preset;
        return (
          <button
            type="button"
            key={preset}
            className={`${styles.cell} ${styles.colorSwatch} ${selected ? styles.cellActive : ''}`}
            onClick={() => setEyeColorPart('primary', preset)}
            aria-pressed={selected}
            aria-label={`Eye color ${preset}`}
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

function IrisColorPicker() {
  const eyeColor = useCompanionStore((s) => s.eyeColor);
  const setEyeColorPart = useCompanionStore((s) => s.setEyeColorPart);

  return (
    <div className={styles.grid}>
      {IRIS_COLOR_PRESETS.map((preset) => {
        const selected = eyeColor.secondary === preset;
        return (
          <button
            type="button"
            key={preset}
            className={`${styles.cell} ${styles.colorSwatch} ${selected ? styles.cellActive : ''}`}
            onClick={() => setEyeColorPart('secondary', preset)}
            aria-pressed={selected}
            aria-label={`Iris color ${preset}`}
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

function CategoryContent() {
  const activeCategory = useCompanionStore((s) => s.activeCategory);

  switch (activeCategory) {
    case 'body':
      return <BodySliders />;
    case 'fur':
      return <FurColorPicker />;
    case 'eyes':
      return <EyeScleraPicker />;
    case 'iris':
      return <IrisColorPicker />;
    case 'nose':
      return <NoseColorPicker />;
    case 'clothingTop':
    case 'clothingBottom':
      return <PartGrid category={activeCategory} />;
    default:
      return null;
  }
}

export function EditorPanel() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeSection = useCompanionStore((s) => s.activeSection);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const state = useCompanionStore.getState();
      await saveCompanion({
        furColor: state.furColor,
        eyeColor: state.eyeColor,
        noseColor: state.noseColor,
        clothingTop: state.clothingTop,
        clothingBottom: state.clothingBottom,
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
      <SectionTabs />
      <CategorySubTabs
        tabs={activeSection === 'clothing' ? CLOTHING_TABS : LUTRA_TABS}
      />

      <div className={styles.content}>
        <CategoryContent />
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
