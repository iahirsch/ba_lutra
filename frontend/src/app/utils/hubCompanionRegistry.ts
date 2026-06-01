interface CompanionPosition {
  x: number;
  z: number;
}

interface PoiClaim {
  poiName: string;
  slot: number;
}

const positions = new Map<string, CompanionPosition>();
const poiSlotOccupants = new Map<string, Map<number, string>>();
const companionClaims = new Map<string, PoiClaim>();

export function setCompanionHubPosition(
  companionId: string,
  x: number,
  z: number,
): void {
  positions.set(companionId, { x, z });
}

export function removeCompanionHubPosition(companionId: string): void {
  positions.delete(companionId);
  releaseHubPoiClaim(companionId);
}

export function isTooCloseToOtherCompanions(
  x: number,
  z: number,
  excludeId: string,
  minDistance: number,
): boolean {
  const minDistanceSq = minDistance * minDistance;
  for (const [id, position] of positions) {
    if (id === excludeId) continue;
    const dx = x - position.x;
    const dz = z - position.z;
    if (dx * dx + dz * dz < minDistanceSq) {
      return true;
    }
  }
  return false;
}

export function applyCompanionSeparation(
  x: number,
  z: number,
  excludeId: string,
  minDistance: number,
  strength: number,
  delta: number,
  shareGatherPoi?: string,
): { x: number; z: number } {
  let nextX = x;
  let nextZ = z;

  for (const [id, other] of positions) {
    if (id === excludeId) continue;
    if (shareGatherPoi) {
      const otherClaim = companionClaims.get(id);
      if (otherClaim?.poiName === shareGatherPoi) {
        continue;
      }
    }
    const sepDx = nextX - other.x;
    const sepDz = nextZ - other.z;
    const sepDist = Math.hypot(sepDx, sepDz);
    if (sepDist >= minDistance || sepDist < 0.001) {
      continue;
    }
    const push = ((minDistance - sepDist) / minDistance) * strength * delta;
    nextX += (sepDx / sepDist) * push;
    nextZ += (sepDz / sepDist) * push;
  }

  return { x: nextX, z: nextZ };
}

export function hasFreeHubPoiSlot(
  poiName: string,
  capacity: number,
  companionId: string,
): boolean {
  const claim = companionClaims.get(companionId);
  if (claim?.poiName === poiName) {
    return true;
  }
  const slots = poiSlotOccupants.get(poiName);
  return (slots?.size ?? 0) < capacity;
}

export function claimHubPoiSlot(
  poiName: string,
  capacity: number,
  companionId: string,
): number | null {
  const existing = companionClaims.get(companionId);
  if (existing?.poiName === poiName) {
    return existing.slot;
  }

  let slots = poiSlotOccupants.get(poiName);
  if (!slots) {
    slots = new Map();
    poiSlotOccupants.set(poiName, slots);
  }

  for (let slot = 0; slot < capacity; slot++) {
    if (slots.has(slot)) {
      continue;
    }
    slots.set(slot, companionId);
    companionClaims.set(companionId, { poiName, slot });
    return slot;
  }

  return null;
}

export function releaseHubPoiClaim(companionId: string): void {
  const claim = companionClaims.get(companionId);
  if (!claim) {
    return;
  }

  const slots = poiSlotOccupants.get(claim.poiName);
  if (slots?.get(claim.slot) === companionId) {
    slots.delete(claim.slot);
    if (slots.size === 0) {
      poiSlotOccupants.delete(claim.poiName);
    }
  }
  companionClaims.delete(companionId);
}
