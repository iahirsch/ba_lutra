import { useCompanionStore } from '../../store/companionStore';
import { CompanionBody } from '../common/CompanionBodyGlb';

/** Editor body: morphs and fur colors from Zustand. */
export function EditorBody() {
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);
  const furColor = useCompanionStore((s) => s.furColor);
  const eyeColor = useCompanionStore((s) => s.eyeColor);
  const noseColor = useCompanionStore((s) => s.noseColor);
  return (
    <CompanionBody
      bodyMorphs={bodyMorphs}
      furColor={furColor}
      eyeColor={eyeColor}
      noseColor={noseColor}
    />
  );
}
