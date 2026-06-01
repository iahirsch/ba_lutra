import React, { createContext, useContext, type ReactNode } from 'react';
import type { Object3D } from 'three';

/**
 * Shares the cloned body `Object3D` with part components rendered as children of
 * `CompanionBody`, so interchangeable GLBs can merge skinned meshes into the rig.
 */
const CompanionBodySceneContext = createContext<Object3D | null>(null);

export function CompanionBodySceneProvider({
  bodyScene,
  children,
}: {
  bodyScene: Object3D;
  children?: ReactNode;
}) {
  return (
    <CompanionBodySceneContext.Provider value={bodyScene}>
      {children}
    </CompanionBodySceneContext.Provider>
  );
}

export function useCompanionBodyScene(): Object3D | null {
  return useContext(CompanionBodySceneContext);
}
