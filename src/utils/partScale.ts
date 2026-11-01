/**
 * Size factor for on-screen helpers (snap reticle, seam pins, arrows, snap radii, camera framing).
 * Benchmark-sized parts (bounding radius roughly 55 to 145 mm) use exactly 1, so they look as designed;
 * much smaller or larger parts scale the helpers with them. Physical things (torch, bead, standoffs)
 * are never scaled: they stay in real millimetres.
 */
export function gizmoScaleForRadius(radiusMm: number): number {
  const s = radiusMm / 90;
  if (s > 0.6 && s < 1.6) return 1;
  if (s <= 0.6) return Math.max(0.01, s);
  // Large parts: grow with the square root, so markers stay visible when zoomed out
  // without turning into pipes that swallow the real-size torch up close
  return Math.min(12, 1.6 * Math.sqrt(s / 1.6));
}

/** Crease-detection minimum edge length: 5 mm on normal parts, shorter on small ones. */
export function minCreaseLengthMm(partDiagonalMm: number): number {
  return Math.min(5, Math.max(0.1, partDiagonalMm * 0.03));
}
