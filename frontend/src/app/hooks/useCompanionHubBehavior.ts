import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import type { CompanionBodyClip } from '../constants/companion-body-clips';
import {
  getGatherSlotXZ,
  getHubPoiCapacity,
  getHubPoiConfig,
} from '../constants/hub-poi-config';
import {
  HUB_COMPANION_ARRIVAL_DISTANCE,
  HUB_COMPANION_GROUND_OFFSET,
  HUB_COMPANION_IDLE_MAX,
  HUB_COMPANION_IDLE_MIN,
  HUB_COMPANION_MIN_SEPARATION,
  HUB_COMPANION_SEPARATION_STRENGTH,
  HUB_COMPANION_WALK_SPEED,
  HUB_POI_DETECT_RADIUS,
  HUB_POI_IDLE_MAX,
  HUB_POI_IDLE_MIN,
  HUB_POI_VISIT_CHANCE,
} from '../constants/hub-companion-behavior';
import type { HubWalkTerrain } from './useHubWalkTerrain';
import {
  applyCompanionSeparation,
  claimHubPoiSlot,
  hasFreeHubPoiSlot,
  releaseHubPoiClaim,
  removeCompanionHubPosition,
  setCompanionHubPosition,
} from '../utils/hubCompanionRegistry';

type BehaviorPhase = 'idle' | 'walking';

