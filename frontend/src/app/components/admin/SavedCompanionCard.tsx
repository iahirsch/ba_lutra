import { useState } from 'react';
import {
  COMPANION_THUMBNAIL_BASE,
  type SavedCompanion,
} from '@ba-praktisch/shared-types';
import styles from './SavedCompanionCard.module.scss';

const ALL_PARTS: Array<
  keyof Omit<SavedCompanion, 'id' | 'name' | 'createdAt' | 'bodyMorphs'>
> = ['fur', 'eyes', 'nose', 'clothing', 'ears', 'tail', 'backpack'];

function formatVariant(category: string, variantId: string): string {
  if (!variantId) return '—';
  return variantId.replace(new RegExp(`^${category}[_]?`), '') || variantId;
}

function PartThumbnail({
  category,
  variantId,
}: {
  category: string;
  variantId: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={styles.partThumb}>
      {!imgFailed && variantId ? (
        <img
          src={`${COMPANION_THUMBNAIL_BASE}/${category}/${variantId}.png`}
          alt={variantId}
          className={styles.thumbImg}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className={`${styles.thumbFallback} ${!variantId ? styles.thumbEmpty : ''}`}
        >
          {formatVariant(category, variantId)}
        </span>
      )}
      <span className={styles.partLabel}>{category}</span>
    </div>
  );
}

interface SavedCompanionCardProps {
  companion: SavedCompanion;
  onDelete: (id: string) => void;
}

export function SavedCompanionCard({
  companion,
  onDelete,
}: SavedCompanionCardProps) {
  const [confirming, setConfirming] = useState(false);

  const date = new Date(companion.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const morphEntries = Object.entries(companion.bodyMorphs ?? {});

  function handleDeleteClick() {
    if (confirming) {
      onDelete(companion.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.name}>{companion.name}</span>
          <time className={styles.date}>{date}</time>
        </div>
        <button
          className={`${styles.deleteBtn} ${confirming ? styles.deleteBtnConfirm : ''}`}
          onClick={handleDeleteClick}
          title={
            confirming ? 'Click again to confirm delete' : 'Delete companion'
          }
          aria-label={confirming ? 'Confirm delete' : 'Delete companion'}
        >
          {confirming ? (
            <span className={styles.confirmText}>Confirm</span>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          )}
        </button>
      </header>

      <div className={styles.parts}>
        {ALL_PARTS.map((cat) => (
          <PartThumbnail
            key={cat}
            category={cat}
            variantId={companion[cat] ?? ''}
          />
        ))}
      </div>

      {morphEntries.length > 0 && (
        <footer className={styles.morphs}>
          {morphEntries.map(([name, value]) => (
            <span key={name} className={styles.morphTag}>
              {name} {Math.round(value * 100)}%
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}
