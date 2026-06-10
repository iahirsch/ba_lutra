import type { Vector3 } from 'three';

export type HubPoiConfig =
  | { type?: 'single'; weight?: number; idleMin?: number; idleMax?: number }
  | {
      type?: 'multi';
      capacity: number;
      radius: number;
      weight?: number;
      idleMin?: number;
      idleMax?: number;
    };

export const HUB_POI_CONFIG: Record<string, HubPoiConfig> = {
  EMPTY_POI_Fire01: { weight: 3 },
  EMPTY_POI_Fire02: { weight: 2 },
  EMPTY_POI_Fire03: { weight: 2 },
  EMPTY_POI_Tent01: { weight: 1.5 },
  EMPTY_POI_Tent02: { weight: 2 },
  EMPTY_POI_Board01: { weight: 1.5 },
  EMPTY_POI_Board02: { weight: 2 },
};

export function getHubPoiConfig(poiName: string): HubPoiConfig {
  return HUB_POI_CONFIG[poiName] ?? { type: 'single' };
}

export function getHubPoiCapacity(config: HubPoiConfig): number {
  return config.type === 'multi' ? config.capacity : 1;
}

export function getHubPoiIdleRange(
  config: HubPoiConfig,
  defaultMin: number,
  defaultMax: number,
): { min: number; max: number } {
  return {
    min: config.idleMin ?? defaultMin,
    max: config.idleMax ?? defaultMax,
  };
}

export function getGatherSlotXZ(
  center: Vector3,
  slotIndex: number,
  capacity: number,
  radius: number,
): { x: number; z: number } {
  const angle = (slotIndex / capacity) * Math.PI * 2;
  return {
    x: center.x + Math.sin(angle) * radius,
    z: center.z + Math.cos(angle) * radius,
  };
}
