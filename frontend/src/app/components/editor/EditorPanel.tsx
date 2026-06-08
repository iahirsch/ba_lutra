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
import { NoseIcon, ShortsIcon } from '../common/icons';

const SECTIONS: { key: EditorSection; label: string; icon: string }[] = [
  { key: 'lutra', label: 'Lutra', icon: 'pets' },
  { key: 'clothing', label: 'Kleidung', icon: 'checkroom' },
];

const LUTRA_TABS: {
  key: EditorTab;
  label: string;
  icon?: string;
  iconComponent?: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  { key: 'body', label: 'Körper', icon: 'accessibility_new' },
  { key: 'fur', label: 'Fell', icon: 'palette' },
  { key: 'eyes', label: 'Augen', icon: 'visibility' },
  { key: 'iris', label: 'Iris', icon: 'radio_button_checked' },
  { key: 'nose', label: 'Nose', iconComponent: NoseIcon },
];

const CLOTHING_TABS: {
  key: EditorTab;
  label: string;
  icon?: string;
  iconComponent?: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  { key: 'clothingTop', label: 'Shirt', icon: 'apparel' },
  { key: 'clothingBottom', label: 'Pants', iconComponent: ShortsIcon },
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
      {SECTIONS.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeSection === key}
          className={`${styles.subTab} ${activeSection === key ? styles.subTabActive : ''}`}
          onClick={() => setActiveSection(key)}
        >
          <span className="material-symbols-outlined">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function CategorySubTabs({
  tabs,
}: {
  tabs: {
    key: EditorTab;
    label: string;
    icon?: string;
    iconComponent?: React.FC<React.SVGProps<SVGSVGElement>>;
  }[];
}) {
  const activeCategory = useCompanionStore((s) => s.activeCategory);
  const setActiveCategory = useCompanionStore((s) => s.setActiveCategory);

  return (
    <div
      className={styles.subTabBar}
      role="tablist"
      aria-label="Customization options"
    >
      {tabs.map(({ key, label, icon, iconComponent: IconComponent }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeCategory === key}
          className={`${styles.subTab} ${activeCategory === key ? styles.subTabActive : ''}`}
          onClick={() => setActiveCategory(key)}
        >
          {IconComponent ? (
            <IconComponent style={{ width: 20, height: 20 }} />
          ) : (
            <span className="material-symbols-outlined">{icon}</span>
          )}
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
  { morphName: 'body_fat', label: 'Körper' },
  { morphName: 'face_fat', label: 'Gesicht' },
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
              style={{
                background: `linear-gradient(to right, oklch(0.9212 0.1146 195.35) ${value * 100}%, #e0e0e0 ${value * 100}%)`,
              }}
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
    <div className={styles.gridTab}>
      <div className={styles.gridTitle}>Augenfarbe</div>
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
              aria-label={`Augenfarbe ${preset}`}
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

function IrisColorPicker() {
  const eyeColor = useCompanionStore((s) => s.eyeColor);
  const setEyeColorPart = useCompanionStore((s) => s.setEyeColorPart);

  return (
    <div className={styles.gridTab}>
      <div className={styles.gridTitle}>Irisfarbe</div>
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
              aria-label={`Irisfarbe ${preset}`}
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
    <div className={styles.gridTab}>
      <div className={styles.gridTitle}>Nasenfarbe</div>
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
              aria-label={`Nasenfarbe ${preset}`}
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

function FurColorPicker() {
  const furColor = useCompanionStore((s) => s.furColor);
  const setFurColor = useCompanionStore((s) => s.setFurColor);

  return (
    <div className={styles.gridTab}>
      <div className={styles.gridTitle}>Fellfarbe</div>
      <div className={styles.grid}>
        {FUR_COLOR_PRESETS.map((preset) => {
          const selected =
            furColor.primary === preset.primary &&
            furColor.secondary === preset.secondary;
          return (
            <button
              type="button"
              key={`${preset.primary}-${preset.secondary}`}
              className={`${styles.cell} ${selected ? styles.cellActive : ''}`}
              onClick={() => setFurColor(preset)}
              aria-pressed={selected}
              aria-label={`Fellfarbe ${preset.primary} and ${preset.secondary}`}
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

  const title = category === 'clothingTop' ? 'Shirt' : 'Hose';

  return (
    <div className={styles.gridTab}>
      <div className={styles.gridTitle}>{title}</div>
      <div className={styles.grid}>
        {allowNone && (
          <button
            type="button"
            className={`${styles.cell} ${selected === '' ? styles.cellActive : ''}`}
            onClick={() => setPartVariant(category, '')}
            aria-pressed={selected === ''}
          >
            <span className={styles.nonePlaceholder} aria-hidden="true">
              — <span className={styles.variantLabel}>keine</span>
            </span>
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
            <span className={styles.colorSwatchPreview}>
              <img
                src={`${COMPANION_THUMBNAIL_BASE}/${category}/${variantId}.png`}
                alt={variantId}
                className={styles.thumbnail}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </span>
          </button>
        ))}
      </div>
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

      <button
        className={styles.saveButton}
        onClick={handleSave}
        disabled={saving}
        aria-busy={saving}
      >
        {saving ? 'Wird erstellt...' : saved ? 'Erstellt!' : 'Erstellen'}
      </button>
      {/* <div className={styles.footer}>
      </div> */}
    </div>
  );
}
