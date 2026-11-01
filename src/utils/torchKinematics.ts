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

// Robust 6-DOF Orthonormal Torch Pose Calculator
// Positions the torch longitudinal axis along targetVector, while aligning the curved gooseneck
// handle strictly into open workspace clearance (UP / OUT), preventing upside-down or gusset collisions.
export function orientTorch(torch: THREE.Object3D, targetVector: THREE.Vector3) {
  const Y_world = targetVector.clone().normalize();
  if (Y_world.lengthSq() < 0.001) Y_world.set(0, 1, 0);

  // Clearance reference vector: for welding, open clearance is primarily UP (+Y)
  let refClearance = new THREE.Vector3(0, 1, 0);
  // If the torch is pointing nearly straight up (+Y) or down (-Y), use front (+Z) as reference clearance
  if (Math.abs(Y_world.y) > 0.85) {
    refClearance.set(0, 0, 1);
  }

  // Project refClearance perpendicular to Y_world so the gooseneck handle (local +Z) curves UP into clearance
  let Z_world = new THREE.Vector3().copy(refClearance).addScaledVector(Y_world, -refClearance.dot(Y_world)).normalize();
  if (Z_world.lengthSq() < 0.001) {
    Z_world.set(0, 0, 1).addScaledVector(Y_world, -new THREE.Vector3(0, 0, 1).dot(Y_world)).normalize();
  }

  // Right-handed orthonormal basis: X = Y x Z, then Z = X x Y
  const X_world = new THREE.Vector3().crossVectors(Y_world, Z_world).normalize();
  Z_world.crossVectors(X_world, Y_world).normalize();

  const rotMatrix = new THREE.Matrix4().makeBasis(X_world, Y_world, Z_world);
  torch.quaternion.setFromRotationMatrix(rotMatrix);
}
