import { useCompanionStore } from '../store/companion.store';
import type { PartCategory } from '../store/companion.store';
import { PART_VARIANTS } from '../scene/CompanionPart';
import styles from './VariantGrid.module.scss';

interface MorphSliderDef {
  morphName: string; // ShapeKey Name from Blender
  label: string;
}

const MORPH_SLIDERS: MorphSliderDef[] = [
  { morphName: 'chubby', label: 'Size' },
  // { morphName: 'tall', label: 'Height' },
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

// Part Grid
interface PartGridProps {
  category: PartCategory;
}

function PartGrid({ category }: PartGridProps) {
  const selected = useCompanionStore((s) => s[category]);
  const setPartVariant = useCompanionStore((s) => s.setPartVariant);
  const variants = PART_VARIANTS[category];

  return (
    <div className={styles.grid}>
      {variants.map((variantId) => (
        <button
          key={variantId}
          className={`${styles.cell} ${selected === variantId ? styles.cellActive : ''}`}
          onClick={() => setPartVariant(category, variantId)}
          aria-pressed={selected === variantId}
        >
          {/* Replace with <img> of PNG thumbnails */}
          <span className={styles.thumbnail}>{variantId}</span>
        </button>
      ))}
    </div>
  );
}

// Public Component
export function VariantGrid() {
  const activeCategory = useCompanionStore((s) => s.activeCategory);

  if (activeCategory === 'body') {
    return <BodySliders />;
  }

  return <PartGrid category={activeCategory} />;
}
