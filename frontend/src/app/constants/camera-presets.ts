import type { EditorTab } from '../store/companionStore';

export const HORIZONTAL_ORBIT_CATEGORIES = [
  'body',
  'fur',
  'clothingTop',
  'clothingBottom',
] as const;
export type HorizontalOrbitCategory =
  (typeof HORIZONTAL_ORBIT_CATEGORIES)[number];

export function isHorizontalOrbitCategory(
  category: EditorTab,
): category is HorizontalOrbitCategory {
  return (HORIZONTAL_ORBIT_CATEGORIES as readonly string[]).includes(category);
}

export interface CategoryCameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  duration: number;
}

export type CameraPresetMap = Record<EditorTab, CategoryCameraPreset>;

const BODY_VIEW: CategoryCameraPreset = {
  position: [-1, 1.3, 4],
  target: [0, 0.2, 0],
  duration: 0.3,
};

const CLOTHING_VIEW: CategoryCameraPreset = {
  position: [1, 1.0, 3],
  target: [0, 0.9, 0],
  duration: 0.3,
};

export const CAMERA_PRESETS: CameraPresetMap = {
  eyes: {
    position: [0, 1.6, 1.8],
    target: [0, 1.5, 0],
    duration: 0.3,
  },
  iris: {
    position: [0, 1.6, 1.8],
    target: [0, 1.5, 0],
    duration: 0.3,
  },
  nose: {
    position: [0, 1.4, 1.8],
    target: [0, 1.35, 0],
    duration: 0.3,
  },
  body: BODY_VIEW,
  fur: {
    position: [0, 1.0, 3],
    target: [0, 0.8, 0],
    duration: 0.3,
  },
  clothingTop: CLOTHING_VIEW,
  clothingBottom: CLOTHING_VIEW,
};
