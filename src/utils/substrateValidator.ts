import * as THREE from 'three';
import { Vector3D } from '@/types/weld';

const raycaster = new THREE.Raycaster();
raycaster.params.Mesh = { threshold: 0.1 };

export interface SubstrateValidationResult {
  hasSubstrate: boolean;
  isAirGap: boolean;
  gapDistanceMm: number;
}

/**
 * Validates whether a weld seam path has underlying metal substrate or bridges across empty air.
 * Samples points along the path (at 25%, 50%, 75%) and probes inward towards the CAD workpiece mesh.
 * If the distance to the nearest metal surface exceeds the allowable threshold (4.5mm),
 * the seam is flagged as an invalid Air Gap (Non-Manufacturable).
 */
export function validatePathSubstrate(
  pStart: Vector3D | THREE.Vector3,
  pEnd: Vector3D | THREE.Vector3,
  surfaceNormal: Vector3D | THREE.Vector3,
  mesh: THREE.Mesh | null
): SubstrateValidationResult {
  if (!mesh) {
    return { hasSubstrate: true, isAirGap: false, gapDistanceMm: 0 };
  }

  const vStart = new THREE.Vector3(pStart.x, pStart.y, pStart.z);
  const vEnd = new THREE.Vector3(pEnd.x, pEnd.y, pEnd.z);
  const norm = new THREE.Vector3(surfaceNormal.x, surfaceNormal.y, surfaceNormal.z).normalize();
  if (norm.lengthSq() < 0.001) norm.set(0, 1, 0);

  const len = vStart.distanceTo(vEnd);
  if (len < 2.0) {
    return { hasSubstrate: true, isAirGap: false, gapDistanceMm: 0 };
  }

  // Sample 3 equidistant points along the line segment: 25%, 50%, 75%
  const samples = [0.25, 0.5, 0.75];
  const probeDirs = [
    new THREE.Vector3(-norm.x, -norm.y, -norm.z).normalize(),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(1, 0, 0),
  ];

  let maxGapDistance = 0;
  let gapDetected = false;

  for (const t of samples) {
    const pt = new THREE.Vector3().lerpVectors(vStart, vEnd, t);
    let closestSurfaceDist = Infinity;

    for (const dir of probeDirs) {
      // Cast inward from standoff (4mm above surface along probe reverse)
      const origin = pt.clone().addScaledVector(dir, -4.0);
      raycaster.set(origin, dir);
      const hits = raycaster.intersectObject(mesh, true);
      if (hits.length > 0) {
        const d = pt.distanceTo(hits[0].point);
        if (d < closestSurfaceDist) {
          closestSurfaceDist = d;
        }
      }
    }

    if (closestSurfaceDist > 4.5) {
      gapDetected = true;
      maxGapDistance = Math.max(maxGapDistance, closestSurfaceDist);
    }
  }

  return {
    hasSubstrate: !gapDetected,
    isAirGap: gapDetected,
    gapDistanceMm: maxGapDistance > 0 ? parseFloat(maxGapDistance.toFixed(1)) : 0,
  };
}

