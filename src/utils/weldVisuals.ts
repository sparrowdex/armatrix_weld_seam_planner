import * as THREE from 'three';

/* ------------------------------------------------------------------------------------------------
 * Weld bead and heat visuals
 *  - Rippled "stack of dimes" bead geometry
 *  - Bead material that is revealed as metal is deposited and glows while hot, then cools
 *  - Heat-affected-zone (HAZ) temper tint injected into the part material
 * ---------------------------------------------------------------------------------------------- */

/** Shared clock (seconds, performance.now based) read by every hot bead material. */
export const heatClock = { value: 0 };

/** Bead cooling time constant (s): glow is gone after roughly 4τ. */
export const BEAD_COOL_TAU = 1.6;

/** Ripple pitch grows with travel speed: faster travel spreads the solidified ripples further apart. */
export function ripplePitchMm(travelSpeedMmS: number): number {
  return THREE.MathUtils.clamp(0.6 + travelSpeedMmS * 0.06, 0.8, 3.0);
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Bead along local +Z from z = 0 (seam start) to z = length (seam end).
 * Crescent ripples: equal-phase lines lag behind at the bead toes, like a real MIG bead, with the
 * crest sharp on the leading side. Ends taper to model the arc start and the crater fill.
 * @param crownAngle angle (rad, in the local XY plane) of the bead crown, i.e. the exposed top.
 */
export function createRippledBeadGeometry(
  length: number,
  radius: number,
  pitch: number,
  crownAngle: number
): THREE.BufferGeometry {
  const radial = 20;
  const segments = Math.min(800, Math.max(8, Math.ceil(length / (pitch / 4))));
  const g = new THREE.CylinderGeometry(radius, radius, length, radial, segments, false);
  g.translate(0, length / 2, 0);
  g.rotateX(Math.PI / 2); // axis now +Z, z in [0, length]

  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, y);
    if (r < 1e-6) continue; // cap centres

    const phi = Math.atan2(y, x);
    const dTheta = Math.atan2(Math.sin(phi - crownAngle), Math.cos(phi - crownAngle));
    const lag = radius * 0.9 * (1 - Math.cos(dTheta));
    const phase = (z + lag) / pitch;
    const f = phase - Math.floor(phase);
    const ripple = 0.5 - 0.5 * Math.cos(Math.PI * 2 * Math.pow(f, 1.4)); // soft, slightly skewed crest

    const taper = smooth(0, radius, z) * smooth(0, radius * 0.8, length - z);
    // Ripples mostly read on the crown; they fade out toward the toes where the bead wets into the plate
    const crownWeight = 0.35 + 0.65 * Math.max(0, Math.cos(dTheta));
    const scale = (1 + 0.035 * (ripple - 0.5) * crownWeight) * (0.55 + 0.45 * taper);
    pos.setXY(i, x * scale, y * scale);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Crown angle in the bead's local frame for a bead placed at p1 looking at p2. */
export function beadCrownAngle(p1: THREE.Vector3, p2: THREE.Vector3, worldNormal: THREE.Vector3): number {
  const probe = new THREE.Object3D();
  probe.position.copy(p1);
  probe.lookAt(p2);
  const local = worldNormal.clone().normalize().applyQuaternion(probe.quaternion.clone().invert());
  return Math.atan2(local.y, local.x);
}

/**
 * Metallic bead material with deposition reveal and cooling glow.
 * Each fragment's deposit time is uStart + z / uSpeed. Fragments not yet deposited are discarded,
 * deposited ones glow by exp(−age / τ): white-yellow, orange, dull red, then plain metal.
 * Use uStart = −1e6 for a bead that is fully deposited and cold.
 */
export function createHotBeadMaterial(startSec: number, speedMmS: number): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: '#C9D3C9', metalness: 0.9, roughness: 0.28 });
  const uStart = { value: startSec };
  const uSpeed = { value: Math.max(0.001, speedMmS) };
  mat.userData.heat = { uStart, uSpeed };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNow = heatClock;
    shader.uniforms.uStart = uStart;
    shader.uniforms.uSpeed = uSpeed;
    shader.uniforms.uTau = { value: BEAD_COOL_TAU };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vBeadZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBeadZ = position.z;');

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vBeadZ;
uniform float uNow;
uniform float uStart;
uniform float uSpeed;
uniform float uTau;
float beadHeat;`
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
float beadAge = uNow - (uStart + vBeadZ / uSpeed);
if (beadAge < 0.0) discard;
beadHeat = exp(-beadAge / uTau);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
vec3 heatCol = mix(vec3(0.45, 0.04, 0.0), vec3(1.0, 0.42, 0.04), smoothstep(0.12, 0.55, beadHeat));
heatCol = mix(heatCol, vec3(1.0, 0.88, 0.62), smoothstep(0.72, 1.0, beadHeat));
totalEmissiveRadiance += heatCol * smoothstep(0.02, 0.3, beadHeat) * 2.6;`
      );
  };
  mat.customProgramCacheKey = () => 'hot-bead-v1';
  return mat;
}

