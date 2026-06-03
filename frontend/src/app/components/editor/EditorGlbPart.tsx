import type { PartCategory } from '../../store/companionStore';
import { useCompanionStore } from '../../store/companionStore';
import { CompanionPartGlb } from '../common/CompanionPartGlb';

/** Editor-only: part morphs follow live Zustand state. */
export function EditorGlbPart({
  category,
  variantId,
}: {
  category: PartCategory;
  variantId: string;
}) {
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);
  const clothingTop = useCompanionStore((s) => s.clothingTop);
  return (
    <CompanionPartGlb
      category={category}
      variantId={variantId}
      bodyMorphs={
        category === 'backpack'
          ? { ...bodyMorphs, cloth_on: clothingTop ? 1 : 0 }
          : bodyMorphs
      }
    />
  );
}
