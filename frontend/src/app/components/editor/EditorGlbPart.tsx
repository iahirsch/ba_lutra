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
  return (
    <CompanionPartGlb
      category={category}
      variantId={variantId}
      bodyMorphs={bodyMorphs}
    />
  );
}
