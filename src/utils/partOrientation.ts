import * as THREE from 'three';

/** Quarter turns applied to an uploaded part on import (0 to 3 each). */
export interface PartRotation {
  x: number;
  z: number;
}

/**
 * Rotates a freshly parsed STL in place, before it is centred and seated on the table.
 * STL has no notion of "up": Z-up exports (AutoCAD, Blender, Rhino and others) arrive lying on their
 * side in this Y-up planner, and a quarter turn about X stands them up.
 */
export function applyPartRotation(geometry: THREE.BufferGeometry, rot: PartRotation): void {
  if (rot.x) geometry.rotateX((rot.x * Math.PI) / 2);
  if (rot.z) geometry.rotateZ((rot.z * Math.PI) / 2);
}
