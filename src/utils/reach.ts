import type { PartMetadata } from '@/types/weld';

/** Armatrix snake-arm maximum reach envelope (mm). */
export const REACH_ENVELOPE_MM = 3500;

export interface ReachSummary {
  /** Bounding-box diagonal of the part: the farthest any two weld points can be apart. */
  partDiagonalMm: number;
  /** Diagonal as a percentage of the reach envelope. */
  envelopePct: number;
  /** True when the whole part fits inside the reach envelope. */
  withinReach: boolean;
}

export function getReachSummary(part: PartMetadata | null): ReachSummary | null {
  if (!part) return null;
  const { width, height, depth } = part.dimensions;
  const diagonal = Math.sqrt(width * width + height * height + depth * depth);
  return {
    partDiagonalMm: Math.round(diagonal * 10) / 10,
    envelopePct: Math.round((diagonal / REACH_ENVELOPE_MM) * 1000) / 10,
    withinReach: diagonal <= REACH_ENVELOPE_MM,
  };
}
