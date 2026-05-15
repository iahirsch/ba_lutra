import type { EditorTab } from '../store/companionStore';

export const HORIZONTAL_ORBIT_CATEGORIES = ['body', 'fur', 'clothing'] as const;
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

export const CAMERA_PRESETS: CameraPresetMap = {
  eyes: {
    position: [0, 1.6, 1.8],
    target: [0, 1.5, 0],
    duration: 0.3,
  },
  nose: {
    position: [0, 1.4, 1.8],
    target: [0, 1.35, 0],
    duration: 0.3,
  },
  ears: {
    position: [0, 1.8, 1.8],
    target: [0, 1.7, 0],
    duration: 0.3,
  },
  body: {
    position: [-1, 1.0, 3],
    target: [0, 0.8, 0],
    duration: 0.3,
  },
  fur: {
    position: [0, 1.0, 3],
    target: [0, 0.8, 0],
    duration: 0.3,
  },
  tail: {
    position: [2, 0.8, -2],
    target: [0, 0.5, 0],
    duration: 0.4,
  },
  backpack: {
    position: [-1, 1, -1.5],
    target: [0.2, 1, 0],
    duration: 0.4,
  },
  clothing: {
    position: [1, 1.0, 3],
    target: [0, 0.8, 0],
    duration: 0.3,
  },
};
