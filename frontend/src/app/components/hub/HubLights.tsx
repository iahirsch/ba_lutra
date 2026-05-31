type HubLightsVariant = 'hub' | 'interaction';

interface HubLightsProps {
  variant?: HubLightsVariant;
}

const LIGHT_PRESETS: Record<
  HubLightsVariant,
  { ambient: number; key: number; fill: number; rim: number }
> = {
  hub: {
    ambient: 0.58,
    key: 1.35,
    fill: 0.3,
    rim: 0.22,
  },
  interaction: {
    ambient: 0.52,
    key: 1.45,
    fill: 0.24,
    rim: 0.28,
  },
};

export function HubLights({ variant = 'hub' }: HubLightsProps) {
  const preset = LIGHT_PRESETS[variant];

  return (
    <>
      <ambientLight intensity={preset.ambient} />
      <hemisphereLight color="#f4ead2" groundColor="#6a775f" intensity={0.42} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={preset.key}
        color="#fff1dc"
      />
      <directionalLight
        position={[-4, 3, -4]}
        intensity={preset.fill}
        color="#8eb9ff"
      />
      <directionalLight
        position={[-2, 2, 6]}
        intensity={preset.rim}
        color="#f7c78f"
      />
    </>
  );
}