/* ---------------------------------------- HAZ temper tint --------------------------------------- */

export const HAZ_MAX_SEGMENTS = 48;

export interface HazUniforms {
  uHazA: { value: THREE.Vector3[] };
  uHazB: { value: THREE.Vector3[] };
  /** Time (heatClock seconds) each segment was last heated; the tint fades out after it cools. */
  uHazT: { value: number[] };
  uHazCount: { value: number };
  uHazWidth: { value: number };
}

export function createHazUniforms(): HazUniforms {
  return {
    uHazA: { value: Array.from({ length: HAZ_MAX_SEGMENTS }, () => new THREE.Vector3()) },
    uHazB: { value: Array.from({ length: HAZ_MAX_SEGMENTS }, () => new THREE.Vector3()) },
    uHazT: { value: Array.from({ length: HAZ_MAX_SEGMENTS }, () => -1e6) },
    uHazCount: { value: 0 },
    uHazWidth: { value: 5 },
  };
}

/** Seconds after a segment's last heat input before its tint has fully faded. */
export const HAZ_FADE_END_SEC = 8;

/** Writes welded segments (world space) and the time each finished heating into the HAZ uniforms. */
export function setHazSegments(u: HazUniforms, segments: Array<[THREE.Vector3, THREE.Vector3, number]>) {
  const n = Math.min(HAZ_MAX_SEGMENTS, segments.length);
  for (let i = 0; i < n; i++) {
    u.uHazA.value[i].copy(segments[i][0]);
    u.uHazB.value[i].copy(segments[i][1]);
    u.uHazT.value[i] = segments[i][2];
  }
  u.uHazCount.value = n;
}

/**
 * Injects temper colours into the part material around welded segments. Moving outward from the
 * weld toe: dark blue, purple, bronze, straw, then clean base metal. Blended subtly so the part
 * still reads as one material.
 */
export function applyHazTint(mat: THREE.MeshStandardMaterial, u: HazUniforms) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHazA = u.uHazA;
    shader.uniforms.uHazB = u.uHazB;
    shader.uniforms.uHazT = u.uHazT;
    shader.uniforms.uHazNow = heatClock;
    shader.uniforms.uHazCount = u.uHazCount;
    shader.uniforms.uHazWidth = u.uHazWidth;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHazWorld;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvHazWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
#define HAZ_MAX ${HAZ_MAX_SEGMENTS}
varying vec3 vHazWorld;
uniform vec3 uHazA[HAZ_MAX];
uniform vec3 uHazB[HAZ_MAX];
uniform float uHazT[HAZ_MAX];
uniform float uHazNow;
uniform int uHazCount;
uniform float uHazWidth;
float hazSegDist(vec3 p, vec3 a, vec3 b) {
  vec3 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return length(p - (a + ab * t));
}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
if (uHazCount > 0) {
  // Nearest still-warm segment; each segment's tint fades out a few seconds after it stops being heated
  float d = 1e6;
  float fade = 0.0;
  for (int i = 0; i < HAZ_MAX; i++) {
    if (i >= uHazCount) break;
    float f = 1.0 - smoothstep(3.0, ${HAZ_FADE_END_SEC.toFixed(1)}, uHazNow - uHazT[i]);
    if (f <= 0.0) continue;
    float di = hazSegDist(vHazWorld, uHazA[i], uHazB[i]);
    if (di < d) { d = di; fade = f; }
  }
  float x = clamp((d - 2.0) / uHazWidth, 0.0, 1.0); // 0 at the weld toe, 1 at the HAZ edge
  // Temper colours act as a multiplicative stain: oxide films only ever darken and shift the hue,
  // they never make the plate brighter. Dark blue at the toe, then purple, bronze, faint straw.
  vec3 c = mix(vec3(0.55, 0.62, 0.95), vec3(0.85, 0.66, 0.95), smoothstep(0.0, 0.3, x));
  c = mix(c, vec3(0.95, 0.78, 0.55), smoothstep(0.25, 0.6, x));
  c = mix(c, vec3(1.0, 0.95, 0.82), smoothstep(0.55, 0.85, x));
  float strength = (1.0 - smoothstep(0.6, 1.0, x)) * 0.6 * fade;
  diffuseColor.rgb *= mix(vec3(1.0), c * 0.92, strength);
}`
      );
  };
  mat.customProgramCacheKey = () => 'haz-tint-v1';
}
