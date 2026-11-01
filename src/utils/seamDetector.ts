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
    centroids: THREE.Vector3[];
    faces: number[];
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
  const tris: Array<{ tri: THREE.Triangle; normal: THREE.Vector3; box: THREE.Box3 }> = [];

  for (let i = 0; i < triangleCount; i++) {
    vA.fromBufferAttribute(posAttr, i * 3);
    vB.fromBufferAttribute(posAttr, i * 3 + 1);
    vC.fromBufferAttribute(posAttr, i * 3 + 2);

    // Compute face normal
    edge1.subVectors(vB, vA);
    edge2.subVectors(vC, vA);
    const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    if (faceNormal.lengthSq() < 0.0001) continue; // Degenerate triangle
    const centroid = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
    const tri = new THREE.Triangle(vA.clone(), vB.clone(), vC.clone());
    tris[i] = { tri, normal: faceNormal, box: new THREE.Box3().setFromPoints([tri.a, tri.b, tri.c]) };

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
        rec = { p1, p2, normals: [], centroids: [], faces: [] };
        edgeMap.set(key, rec);
      }
      rec.normals.push(faceNormal);
      rec.centroids.push(centroid);
      rec.faces.push(i);
    }
  }

  // Find candidate edges where dihedral angle is significant
  type Candidate = { p1: THREE.Vector3; p2: THREE.Vector3; normal: THREE.Vector3; length: number; faces?: number[]; n1?: THREE.Vector3; n2?: THREE.Vector3 };
  const concave: Candidate[] = [];
  const convex: Candidate[] = [];

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
        // Concave (inside corner, the classic fillet root): face 2 lies in front of face 1's plane.
        // Convex (outside corner): face 2 lies behind it.
        const isConcave = n1.dot(new THREE.Vector3().subVectors(record.centroids[1], record.centroids[0])) > 1e-6;

        // A torch cannot reach an inside corner whose approach direction points down into the fixture
        // table. (Convex edges are only kept as contact-line candidates, which get their own direction.)
        if (isConcave && avgNormal.y < -0.3) continue;

        const length = record.p1.distanceTo(record.p2);
        if (length > 0.5 * Math.min(1, minLength / 5)) {
          (isConcave ? concave : convex).push({ p1: record.p1, p2: record.p2, normal: avgNormal, length, faces: record.faces, n1, n2 });
        }
      }
    }
  }

  // Contact lines: an outside edge of one body lying on a face of another body (e.g. a gusset or an
  // upright plate standing on a base plate, exported as separate shells). That line is a real weld root
  // even though the two bodies share no mesh edge. Plain outside edges of a single solid are not welds.
  const contact: Candidate[] = [];
  const tol = Math.max(1e-4, minLength * 0.02);
  if (triangleCount <= 30000) {
    const mid = new THREE.Vector3();
    const closest = new THREE.Vector3();
    const plane = new THREE.Plane();
    for (const c of convex) {
      mid.addVectors(c.p1, c.p2).multiplyScalar(0.5);
      for (let t = 0; t < tris.length; t++) {
        const rec = tris[t];
        if (!rec || c.faces!.includes(t)) continue;
        if (rec.box.distanceToPoint(mid) <= tol) {
          rec.tri.getPlane(plane);
          // the whole edge must lie in the other face's plane, and its midpoint on that face
          if (Math.abs(plane.distanceToPoint(c.p1)) > tol || Math.abs(plane.distanceToPoint(c.p2)) > tol) continue;
          rec.tri.closestPointToPoint(mid, closest);
          if (closest.distanceTo(mid) > tol) continue;
          // Torch bisects the visible face of this body and the face it stands on
          const plateN = rec.normal;
          const visible = c.n1!.dot(plateN) > -0.5 ? c.n1! : c.n2!;
          if (visible.dot(plateN) <= -0.5) break;
          const n = new THREE.Vector3().addVectors(visible, plateN).normalize();
          if (n.y < -0.3) break; // still never from below the table
          contact.push({ p1: c.p1, p2: c.p2, normal: n, length: c.length });
          break;
        }
      }
    }
  }

  // Weld roots: inside corners of merged bodies plus contact lines between separate bodies
  const candidates = [...concave, ...contact];

  // Merge nearly collinear adjacent edge segments into continuous seams
  const mergedSeams: DetectedSeamCandidate[] = [];
  const joinTol = Math.min(1.0, Math.max(0.01, minLength * 0.2));
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

        if (end.distanceTo(cand.p1) < joinTol) {
          end.copy(cand.p2);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        } else if (end.distanceTo(cand.p2) < joinTol) {
          end.copy(cand.p1);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        } else if (start.distanceTo(cand.p2) < joinTol) {
          start.copy(cand.p1);
          avgNorm.add(cand.normal);
          normCount++;
          visited.add(j);
          extended = true;
          break;
        } else if (start.distanceTo(cand.p1) < joinTol) {
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

