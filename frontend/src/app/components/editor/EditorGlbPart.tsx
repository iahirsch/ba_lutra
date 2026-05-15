import type { PartCategory } from '../../store/companionStore';
import { useCompanionStore } from '../../store/companionStore';
import { CharacterGlbPart } from '../common/CharacterGlbPart';

/** Editor-only: part morphs follow live Zustand state. */
export function EditorGlbPart({
  category,
  variantId,
}: {
  category: PartCategory;
  variantId: string;
}) {
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);
  return (
    <CharacterGlbPart
      category={category}
      variantId={variantId}
      bodyMorphs={bodyMorphs}
    />
  );
}
