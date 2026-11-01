import * as THREE from 'three';
import type { Vector3D, WeldSeam } from '@/types/weld';

// CAD Magnetic Object Snapping (OSNAP) helper
export function getSnappedPoint(
  hit: THREE.Intersection,
  manualStartPoint: Vector3D | null,
  seams: WeldSeam[],
  mesh: THREE.Mesh,
  scale = 1
): { point: THREE.Vector3; normal: THREE.Vector3; snapType: string | null } {
  let p = hit.point.clone();
  let n = hit.face ? hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize() : new THREE.Vector3(0, 1, 0);
  let snapType: string | null = null;

  // 1. Existing Seam Endpoint Magnetic Snap (8mm threshold)
  for (const seam of seams) {
    const s1 = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
    const s2 = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
    if (p.distanceTo(s1) < 8.0 * scale) {
      return { point: s1, normal: new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z), snapType: 'SEAM ENDPOINT' };
    }
    if (p.distanceTo(s2) < 8.0 * scale) {
      return { point: s2, normal: new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z), snapType: 'SEAM ENDPOINT' };
    }
  }

  // 2. Mesh Triangle Corner / Vertex Snap (6mm threshold)
  if (typeof hit.faceIndex === 'number' && mesh.geometry) {
    const geom = mesh.geometry;
    const pos = geom.attributes.position;
    if (pos) {
      const idx = hit.faceIndex * 3;
      const vA = new THREE.Vector3().fromBufferAttribute(pos, idx).applyMatrix4(mesh.matrixWorld);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, idx + 1).applyMatrix4(mesh.matrixWorld);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, idx + 2).applyMatrix4(mesh.matrixWorld);

      const dA = p.distanceTo(vA);
      const dB = p.distanceTo(vB);
      const dC = p.distanceTo(vC);
      const minD = Math.min(dA, dB, dC);

      if (minD < 6.0 * scale) {
        if (minD === dA) return { point: vA, normal: n, snapType: 'VERTEX CORNER' };
        if (minD === dB) return { point: vB, normal: n, snapType: 'VERTEX CORNER' };
        if (minD === dC) return { point: vC, normal: n, snapType: 'VERTEX CORNER' };
      }
    }
  }

  // 3. Orthogonal Axis Lock from manualStartPoint (Snap to exact straight line along X, Y, or Z)
  if (manualStartPoint) {
    const dx = Math.abs(p.x - manualStartPoint.x);
    const dy = Math.abs(p.y - manualStartPoint.y);
    const dz = Math.abs(p.z - manualStartPoint.z);

    const lock = 4.5 * scale;
    const far = 6.0 * scale;
    if (dy < lock && dz < lock && dx > far) {
      p.y = manualStartPoint.y;
      p.z = manualStartPoint.z;
      snapType = 'AXIS LOCK (X)';
    } else if (dx < lock && dz < lock && dy > far) {
      p.x = manualStartPoint.x;
      p.z = manualStartPoint.z;
      snapType = 'AXIS LOCK (Y)';
    } else if (dx < lock && dy < lock && dz > far) {
      p.x = manualStartPoint.x;
      p.y = manualStartPoint.y;
      snapType = 'AXIS LOCK (Z)';
    }
  }

  return { point: p, normal: n, snapType };
}
