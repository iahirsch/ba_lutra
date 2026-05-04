import { useCompanionStore, PartCategory } from '../store/companion.store';
import styles from './CategoryTabBar.module.scss';

type AnyCategory = PartCategory | 'body';

interface CategoryMeta {
  key: AnyCategory;
  label: string;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'body', label: 'Body' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'nose', label: 'Nose' },
  { key: 'ears', label: 'Ears' },
  { key: 'tail', label: 'Tail' },
  // { key: 'backpack', label: 'Backpack' },
];

export function CategoryTabBar() {
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
