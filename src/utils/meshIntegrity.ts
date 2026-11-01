import * as THREE from 'three';

export interface MeshIntegrity {
  /** Edges used by exactly one triangle: holes or open boundaries in the surface. */
  openEdges: number;
  /** Edges shared by more than two triangles: overlapping shells or fins. */
  nonManifoldEdges: number;
  /**
   * No holes: every edge is closed. Non-manifold edges are reported but do not fail the check, because
   * welded assemblies exported as one STL legitimately share edges where separate bodies touch.
   */
  isWatertight: boolean;
}

/**
 * Edge-manifold check for an STL triangle soup.
 * STL stores every triangle with its own copy of each vertex, so vertices are first welded by
 * position (quantised to 1 µm). Then every undirected edge is counted: on a closed (watertight)
 * surface each edge is shared by exactly two triangles.
 */
export function analyzeMeshIntegrity(geometry: THREE.BufferGeometry): MeshIntegrity {
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;

  const weldIds = new Map<string, number>();
  const vertexId = (i: number) => {
    const key = `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`;
    let id = weldIds.get(key);
    if (id === undefined) {
      id = weldIds.size;
      weldIds.set(key, id);
    }
    return id;
  };

  const ids = new Int32Array(triCount * 3);
  for (let t = 0; t < triCount * 3; t++) {
    ids[t] = vertexId(index ? index.getX(t) : t);
  }

  const n = weldIds.size;
  const edgeUse = new Map<number, number>();
  const addEdge = (a: number, b: number) => {
    if (a === b) return; // degenerate sliver edge
    const key = a < b ? a * n + b : b * n + a;
    edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1);
  };

  for (let t = 0; t < triCount; t++) {
    const a = ids[t * 3];
    const b = ids[t * 3 + 1];
    const c = ids[t * 3 + 2];
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }

  let openEdges = 0;
  let nonManifoldEdges = 0;
  edgeUse.forEach((count) => {
    if (count === 1) openEdges++;
    else if (count > 2) nonManifoldEdges++;
  });

  return { openEdges, nonManifoldEdges, isWatertight: openEdges === 0 };
}
