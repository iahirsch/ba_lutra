import { GrassField } from './GrassField';
import { VegetationProps } from './VegetationProps';

interface EnvironmentVegetationProps {
  applyEnvironmentTransform?: boolean;
  totalEffortScore?: number;
}

/** Instanced grass plus discrete vegetation props for the hub environment. */
export function EnvironmentVegetation({
  applyEnvironmentTransform = true,
  totalEffortScore,
}: EnvironmentVegetationProps) {
  return (
    <>
      <GrassField
        applyEnvironmentTransform={applyEnvironmentTransform}
        totalEffortScore={totalEffortScore}
      />
      <VegetationProps
        applyEnvironmentTransform={applyEnvironmentTransform}
        totalEffortScore={totalEffortScore}
      />
    </>
  );
}
