import * as THREE from 'three';
import type { WeldJointType } from '@/types/weld';

// Computes true 3D torch orientation vector taking into account surface normal, seam direction, work tilt angle, travel lead angle, and joint type
export function getEffectiveTorchVector(
  pStart: THREE.Vector3,
  pEnd: THREE.Vector3,
  surfaceNormal: THREE.Vector3,
  tiltAngleDeg: number = 45,
  leadAngleDeg: number = 0,
  jointType: WeldJointType = 'FILLET'
): THREE.Vector3 {
  const norm = surfaceNormal.clone().normalize();
  if (norm.lengthSq() < 0.001) norm.set(0, 1, 0);

  const travelDir = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
  if (travelDir.lengthSq() < 0.001) travelDir.set(1, 0, 0);

  let side = new THREE.Vector3().crossVectors(travelDir, norm).normalize();
  if (side.lengthSq() < 0.001) {
    side = new THREE.Vector3(1, 0, 0).cross(norm).normalize();
    if (side.lengthSq() < 0.001) side = new THREE.Vector3(0, 0, 1).cross(norm).normalize();
  }

  // Joint nominal tilt angle: 45° for fillet/corner/lap bisectors, 0° for butt/groove
  const nominalTilt = jointType === 'BUTT' ? 0 : 45;
  const deltaTilt = ((tiltAngleDeg ?? nominalTilt) - nominalTilt) * (Math.PI / 180);
  const leadRad = (leadAngleDeg || 0) * (Math.PI / 180);

  const torchAxis = norm.clone();

  // Apply work tilt angle in the transverse cross-section plane
  if (Math.abs(deltaTilt) > 0.001) {
    torchAxis.applyAxisAngle(travelDir, deltaTilt);
  }

  // Apply travel lead/push angle along the seam travel direction
  if (Math.abs(leadRad) > 0.001) {
    torchAxis.applyAxisAngle(side, -leadRad);
  }

  return torchAxis.normalize();
}
