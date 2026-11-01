import * as THREE from 'three';

/**
 * Binzel-style robotic gooseneck MIG torch, built from primitives (about 1:3 scale).
 * Origin is the arc point at the wire tip; the torch body extends along local +Y.
 * The wire mesh is named 'torch_wire' so the simulator can scale it to the wire diameter.
 */
export function buildRoboticTorch(): THREE.Group {
  const group = new THREE.Group();

  // Authentic Industrial Binzel-style Robotic Welding Torch (from reference photo)
  // 1. Protruding Copper Contact Tip & Welding Wire (Origin at 0, 0, 0 where arc strikes)
  const wireGeom = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 12);
  const wireMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', metalness: 0.95, roughness: 0.1 });
  const wire = new THREE.Mesh(wireGeom, wireMat);
  wire.name = 'torch_wire';
  wire.position.y = 1.6;
  group.add(wire);

  const contactTipGeom = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 16);
  const contactTipMat = new THREE.MeshStandardMaterial({ color: '#B45309', metalness: 0.9, roughness: 0.2 });
  const contactTip = new THREE.Mesh(contactTipGeom, contactTipMat);
  contactTip.position.y = 4.0;
  group.add(contactTip);

  // 2. Tapered Chrome Gas Nozzle (Chrome finish, tapered towards joint)
  const nozzleGeom = new THREE.CylinderGeometry(3.2, 1.8, 14, 24);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: '#F1F5F9', metalness: 0.95, roughness: 0.12 });
  const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
  nozzle.position.y = 12.0;
  group.add(nozzle);

  // 3. Nozzle Retaining Ring / Gas Diffuser Collar (Knurled chrome slots)
  const collarGeom = new THREE.CylinderGeometry(3.6, 3.4, 3, 24);
  const collarMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', metalness: 0.9, roughness: 0.25 });
  const collar = new THREE.Mesh(collarGeom, collarMat);
  collar.position.y = 19.5;
  group.add(collar);

  // 4. Stainless Steel Neck Extension (Coaxial along tool bisector axis for 100% collision clearance)
  const neckGeom = new THREE.CylinderGeometry(2.4, 2.4, 18, 20);
  const neckMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.88, roughness: 0.22 });
  const neck = new THREE.Mesh(neckGeom, neckMat);
  neck.position.y = 30.0;
  group.add(neck);

  // 5. Machined Golden Brass Mounting Collar
  const brassGeom = new THREE.CylinderGeometry(3.6, 3.6, 5, 20);
  const brassMat = new THREE.MeshStandardMaterial({ color: '#D4AF37', metalness: 0.92, roughness: 0.22 });
  const brass = new THREE.Mesh(brassGeom, brassMat);
  brass.position.y = 41.5;
  group.add(brass);

  // 6. Heavy-Duty Ergonomic Torch Body (Matte black housing, centered on tool axis)
  const bodyGeom = new THREE.CylinderGeometry(4.2, 4.2, 22, 24);
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#1B201C', metalness: 0.35, roughness: 0.55 });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 54.0;
  group.add(body);

  // 7. Raised Switch/Sensor Module on Torch Body
  const sensorBoxGeom = new THREE.BoxGeometry(3.5, 9.0, 3.0);
  const sensorBoxMat = new THREE.MeshStandardMaterial({ color: '#141814', metalness: 0.4, roughness: 0.5 });
  const sensorBox = new THREE.Mesh(sensorBoxGeom, sensorBoxMat);
  sensorBox.position.set(0, 56, 3.5);
  group.add(sensorBox);

  // 8. Tactile Red Actuation Button on Sensor Module (From user photo)
  const buttonGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.2, 16);
  const buttonMat = new THREE.MeshStandardMaterial({
    color: '#EF4444',
    emissive: '#B91C1C',
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4,
  });
  const button = new THREE.Mesh(buttonGeom, buttonMat);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 58, 5.2);
  group.add(button);

  // 9. Rear Corrugated Cable Strain-Relief Hose (Flexible black corrugated tubing)
  const hoseGeom = new THREE.CylinderGeometry(3.6, 3.6, 22, 20);
  const hoseMat = new THREE.MeshStandardMaterial({ color: '#111411', metalness: 0.2, roughness: 0.75 });
  const hose = new THREE.Mesh(hoseGeom, hoseMat);
  hose.position.y = 74.0;
  group.add(hose);

  // Corrugated ribbed rings along the hose
  for (let r = 0; r < 6; r++) {
    const ringGeom = new THREE.TorusGeometry(3.7, 0.3, 8, 20);
    const ringMat = new THREE.MeshStandardMaterial({ color: '#1C221C', roughness: 0.6 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 65 + r * 3.4, 0);
    group.add(ring);
  }

  return group;
}
