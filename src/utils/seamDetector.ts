import * as THREE from 'three';
import { Vector3D } from '@/types/weld';

export interface DetectedSeamCandidate {
  start: Vector3D;
  end: Vector3D;
  normal: Vector3D;
  length: number;
}

/**
 * Detects sharp crease edges on a BufferGeometry that represent welded seams/fillets.
 * @param geometry THREE.BufferGeometry
 * @param minCreaseAngleDeg Minimum dihedral angle between adjacent faces (e.g. 40 degrees)
 * @param minLength Minimum length of seam segment in mm (e.g. 10mm to ignore tiny noise)
 */
export function detectCandidateSeams(
  geometry: THREE.BufferGeometry,
  minCreaseAngleDeg: number = 40,
  minLength: number = 15
): DetectedSeamCandidate[] {
  const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geom.computeVertexNormals();

  const posAttr = geom.getAttribute('position');
  if (!posAttr) return [];

  const minCreaseRad = (minCreaseAngleDeg * Math.PI) / 180;
  const triangleCount = posAttr.count / 3;

  // Map to store edges: key -> { v1, v2, normal1, normal2, count }
  interface EdgeRecord {
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    normals: THREE.Vector3[];
  }

  const edgeMap = new Map<string, EdgeRecord>();

  function makeKey(p1: THREE.Vector3, p2: THREE.Vector3): string {
    // Quantize to 0.1mm to account for float imprecision in STL vertices
    const q1 = `${Math.round(p1.x * 10)},${Math.round(p1.y * 10)},${Math.round(p1.z * 10)}`;
    const q2 = `${Math.round(p2.x * 10)},${Math.round(p2.y * 10)},${Math.round(p2.z * 10)}`;
    return q1 < q2 ? `${q1}_${q2}` : `${q2}_${q1}`;
  }

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();

  for (let i = 0; i < triangleCount; i++) {
    vA.fromBufferAttribute(posAttr, i * 3);
    vB.fromBufferAttribute(posAttr, i * 3 + 1);
    vC.fromBufferAttribute(posAttr, i * 3 + 2);

    // Compute face normal
    edge1.subVectors(vB, vA);
    edge2.subVectors(vC, vA);
    const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    if (faceNormal.lengthSq() < 0.0001) continue; // Degenerate triangle

    // Register 3 edges
    const edges = [
      [vA.clone(), vB.clone()],
      [vB.clone(), vC.clone()],
      [vC.clone(), vA.clone()],
    ];

    for (const [p1, p2] of edges) {
      const key = makeKey(p1, p2);
      let rec = edgeMap.get(key);
      if (!rec) {
        rec = { p1, p2, normals: [] };
        edgeMap.set(key, rec);
      }
      rec.normals.push(faceNormal);
    }
  }

  // Find candidate edges where dihedral angle is significant
  const candidates: Array<{ p1: THREE.Vector3; p2: THREE.Vector3; normal: THREE.Vector3; length: number }> = [];

  for (const record of edgeMap.values()) {
    if (record.normals.length === 2) {
      const n1 = record.normals[0];
      const n2 = record.normals[1];
      const dot = Math.max(-1, Math.min(1, n1.dot(n2)));
      const angle = Math.acos(dot);

      if (angle >= minCreaseRad && angle <= Math.PI * 0.95) {
        // Average normal (pointing outward from joint)
        const avgNormal = new THREE.Vector3().addVectors(n1, n2).normalize();
        if (avgNormal.lengthSq() < 0.01) {
          avgNormal.copy(n1);
        }
        const length = record.p1.distanceTo(record.p2);
        if (length > 0.5) {
          candidates.push({
            p1: record.p1,
            p2: record.p2,
            normal: avgNormal,
            length,
          });
        }
      }
    }
  }

  // Merge nearly collinear adjacent edge segments into continuous seams
  const mergedSeams: DetectedSeamCandidate[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < candidates.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    let start = candidates[i].p1.clone();
    let end = candidates[i].p2.clone();
    let avgNorm = candidates[i].normal.clone();
    let normCount = 1;

    let extended = true;
    while (extended) {
      extended = false;
      const dir = new THREE.Vector3().subVectors(end, start).normalize();

      for (let j = 0; j < candidates.length; j++) {
        if (visited.has(j)) continue;
        const cand = candidates[j];
        const candDir = new THREE.Vector3().subVectors(cand.p2, cand.p1).normalize();

        // Check if nearly collinear and touching either start or end
        const isCollinear = Math.abs(dir.dot(candDir)) > 0.92;
        if (!isCollinear) continue;

        if (end.distanceTo(cand.p1) < 1.0) {
          end.copy(cand.p2);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        } else if (end.distanceTo(cand.p2) < 1.0) {
          end.copy(cand.p1);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        } else if (start.distanceTo(cand.p2) < 1.0) {
          start.copy(cand.p1);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        } else if (start.distanceTo(cand.p1) < 1.0) {
          start.copy(cand.p2);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        }
      }
    }

    const seamLength = start.distanceTo(end);
    if (seamLength >= minLength) {
      avgNorm.divideScalar(normCount).normalize();
      mergedSeams.push({
        start: { x: parseFloat(start.x.toFixed(2)), y: parseFloat(start.y.toFixed(2)), z: parseFloat(start.z.toFixed(2)) },
        end: { x: parseFloat(end.x.toFixed(2)), y: parseFloat(end.y.toFixed(2)), z: parseFloat(end.z.toFixed(2)) },
        normal: { x: parseFloat(avgNorm.x.toFixed(3)), y: parseFloat(avgNorm.y.toFixed(3)), z: parseFloat(avgNorm.z.toFixed(3)) },
        length: parseFloat(seamLength.toFixed(2)),
      });
    }
  }

  // Return sorted by length descending
  return mergedSeams.sort((a, b) => b.length - a.length);
}