interface ActivePoiVisit {
  poiName: string;
  center: Vector3;
  slot: number;
  isGather: boolean;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface UseCompanionHubBehaviorOptions {
  companionId: string;
  walkTerrain: HubWalkTerrain;
  initialPosition: Vector3;
}

export function useCompanionHubBehavior({
  companionId,
  walkTerrain,
  initialPosition,
}: UseCompanionHubBehaviorOptions) {
  const groupRef = useRef<Group>(null);
  const phaseRef = useRef<BehaviorPhase>('idle');
  const idleTimerRef = useRef(randomRange(0.5, 2));
  const targetRef = useRef(new Vector3());
  const activeVisitRef = useRef<ActivePoiVisit | null>(null);
  const [activeClip, setActiveClip] = useState<CompanionBodyClip>('idle');
  const spawnPositionRef = useRef(initialPosition.clone());
  const positionRef = useRef(spawnPositionRef.current.clone());
  // Cache the last XZ at which ground-height was sampled so the raycaster
  // is skipped on frames where the companion hasn't moved.
  const lastSyncedXRef = useRef<number | null>(null);
  const lastSyncedZRef = useRef<number | null>(null);

  const syncGroup = (group: Group, faceCenter = false) => {
    const px = positionRef.current.x;
    const pz = positionRef.current.z;
    // Only re-cast against the terrain when XZ actually changed — the terrain
    // is static, so the result is identical every frame while idle.
    if (px !== lastSyncedXRef.current || pz !== lastSyncedZRef.current) {
      const groundY = walkTerrain.getGroundHeight(px, pz);
      if (groundY !== null) {
        positionRef.current.y = groundY + HUB_COMPANION_GROUND_OFFSET;
      }
      lastSyncedXRef.current = px;
      lastSyncedZRef.current = pz;
      setCompanionHubPosition(companionId, px, pz);
    }
    group.position.copy(positionRef.current);

    const visit = activeVisitRef.current;
    if (faceCenter && visit) {
      const position = positionRef.current;
      group.rotation.y = Math.atan2(
        visit.center.x - position.x,
        visit.center.z - position.z,
      );
    }
  };

  const clearActiveVisit = () => {
    releaseHubPoiClaim(companionId);
    activeVisitRef.current = null;
  };

  useEffect(() => {
    const spawn = spawnPositionRef.current;
    positionRef.current.copy(spawn);
    phaseRef.current = 'idle';
    setActiveClip('idle');
    activeVisitRef.current = null;
    idleTimerRef.current = randomRange(0.5, 2);
    lastSyncedXRef.current = null;
    lastSyncedZRef.current = null;
    setCompanionHubPosition(companionId, spawn.x, spawn.z);

    if (groupRef.current) {
      groupRef.current.position.copy(spawn);
    }

    return () => {
      removeCompanionHubPosition(companionId);
    };
  }, [companionId]);

  const resolvePoiTargetPosition = (
    poiName: string,
    center: Vector3,
    slot: number,
  ): Vector3 => {
    const config = getHubPoiConfig(poiName);
    if (config.type === 'multi') {
      const { x, z } = getGatherSlotXZ(
        center,
        slot,
        config.capacity,
        config.radius,
      );
      return new Vector3(x, center.y, z);
    }
    return center.clone();
  };

  const pickPoiTarget = (from: Vector3): Vector3 | null => {
    const detectRadiusSq = HUB_POI_DETECT_RADIUS * HUB_POI_DETECT_RADIUS;
    const nearbyPois = walkTerrain.pois.filter((poi) => {
      const config = getHubPoiConfig(poi.name);
      const capacity = getHubPoiCapacity(config);
      if (!hasFreeHubPoiSlot(poi.name, capacity, companionId)) {
        return false;
      }
      const dx = poi.position.x - from.x;
      const dz = poi.position.z - from.z;
      return dx * dx + dz * dz <= detectRadiusSq;
    });

    if (nearbyPois.length === 0) {
      return null;
    }

    const poi = nearbyPois[Math.floor(Math.random() * nearbyPois.length)];
    const config = getHubPoiConfig(poi.name);
    const capacity = getHubPoiCapacity(config);
    const slot = claimHubPoiSlot(poi.name, capacity, companionId);
    if (slot === null) {
      return null;
    }

    activeVisitRef.current = {
      poiName: poi.name,
      center: poi.position.clone(),
      slot,
      isGather: config.type === 'multi',
    };

    const target = resolvePoiTargetPosition(poi.name, poi.position, slot);
    if (!walkTerrain.isWalkableAt(target.x, target.z)) {
      clearActiveVisit();
      return null;
    }

    return target;
  };

  const pickNextTarget = (from: Vector3): Vector3 | null => {
    clearActiveVisit();

    if (Math.random() < HUB_POI_VISIT_CHANCE) {
      const poiTarget = pickPoiTarget(from);
      if (poiTarget) {
        return poiTarget;
      }
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const roamTarget = walkTerrain.sampleRoamWorldPosition(
        companionId,
        HUB_COMPANION_MIN_SEPARATION,
      );
      if (roamTarget) {
        return roamTarget;
      }
    }
    return null;
  };

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const position = positionRef.current;
    const visit = activeVisitRef.current;
    const shareGatherPoi = visit?.isGather ? visit.poiName : undefined;
    const faceCenter = visit?.isGather && phaseRef.current === 'idle';

    if (phaseRef.current === 'idle') {
      idleTimerRef.current -= delta;
      if (idleTimerRef.current > 0) {
        syncGroup(group, faceCenter);
        return;
      }

      const nextTarget = pickNextTarget(position);
      if (!nextTarget) {
        idleTimerRef.current = randomRange(
          HUB_COMPANION_IDLE_MIN,
          HUB_COMPANION_IDLE_MAX,
        );
        syncGroup(group, faceCenter);
        return;
      }

      targetRef.current.copy(nextTarget);
      phaseRef.current = 'walking';
      setActiveClip('walking');
    }

    if (phaseRef.current === 'walking') {
      const dx = targetRef.current.x - position.x;
      const dz = targetRef.current.z - position.z;
      const distance = Math.hypot(dx, dz);

      if (distance <= HUB_COMPANION_ARRIVAL_DISTANCE) {
        phaseRef.current = 'idle';
        setActiveClip('idle');
        idleTimerRef.current = randomRange(
          visit ? HUB_POI_IDLE_MIN : HUB_COMPANION_IDLE_MIN,
          visit ? HUB_POI_IDLE_MAX : HUB_COMPANION_IDLE_MAX,
        );
        syncGroup(group, visit?.isGather ?? false);
        return;
      }

      const prevX = position.x;
      const prevZ = position.z;
      const step = Math.min(HUB_COMPANION_WALK_SPEED * delta, distance);
      position.x += (dx / distance) * step;
      position.z += (dz / distance) * step;

      const separated = applyCompanionSeparation(
        position.x,
        position.z,
        companionId,
        HUB_COMPANION_MIN_SEPARATION,
        HUB_COMPANION_SEPARATION_STRENGTH,
        delta,
        shareGatherPoi,
      );
      const constrained = walkTerrain.constrainWalkPosition(
        separated.x,
        separated.z,
        prevX,
        prevZ,
      );
      position.x = constrained.x;
      position.z = constrained.z;

      if (constrained.blocked) {
        phaseRef.current = 'idle';
        setActiveClip('idle');
        clearActiveVisit();
        idleTimerRef.current = randomRange(
          HUB_COMPANION_IDLE_MIN,
          HUB_COMPANION_IDLE_MAX,
        );
        syncGroup(group);
        return;
      }

      group.rotation.y = Math.atan2(dx, dz);
      syncGroup(group);
    }
  });

  return {
    groupRef,
    activeClip,
  };
}
