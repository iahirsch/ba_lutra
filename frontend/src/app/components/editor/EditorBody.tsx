import { useCompanionStore } from '../../store/companionStore';
import { CompanionBody } from '../common/CompanionBodyGlb';

/** Editor body: morphs and fur colors from Zustand. */
export function EditorBody() {
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);
  const furColor = useCompanionStore((s) => s.furColor);
  return <CompanionBody bodyMorphs={bodyMorphs} furColor={furColor} />;
}
