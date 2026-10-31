'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D, TorchNozzleType, WeldSeam, WeldJointType } from '@/types/weld';
import { Play, X, Sliders, Target, Crosshair, AlertTriangle } from 'lucide-react';
import { validatePathSubstrate } from '@/utils/substrateValidator';

// Authentic Robotic Welding Torch & Sleek Pencil Industrial End-Effectors
function buildRoboticTorch(style: 'robotic_gooseneck' | 'sleek_pencil' = 'robotic_gooseneck'): THREE.Group {
  const group = new THREE.Group();

  if (style === 'sleek_pencil') {
    // Sleek Tapered Industrial Tool (Pencil profile)
    const flangeGeom = new THREE.CylinderGeometry(4.8, 4.8, 4, 24);
    const flangeMat = new THREE.MeshStandardMaterial({ color: '#1B211B', metalness: 0.85, roughness: 0.3 });
    const flange = new THREE.Mesh(flangeGeom, flangeMat);
    flange.position.y = 36;
    group.add(flange);

    const bodyGeom = new THREE.CylinderGeometry(3.6, 3.6, 22, 24);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#222822', metalness: 0.8, roughness: 0.25 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 23;
    group.add(body);

    const ringGeom = new THREE.CylinderGeometry(4.0, 4.0, 5, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: '#e97f01', metalness: 0.6, roughness: 0.25 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 12.5;
    group.add(ring);

    const nozzleGeom = new THREE.ConeGeometry(3.2, 10, 24);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: '#C87D40', metalness: 0.92, roughness: 0.15 });
    const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.y = 5.0;
    group.add(nozzle);

    const wireGeom = new THREE.CylinderGeometry(0.35, 0.35, 4, 12);
    const wireMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.95, roughness: 0.1 });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    wire.name = 'torch_wire';
    wire.position.y = 1.0;
    group.add(wire);

    return group;
  }

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

// Helper to position and orient a cylinder precisely between two 3D points
function positionCylinderBetweenPoints(mesh: THREE.Mesh, p1: THREE.Vector3, p2: THREE.Vector3, radius: number) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 0.05) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.scale.set(radius, len, radius);
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
}

// Computes true 3D torch orientation vector taking into account surface normal, seam direction, work tilt angle, travel lead angle, and joint type
function getEffectiveTorchVector(
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
function orientTorch(torch: THREE.Object3D, targetVector: THREE.Vector3) {
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

// CAD Magnetic Object Snapping (OSNAP) helper
function getSnappedPoint(
  hit: THREE.Intersection,
  manualStartPoint: Vector3D | null,
  seams: WeldSeam[],
  mesh: THREE.Mesh
): { point: THREE.Vector3; normal: THREE.Vector3; snapType: string | null } {
  let p = hit.point.clone();
  let n = hit.face ? hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize() : new THREE.Vector3(0, 1, 0);
  let snapType: string | null = null;

  // 1. Existing Seam Endpoint Magnetic Snap (8mm threshold)
  for (const seam of seams) {
    const s1 = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
    const s2 = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
    if (p.distanceTo(s1) < 8.0) {
      return { point: s1, normal: new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z), snapType: 'SEAM ENDPOINT' };
    }
    if (p.distanceTo(s2) < 8.0) {
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

      if (minD < 6.0) {
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

    if (dy < 4.5 && dz < 4.5 && dx > 6.0) {
      p.y = manualStartPoint.y;
      p.z = manualStartPoint.z;
      snapType = 'AXIS LOCK (X)';
    } else if (dx < 4.5 && dz < 4.5 && dy > 6.0) {
      p.x = manualStartPoint.x;
      p.z = manualStartPoint.z;
      snapType = 'AXIS LOCK (Y)';
    } else if (dx < 4.5 && dy < 4.5 && dz > 6.0) {
      p.x = manualStartPoint.x;
      p.y = manualStartPoint.y;
      snapType = 'AXIS LOCK (Z)';
    }
  }

  return { point: p, normal: n, snapType };
}

interface ViewportCanvasProps {
  isRightCollapsed?: boolean;
  isLeftCollapsed?: boolean;
  onExpandRight?: () => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  isRightCollapsed = false,
  isLeftCollapsed = false,
  onExpandRight,
}) => {
  // Separate mount ref for Three.js WebGL canvas to avoid React reconciliation conflicts
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Selective Zustand selectors to prevent canvas unmounts / loop thrashing
  const mode = useWeldStore((s) => s.mode);
  const showWireframe = useWeldStore((s) => s.showWireframe);
  const showNormals = useWeldStore((s) => s.showNormals);
  const showBoundingBox = useWeldStore((s) => s.showBoundingBox);
  const showWaypoints = useWeldStore((s) => s.showWaypoints);
  const showPlaten = useWeldStore((s) => s.showPlaten);
  const showXRay = useWeldStore((s) => s.showXRay);
  const viewPreset = useWeldStore((s) => s.viewPreset);
  const setViewPreset = useWeldStore((s) => s.setViewPreset);
  const activeModelName = useWeldStore((s) => s.activeModelName);
  const customModels = useWeldStore((s) => s.customModels);
  const manualStartPoint = useWeldStore((s) => s.manualStartPoint);
  const setManualStartPoint = useWeldStore((s) => s.setManualStartPoint);
  const setManualCandidatePoint = useWeldStore((s) => s.setManualCandidatePoint);
  const addSeam = useWeldStore((s) => s.addSeam);
  const seams = useWeldStore((s) => s.seams);
  const selectedSeamId = useWeldStore((s) => s.selectedSeamId);
  const completedSeamIds = useWeldStore((s) => s.completedSeamIds);
  const torchStyle = useWeldStore((s) => s.torchStyle);
  const selectSeam = useWeldStore((s) => s.selectSeam);
  const isSimulating = useWeldStore((s) => s.isSimulating);
  const startSimulation = useWeldStore((s) => s.startSimulation);
  const playbackSpeed = useWeldStore((s) => s.playbackSpeed);
  const rapidTraverseSpeed = useWeldStore((s) => s.rapidTraverseSpeed);
  const exportJobJSON = useWeldStore((s) => s.exportJobJSON);
  const setPart = useWeldStore((s) => s.setPart);
  const setPartLoading = useWeldStore((s) => s.setPartLoading);

  const selectedSeam = seams.find((s) => s.id === selectedSeamId) || null;
  const jobSummary = exportJobJSON().job_summary;

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const platenGroupRef = useRef<THREE.Group | null>(null);
  const modelGroupRef = useRef<THREE.Group>(new THREE.Group());
  const meshRef = useRef<THREE.Mesh | null>(null);
  const edgesRef = useRef<THREE.LineSegments | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const boundingBoxRef = useRef<THREE.BoxHelper | null>(null);
  const seamsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const dynamicBeadGroupRef = useRef<THREE.Group>(new THREE.Group());
  const previewSeamRef = useRef<THREE.Group>(new THREE.Group());
  const reticleRef = useRef<THREE.Group>(new THREE.Group());
  const torchRef = useRef<THREE.Group | null>(null);
  const torchMeshGroupRef = useRef<THREE.Group>(new THREE.Group());
  const arcLightRef = useRef<THREE.PointLight | null>(null);
  const arcSparksRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Game-style Cinematic Camera Focus & Orbit Lerp refs
  const targetCameraPos = useRef<THREE.Vector3 | null>(null);
  const targetControlsTarget = useRef<THREE.Vector3 | null>(null);
  const isCameraTransitioning = useRef<boolean>(false);
  const lastSelectedSeamIdRef = useRef<string | null>(null);

  // Cursor coordinates display & smooth fade-in/fade-out
  const [cursorPos, setCursorPos] = useState<Vector3D | null>(null);
  const [cursorNormal, setCursorNormal] = useState<Vector3D | null>(null);
  const [activeSnapType, setActiveSnapType] = useState<string | null>(null);
  const [measuredDist, setMeasuredDist] = useState<number | null>(null);
  const [liveAirGap, setLiveAirGap] = useState<{ isAirGap: boolean; gapDistanceMm: number } | null>(null);
  const [displayCoords, setDisplayCoords] = useState<Vector3D | null>(null);
  const [displayDist, setDisplayDist] = useState<number | null>(null);
  const [isCoordsVisible, setIsCoordsVisible] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Three.js scene once
  useEffect(() => {
    if (!canvasMountRef.current) return;
    const container = canvasMountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0D120D');
    sceneRef.current = scene;

    // 1b. Industrial Machined Steel Welding Fixture Platen (Machine Table Bed)
    const platenGroup = new THREE.Group();
    
    // Main Solid Steel Bed Slab (360 x 8 x 360mm)
    const platenGeom = new THREE.BoxGeometry(360, 8, 360);
    const platenMat = new THREE.MeshStandardMaterial({
      color: '#131A13',
      metalness: 0.58,
      roughness: 0.52,
    });
    const platenMesh = new THREE.Mesh(platenGeom, platenMat);
    platenMesh.position.set(0, -4.01, 0); // Top face flush at y = -0.01mm
    platenGroup.add(platenMesh);

    // Machined Chamfered Lower Base Frame
    const borderGeom = new THREE.BoxGeometry(370, 2.5, 370);
    const borderMat = new THREE.MeshStandardMaterial({
      color: '#0A0E0A',
      metalness: 0.75,
      roughness: 0.4,
    });
    const borderMesh = new THREE.Mesh(borderGeom, borderMat);
    borderMesh.position.set(0, -7.5, 0);
    platenGroup.add(borderMesh);

    // 4 Corner Leveling Mounts / Fixture Clamping Lugs with Hex Bolts
    const cornerOffsets = [
      [-165, -165],
      [165, -165],
      [-165, 165],
      [165, 165],
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const lugGeom = new THREE.CylinderGeometry(7, 8, 9, 16);
      const lugMat = new THREE.MeshStandardMaterial({ color: '#253523', metalness: 0.7, roughness: 0.35 });
      const lug = new THREE.Mesh(lugGeom, lugMat);
      lug.position.set(cx, -4.5, cz);
      platenGroup.add(lug);
      
      const boltGeom = new THREE.CylinderGeometry(3.5, 3.5, 1.2, 6);
      const boltMat = new THREE.MeshStandardMaterial({ color: '#8EA08D', metalness: 0.85, roughness: 0.25 });
      const bolt = new THREE.Mesh(boltGeom, boltMat);
      bolt.position.set(cx, 0.1, cz);
      platenGroup.add(bolt);
    });

    scene.add(platenGroup);
    platenGroupRef.current = platenGroup;
    platenGroup.visible = useWeldStore.getState().showPlaten;

    // CAD Grid Floor resting crisply on top of the steel platen
    const grid = new THREE.GridHelper(360, 36, '#385235', '#1F2E1E');
    grid.position.y = 0.05;
    scene.add(grid);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(170, 150, 190);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    
    // Safely mount canvas element
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 1400;
    controls.minDistance = 20;
    controls.target.set(0, 35, 0);
    // Ground-clamped orbit: prevents camera from dipping below the solid steel welding platen
    controls.maxPolarAngle = useWeldStore.getState().showPlaten ? Math.PI / 2 - 0.04 : Math.PI;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    // Instant manual break-out: if user drags or orbits manually, cancel automated camera lerp immediately
    controls.addEventListener('start', () => {
      isCameraTransitioning.current = false;
    });
    controlsRef.current = controls;

    // 5. Balanced CAD Studio Lighting (Natural metallic depth, no harsh white wash)
    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#243024', 1.4);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight('#FFFFFF', 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#FFFFFF', 1.7);
    keyLight.position.set(180, 260, 200);
    scene.add(keyLight);

    const fillLight1 = new THREE.DirectionalLight('#E2E8F0', 1.3);
    fillLight1.position.set(-180, 200, 160);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight('#CBD5E1', 1.1);
    fillLight2.position.set(160, 180, -180);
    scene.add(fillLight2);

    const rimLight = new THREE.DirectionalLight('#e97f01', 0.9);
    rimLight.position.set(-160, 160, -180);
    scene.add(rimLight);

    const bottomBounce = new THREE.DirectionalLight('#506050', 0.6);
    bottomBounce.position.set(0, -160, 0);
    scene.add(bottomBounce);

    // Hierarchical Scene Groups
    scene.add(modelGroupRef.current);
    scene.add(dynamicBeadGroupRef.current);
    scene.add(seamsGroupRef.current);
    scene.add(previewSeamRef.current);

    // 6. Interactive Snap Reticle
    const reticleGroup = new THREE.Group();
    const ringGeom = new THREE.RingGeometry(2.0, 3.2, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#e97f01', side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    reticleGroup.add(ringMesh);

    const reticleNormalArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 12, 0x38bdf8, 3, 2);
    reticleGroup.add(reticleNormalArrow);
    reticleGroup.visible = false;
    scene.add(reticleGroup);
    reticleRef.current = reticleGroup;

    // 7. Industrial Robotic Welding Torch & Arc Lighting (Single unified assembly)
    const torchContainer = new THREE.Group();
    const torchMeshGroup = torchMeshGroupRef.current;
    torchMeshGroup.clear();
    torchMeshGroup.add(buildRoboticTorch(useWeldStore.getState().torchStyle));
    torchContainer.add(torchMeshGroup);

    const arcLight = new THREE.PointLight('#38BDF8', 0, 90);
    arcLight.position.set(0, 0, 0);
    torchContainer.add(arcLight);
    arcLightRef.current = arcLight;

    // Arc Sparks Particles
    const sparkCount = 35;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) {
      sparkPositions[i] = (Math.random() - 0.5) * 6;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({ color: '#FFE066', size: 2.2, transparent: true, opacity: 0 });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    torchContainer.add(sparkPoints);
    arcSparksRef.current = sparkPoints;

    torchContainer.visible = false;
    scene.add(torchContainer);
    torchRef.current = torchContainer;

    // 60 FPS Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth Game-Style Cinematic Camera Focus Lerp
      if (isCameraTransitioning.current && targetCameraPos.current && targetControlsTarget.current) {
        controls.target.lerp(targetControlsTarget.current, 0.08);
        camera.position.lerp(targetCameraPos.current, 0.08);

        if (
          controls.target.distanceTo(targetControlsTarget.current) < 0.25 &&
          camera.position.distanceTo(targetCameraPos.current) < 0.5
        ) {
          controls.target.copy(targetControlsTarget.current);
          camera.position.copy(targetCameraPos.current);
          isCameraTransitioning.current = false;
        }
      }

      // Smooth Dynamic Canvas Gliding while drawing seams ('add_seam' mode with anchored start point)
      const state = useWeldStore.getState();
      if (state.mode === 'add_seam' && state.manualStartPoint && !isCameraTransitioning.current) {
        const mx = mouseRef.current.x; // [-1, 1]
        const my = mouseRef.current.y; // [-1, 1], +1 top, -1 bottom
        const glideSpeed = 1.6;

        // Downward panning when cursor approaches bottom margin (my < -0.62)
        if (my < -0.62) {
          const factor = Math.min(1.0, (-0.62 - my) / 0.32);
          controls.target.y -= glideSpeed * factor;
          camera.position.y -= glideSpeed * factor;
        } else if (my > 0.62) {
          // Upward panning when cursor approaches top margin (my > 0.62)
          const factor = Math.min(1.0, (my - 0.62) / 0.32);
          controls.target.y += glideSpeed * factor;
          camera.position.y += glideSpeed * factor;
        }

        // Horizontal panning relative to camera orientation
        if (mx < -0.72) {
          const factor = Math.min(1.0, (-0.72 - mx) / 0.22);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          right.y = 0;
          if (right.lengthSq() > 0.001) right.normalize();
          controls.target.addScaledVector(right, -glideSpeed * factor);
          camera.position.addScaledVector(right, -glideSpeed * factor);
        } else if (mx > 0.72) {
          const factor = Math.min(1.0, (mx - 0.72) / 0.22);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          right.y = 0;
          if (right.lengthSq() > 0.001) right.normalize();
          controls.target.addScaledVector(right, glideSpeed * factor);
          camera.position.addScaledVector(right, glideSpeed * factor);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver tracks container width changes in real time as sidebars collapse/expand
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Smoothly resize WebGL Canvas during and after sidebar collapse transitions
  useEffect(() => {
    const updateSize = () => {
      if (!canvasMountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasMountRef.current.clientWidth;
      const h = canvasMountRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    updateSize();
    const t1 = setTimeout(updateSize, 60);
    const t2 = setTimeout(updateSize, 160);
    const t3 = setTimeout(updateSize, 320);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isRightCollapsed, isLeftCollapsed]);

  // Handle Preset Views
  useEffect(() => {
    if (!viewPreset || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (viewPreset) {
      case 'iso':
        camera.position.set(170, 150, 190);
        controls.target.set(0, 35, 0);
        break;
      case 'top':
        camera.position.set(0, 290, 0);
        controls.target.set(0, 0, 0);
        break;
      case 'front':
        camera.position.set(0, 35, 270);
        controls.target.set(0, 35, 0);
        break;
      case 'right':
        camera.position.set(270, 35, 0);
        controls.target.set(0, 35, 0);
        break;
    }
    controls.update();
    setViewPreset(null);
  }, [viewPreset, setViewPreset]);

  // Game-Style Cinematic Camera Focus / Zoom on Seam
  const focusOnSeam = (seam: WeldSeam) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const p1 = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
    const p2 = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const norm = new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z).normalize();
    if (norm.lengthSq() < 0.001) norm.set(0, 1, 0);

    // Current camera direction relative to current controls target
    const curCamDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    // Blend current camera vantage direction with outward seam normal for an optimal 3/4 perspective
    const viewDir = new THREE.Vector3().lerpVectors(curCamDir, norm, 0.45).normalize();
    if (viewDir.y < 0.28) viewDir.y = 0.38; // maintain elevated vantage angle
    viewDir.normalize();

    // Cinematic framing distance proportional to seam length (between 85mm and 150mm)
    const focusDist = Math.max(90, Math.min(150, seam.length * 1.6));
    const targetCamPos = mid.clone().addScaledVector(viewDir, focusDist);

    targetControlsTarget.current = mid;
    targetCameraPos.current = targetCamPos;
    isCameraTransitioning.current = true;
  };

  // Automatically trigger cinematic camera focus when a seam is newly mapped or selected
  useEffect(() => {
    if (!selectedSeamId) {
      lastSelectedSeamIdRef.current = null;
      return;
    }
    if (selectedSeamId !== lastSelectedSeamIdRef.current) {
      lastSelectedSeamIdRef.current = selectedSeamId;
      if (!isSimulating) {
        const seam = seams.find((s) => s.id === selectedSeamId);
        if (seam) {
          focusOnSeam(seam);
        }
      }
    }
  }, [selectedSeamId, seams, isSimulating]);

  // Load STL Model
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setPartLoading(true);

    // Atomically purge previous 3D geometry and beads so parts never stack
    const modelGroup = modelGroupRef.current;
    while (modelGroup.children.length > 0) {
      const child = modelGroup.children[0];
      modelGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
    dynamicBeadGroupRef.current.clear();

    const applyGeometry = (geometry: THREE.BufferGeometry) => {
      // Double check modelGroup is cleared for this arrival
      while (modelGroup.children.length > 0) {
        const child = modelGroup.children[0];
        modelGroup.remove(child);
        if ((child as any).geometry) (child as any).geometry.dispose();
      }

      geometry.computeVertexNormals();
      geometry.center();
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox!;
      const minY = bbox.min.y;
      geometry.translate(0, -minY, 0);

      geometry.computeBoundingBox();
      const finalBox = geometry.boundingBox!;
      const width = parseFloat((finalBox.max.x - finalBox.min.x).toFixed(1));
      const height = parseFloat((finalBox.max.y - finalBox.min.y).toFixed(1));
      const depth = parseFloat((finalBox.max.z - finalBox.min.z).toFixed(1));

      // Dynamic Camera Auto-Framing: Fit ANY uploaded STL or standard benchmark perfectly
      geometry.computeBoundingSphere();
      const sphere = geometry.boundingSphere!;
      if (cameraRef.current && controlsRef.current) {
        const radius = Math.max(25, sphere.radius);
        controlsRef.current.target.set(0, height * 0.45, 0);
        cameraRef.current.position.set(radius * 1.5, height + radius * 0.8, radius * 1.5);
        cameraRef.current.near = Math.max(0.1, radius * 0.01);
        cameraRef.current.far = Math.max(2000, radius * 20);
        cameraRef.current.updateProjectionMatrix();
        controlsRef.current.update();
      }

      // Refined industrial machine alloy material
      const isXRayActive = useWeldStore.getState().showXRay;
      const material = new THREE.MeshStandardMaterial({
        color: '#5C6D60',
        metalness: 0.28,
        roughness: 0.48,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        transparent: isXRayActive,
        opacity: isXRayActive ? 0.35 : 1.0,
        depthWrite: !isXRayActive,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      modelGroup.add(mesh);
      meshRef.current = mesh;

      // Clean CAD feature edges (threshold 35° avoids dense black triangle grids on curved cylinders)
      const edgeGeometry = new THREE.EdgesGeometry(geometry, 35);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: '#243523', linewidth: 1.2 });
      const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      modelGroup.add(edgeLines);
      edgesRef.current = edgeLines;

      const wireframeGeom = new THREE.WireframeGeometry(geometry);
      const wireframeMat = new THREE.LineBasicMaterial({ color: '#3A5239', opacity: 0.35, transparent: true });
      const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
      wireframe.visible = showWireframe;
      modelGroup.add(wireframe);
      wireframeRef.current = wireframe;

      const boxHelper = new THREE.BoxHelper(mesh, new THREE.Color('#e97f01'));
      boxHelper.visible = showBoundingBox;
      modelGroup.add(boxHelper);
      boundingBoxRef.current = boxHelper;

      setPart({
        name: activeModelName,
        triangleCount: geometry.attributes.position.count / 3,
        vertexCount: geometry.attributes.position.count,
        dimensions: { width, height, depth },
        boundingBox: {
          min: { x: finalBox.min.x, y: finalBox.min.y, z: finalBox.min.z },
          max: { x: finalBox.max.x, y: finalBox.max.y, z: finalBox.max.z },
        },
      });
    };

    // Check if loading a user-uploaded custom STL or standard benchmark
    const custom = customModels.find((m) => m.name === activeModelName);
    if (custom) {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(custom.buffer);
        applyGeometry(geometry);
      } catch (err) {
        console.error('Failed to parse custom STL:', err);
      }
    } else {
      let modelUrl = `/models/bracket.stl`;
      if (activeModelName === 'Pipe T-Joint') modelUrl = `/models/pipe_joint.stl`;
      if (activeModelName === 'Confined Box Flange' || activeModelName === 'Box Flange') modelUrl = `/models/box_flange.stl`;

      const loader = new STLLoader();
      loader.load(
        modelUrl,
        (geometry) => {
          applyGeometry(geometry);
          setPartLoading(false);
        },
        undefined,
        (err) => {
          console.error('Failed to load standard model:', err);
          setPartLoading(false);
        }
      );
    }
  }, [activeModelName, customModels, setPart, setPartLoading]);

  // Wireframe & Bounding Box toggles
  useEffect(() => {
    if (wireframeRef.current) wireframeRef.current.visible = showWireframe;
  }, [showWireframe]);

  useEffect(() => {
    if (boundingBoxRef.current) boundingBoxRef.current.visible = showBoundingBox;
  }, [showBoundingBox]);

  // Translucent Ghost X-Ray mode to inspect occluded interior / cavity seams
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (showXRay) {
      mat.transparent = true;
      mat.opacity = 0.35;
      mat.depthWrite = false;
      mat.needsUpdate = true;
      if (edgesRef.current) {
        (edgesRef.current.material as THREE.LineBasicMaterial).color.set('#38BDF8');
        edgesRef.current.visible = true;
      }
    } else {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.depthWrite = true;
      mat.needsUpdate = true;
      if (edgesRef.current) {
        (edgesRef.current.material as THREE.LineBasicMaterial).color.set('#243523');
      }
    }
  }, [showXRay]);

  // Welding Table Platen visibility & Ground-Clamped Orbit
  useEffect(() => {
    if (platenGroupRef.current) {
      platenGroupRef.current.visible = showPlaten;
    }
    if (controlsRef.current) {
      // Clamps orbit to ~87.5° when table is visible, or allows full 360° free part inspection when hidden
      controlsRef.current.maxPolarAngle = showPlaten ? Math.PI / 2 - 0.04 : Math.PI;
    }
  }, [showPlaten]);

  // Dynamically switch torch style (Robotic Gooseneck vs Sleek Pencil)
  useEffect(() => {
    if (!torchMeshGroupRef.current) return;
    torchMeshGroupRef.current.clear();
    torchMeshGroupRef.current.add(buildRoboticTorch(torchStyle));
  }, [torchStyle]);

  // Render Planned Weld Seams
  useEffect(() => {
    const group = seamsGroupRef.current;
    group.clear();

    seams.forEach((seam) => {
      const isSelected = seam.id === selectedSeamId;
      const isCompleted = completedSeamIds.includes(seam.id);
      const p1 = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
      const p2 = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
      const normal = new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z).normalize();
      const length = p1.distanceTo(p2);

      if (length < 0.1) return;

      const seamContainer = new THREE.Group();

      // DYNAMIC METALLIC vs SELECTED STATUS:
      // 1. If hasAirGap: hazard amber
      // 2. If isCompleted (has been welded): always render shiny metallic bead (#D4E2D4, metalness 0.92, roughness 0.18)
      // 3. If isSelected and NOT currently running simulation: render vibrant Armatrix Orange (#e97f01) for parameter editing
      // 4. Default: clean CAD planning green (#22C55E)
      const isSelectedAndIdle = isSelected && !isSimulating;
      const wireScale = (seam.parameters.wireDiameter ?? 1.2) / 1.2;
      const beadRadius = (isSelectedAndIdle ? 2.2 : isCompleted ? 2.1 : 1.7) * wireScale;
      const cylinderGeom = new THREE.CylinderGeometry(beadRadius, beadRadius, length, 16);
      cylinderGeom.translate(0, length / 2, 0);
      cylinderGeom.rotateX(Math.PI / 2);

      let cylinderMat: THREE.Material;
      if (seam.hasAirGap) {
        // High-visibility hazard amber for non-manufacturable air-gap seams
        cylinderMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#D97706'),
          emissive: new THREE.Color('#B45309'),
          emissiveIntensity: 0.8,
          roughness: 0.35,
          metalness: 0.4,
        });
      } else if (isCompleted) {
        // Welded / Simulated: shiny metallic bead!
        cylinderMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#D4E2D4'),
          metalness: 0.92,
          roughness: 0.18,
        });
      } else if (isSelectedAndIdle) {
        // Selected for parameter editing when not simulating
        cylinderMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#e97f01'),
          emissive: new THREE.Color('#e97f01'),
          emissiveIntensity: 0.85,
          roughness: 0.25,
          metalness: 0.5,
        });
      } else {
        // CAD planning green
        cylinderMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#22C55E'),
          emissive: new THREE.Color('#15803D'),
          emissiveIntensity: 0.4,
          roughness: 0.2,
          metalness: 0.85,
        });
      }

      const beadMesh = new THREE.Mesh(cylinderGeom, cylinderMat);
      beadMesh.position.copy(p1);
      beadMesh.lookAt(p2);
      beadMesh.userData = { seamId: seam.id };
      seamContainer.add(beadMesh);

      // Sleek precision CAD pin handles (scaled down from 3.0mm to 1.3mm)
      const startSphere = new THREE.Mesh(
        new THREE.SphereGeometry(isSelectedAndIdle ? 1.5 : 1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0284C7', emissiveIntensity: 0.6 })
      );
      startSphere.position.copy(p1);
      seamContainer.add(startSphere);

      const endSphere = new THREE.Mesh(
        new THREE.SphereGeometry(isSelectedAndIdle ? 1.5 : 1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#B91C1C', emissiveIntensity: 0.6 })
      );
      endSphere.position.copy(p2);
      seamContainer.add(endSphere);

      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      // Travel direction arrow: offset outward parallel to the seam so it floats cleanly alongside/above the bead
      // Automatically fades out/hides completely during active simulation to prevent visual clutter with live torch/sparks
      if (!isSimulating) {
        const arrowOffset = new THREE.Vector3().copy(normal).multiplyScalar(beadRadius + 2.5);
        const arrowPos = new THREE.Vector3().copy(mid).add(arrowOffset);
        const arrowLen = Math.min(12, Math.max(5, length * 0.35));
        const arrowHelper = new THREE.ArrowHelper(
          dir,
          arrowPos,
          arrowLen,
          isSelectedAndIdle ? 0xffffff : 0xe97f01,
          2.4,
          1.6
        );
        seamContainer.add(arrowHelper);
      }

      if (showNormals) {
        const effectiveVector = getEffectiveTorchVector(
          p1,
          p2,
          normal,
          seam.parameters.torchTiltAngle,
          seam.parameters.torchLeadAngle,
          seam.parameters.jointType
        );
        const normalHelper = new THREE.ArrowHelper(effectiveVector, mid, 20, 0x38bdf8, 4, 2.5);
        seamContainer.add(normalHelper);

        const appPt = new THREE.Vector3().copy(p1).addScaledVector(effectiveVector, seam.parameters.approachDistance);
        const retPt = new THREE.Vector3().copy(p2).addScaledVector(effectiveVector, seam.parameters.retractDistance);

        const approachGeom = new THREE.BufferGeometry().setFromPoints([appPt, p1]);
        const retractGeom = new THREE.BufferGeometry().setFromPoints([p2, retPt]);
        const dashedMat = new THREE.LineDashedMaterial({ color: '#93C5FD', dashSize: 2.5, gapSize: 2 });
        const appLine = new THREE.Line(approachGeom, dashedMat);
        const retLine = new THREE.Line(retractGeom, dashedMat);
        appLine.computeLineDistances();
        retLine.computeLineDistances();
        seamContainer.add(appLine);
        seamContainer.add(retLine);

        if (showWaypoints) {
          const appSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), new THREE.MeshBasicMaterial({ color: '#60A5FA' }));
          appSphere.position.copy(appPt);
          const retSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), new THREE.MeshBasicMaterial({ color: '#F87171' }));
          retSphere.position.copy(retPt);
          seamContainer.add(appSphere);
          seamContainer.add(retSphere);
        }
      }

      group.add(seamContainer);
    });
  }, [seams, selectedSeamId, completedSeamIds, showNormals, showWaypoints, isSimulating]);

  // Live Preview Seam during interactive 'add_seam' click
  useEffect(() => {
    const group = previewSeamRef.current;
    group.clear();

    if (mode === 'add_seam' && manualStartPoint) {
      const p1 = new THREE.Vector3(manualStartPoint.x, manualStartPoint.y, manualStartPoint.z);

      const startMarker = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#e97f01', emissive: '#e97f01', emissiveIntensity: 0.9 })
      );
      startMarker.position.copy(p1);
      group.add(startMarker);

      if (cursorPos) {
        const p2 = new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z);
        const isAir = liveAirGap?.isAirGap;
        const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineBasicMaterial({
          color: isAir ? '#F59E0B' : '#e97f01',
          linewidth: 2,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        const endPreview = new THREE.Mesh(
          new THREE.SphereGeometry(1.0, 12, 12),
          new THREE.MeshBasicMaterial({ color: isAir ? '#F59E0B' : '#38BDF8' })
        );
        endPreview.position.copy(p2);
        group.add(endPreview);
      }
    }
  }, [mode, manualStartPoint, cursorPos, liveAirGap]);

  // Interactive Snapping Reticle visibility & Dynamic 3D Surface Normal Orientation
  useEffect(() => {
    if (!reticleRef.current) return;
    if (mode === 'add_seam' && cursorPos) {
      reticleRef.current.visible = true;
      reticleRef.current.position.set(cursorPos.x, cursorPos.y, cursorPos.z);

      if (cursorNormal) {
        const normVec = new THREE.Vector3(cursorNormal.x, cursorNormal.y, cursorNormal.z);
        if (normVec.lengthSq() > 0.001) {
          normVec.normalize();
          if (Math.abs(normVec.y + 1) < 0.0001) {
            reticleRef.current.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
          } else {
            reticleRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normVec);
          }
        }
      }
    } else {
      reticleRef.current.visible = false;
    }
  }, [mode, cursorPos, cursorNormal]);

  // Robust Simulation Animation Runner (Non-blocking, zero re-render feedback)
  useEffect(() => {
    if (!isSimulating || seams.length === 0 || !torchRef.current) {
      if (torchRef.current) torchRef.current.visible = false;
      if (arcLightRef.current) arcLightRef.current.intensity = 0;
      return;
    }

    const torch = torchRef.current;
    const arcLight = arcLightRef.current;
    const dynamicGroup = dynamicBeadGroupRef.current;
    dynamicGroup.clear();
    torch.visible = true;

    // Active Deposited Bead Segment (Unit cylinder scaled precisely between pStart and currentPos)
    const activeBeadGeom = new THREE.CylinderGeometry(1, 1, 1, 16);
    const activeBeadMat = new THREE.MeshStandardMaterial({
      color: '#D4E2D4',
      metalness: 0.92,
      roughness: 0.18,
    });
    const activeBeadMesh = new THREE.Mesh(activeBeadGeom, activeBeadMat);
    activeBeadMesh.visible = false;
    dynamicGroup.add(activeBeadMesh);

    // Glowing Molten Weld Puddle right at torch tip
    const moltenPuddleGeom = new THREE.SphereGeometry(3.0, 14, 14);
    const moltenPuddleMat = new THREE.MeshStandardMaterial({
      color: '#FF4500',
      emissive: '#FF8800',
      emissiveIntensity: 3.5,
    });
    const moltenPuddleMesh = new THREE.Mesh(moltenPuddleGeom, moltenPuddleMat);
    moltenPuddleMesh.visible = false;
    dynamicGroup.add(moltenPuddleMesh);

    let animId: number;
    const storeState = useWeldStore.getState();
    let currentSeamIdx = Math.min(Math.max(0, storeState.simCurrentSeamIndex), seams.length - 1);
    const targetSeamId = storeState.simTargetSeamId;
    let phase: 'approach' | 'welding' | 'retract' | 'traverse' = 'approach';
    let progress = 0;
    let lastTime = performance.now();
    let currentReportedPhase = '';

    const updatePhase = (newPhase: 'approach' | 'welding' | 'retract' | 'rapid_traverse') => {
      if (currentReportedPhase !== newPhase) {
        currentReportedPhase = newPhase;
        useWeldStore.getState().setSimPhase(newPhase);
      }
    };

    updatePhase('approach');
    useWeldStore.getState().setSimCurrentSeamIndex(currentSeamIdx);

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const seam = seams[currentSeamIdx];
      if (!seam) {
        useWeldStore.getState().pauseSimulation();
        return;
      }

      // Synchronize torch wire diameter scale to active seam parameters
      const wireScale = (seam.parameters.wireDiameter ?? 1.2) / 1.2;
      const wireMesh = torch.getObjectByName('torch_wire');
      if (wireMesh) {
        wireMesh.scale.set(wireScale, 1, wireScale);
      }

      const pStart = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
      const pEnd = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
      const normal = new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z);
      if (normal.lengthSq() < 0.001) normal.set(0, 1, 0);
      normal.normalize();

      // Dynamic Effective Torch Orientation (respects work tilt angle, travel lead angle, and joint type)
      const effectiveTorchAxis = getEffectiveTorchVector(
        pStart,
        pEnd,
        normal,
        seam.parameters.torchTiltAngle,
        seam.parameters.torchLeadAngle,
        seam.parameters.jointType
      );

      const pApproach = new THREE.Vector3().copy(pStart).addScaledVector(effectiveTorchAxis, Math.max(10, seam.parameters.approachDistance));
      const pRetract = new THREE.Vector3().copy(pEnd).addScaledVector(effectiveTorchAxis, Math.max(10, seam.parameters.retractDistance));

      const spd = Math.max(0.2, playbackSpeed);
      const weldDuration = Math.max(0.6, seam.length / Math.max(1, seam.parameters.travelSpeed)) / spd;
      const approachDuration = 0.8 / spd;
      const retractDuration = 0.8 / spd;
      const traverseDuration = 1.0 / spd;

      // Safe 6-DOF orientation calculation (guarantees handle curves UP into workspace clearance)
      const safeQuaternion = (targetVector: THREE.Vector3) => {
        orientTorch(torch, targetVector);
      };

      if (phase === 'approach') {
        progress += dt / approachDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pApproach, pStart, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(effectiveTorchAxis);
        if (arcLight) arcLight.intensity = 0;
        if (arcSparksRef.current) (arcSparksRef.current.material as THREE.PointsMaterial).opacity = 0;
        activeBeadMesh.visible = false;
        moltenPuddleMesh.visible = false;
        updatePhase('approach');

        if (progress >= 1) {
          progress = 0;
          phase = 'welding';
        }
      } else if (phase === 'welding') {
        progress += dt / weldDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pStart, pEnd, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(effectiveTorchAxis);

        // Progressive Metallic Weld Bead Deposition behind torch tip (scaled dynamically to wire diameter)
        const activeBeadRadius = 2.35 * wireScale;
        positionCylinderBetweenPoints(activeBeadMesh, pStart, currentPos, activeBeadRadius);

        // Active glowing molten puddle at contact point (scaled dynamically to wire diameter)
        moltenPuddleMesh.scale.setScalar(wireScale);
        moltenPuddleMesh.visible = true;
        moltenPuddleMesh.position.copy(currentPos);

        if (arcLight) {
          arcLight.intensity = 35 + Math.random() * 30;
          arcLight.color.set(Math.random() > 0.3 ? '#38BDF8' : '#FFFFFF');
        }
        if (arcSparksRef.current) {
          (arcSparksRef.current.material as THREE.PointsMaterial).opacity = 0.75 + Math.random() * 0.25;
          arcSparksRef.current.rotation.y += 0.35;
        }
        updatePhase('welding');

        if (progress >= 1) {
          useWeldStore.getState().markSeamCompleted(seam.id);
          activeBeadMesh.visible = false;
          moltenPuddleMesh.visible = false;
          progress = 0;
          phase = 'retract';
        }
      } else if (phase === 'retract') {
        progress += dt / retractDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pEnd, pRetract, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(effectiveTorchAxis);
        if (arcLight) arcLight.intensity = 0;
        if (arcSparksRef.current) (arcSparksRef.current.material as THREE.PointsMaterial).opacity = 0;
        activeBeadMesh.visible = false;
        moltenPuddleMesh.visible = false;
        updatePhase('retract');

        if (progress >= 1) {
          progress = 0;
          if (targetSeamId) {
            // Targeted single-seam preview complete! Retract cleanly and stop.
            useWeldStore.getState().pauseSimulation();
            return;
          }
          if (currentSeamIdx < seams.length - 1) {
            phase = 'traverse';
          } else {
            useWeldStore.getState().pauseSimulation();
            return;
          }
        }
      } else if (phase === 'traverse') {
        progress += dt / traverseDuration;
        const nextSeam = seams[currentSeamIdx + 1];
        const nextNorm = new THREE.Vector3(nextSeam.normal.x, nextSeam.normal.y, nextSeam.normal.z).normalize();
        const nextStart = new THREE.Vector3(nextSeam.startPoint.x, nextSeam.startPoint.y, nextSeam.startPoint.z);
        const nextEnd = new THREE.Vector3(nextSeam.endPoint.x, nextSeam.endPoint.y, nextSeam.endPoint.z);
        const nextTorchAxis = getEffectiveTorchVector(
          nextStart,
          nextEnd,
          nextNorm,
          nextSeam.parameters.torchTiltAngle,
          nextSeam.parameters.torchLeadAngle,
          nextSeam.parameters.jointType
        );
        const nextApproach = new THREE.Vector3().copy(nextStart).addScaledVector(
          nextTorchAxis,
          Math.max(10, nextSeam.parameters.approachDistance)
        );
        const currentPos = new THREE.Vector3().lerpVectors(pRetract, nextApproach, Math.min(1, progress));
        torch.position.copy(currentPos);
        const interpAxis = new THREE.Vector3().lerpVectors(effectiveTorchAxis, nextTorchAxis, progress).normalize();
        safeQuaternion(interpAxis);
        if (arcLight) arcLight.intensity = 0;
        if (arcSparksRef.current) (arcSparksRef.current.material as THREE.PointsMaterial).opacity = 0;
        activeBeadMesh.visible = false;
        moltenPuddleMesh.visible = false;
        updatePhase('rapid_traverse');

        if (progress >= 1) {
          progress = 0;
          currentSeamIdx++;
          useWeldStore.getState().setSimCurrentSeamIndex(currentSeamIdx);
          phase = 'approach';
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, seams, playbackSpeed]);

  // Pointer Movement & Raycast Snapping
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasMountRef.current || !cameraRef.current || !meshRef.current) return;
    const rect = canvasMountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const snapped = getSnappedPoint(hit, manualStartPoint, seams, meshRef.current);
      const p = snapped.point;
      const n = snapped.normal;
      setActiveSnapType(snapped.snapType);

      const hitCoord: Vector3D = {
        x: parseFloat(p.x.toFixed(2)),
        y: parseFloat(p.y.toFixed(2)),
        z: parseFloat(p.z.toFixed(2)),
      };
      setCursorPos(hitCoord);
      setCursorNormal({ x: n.x, y: n.y, z: n.z });
      setDisplayCoords(hitCoord);

      if (manualStartPoint) {
        const dx = hitCoord.x - manualStartPoint.x;
        const dy = hitCoord.y - manualStartPoint.y;
        const dz = hitCoord.z - manualStartPoint.z;
        const dist = parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(1));
        setMeasuredDist(dist);
        setDisplayDist(dist);

        // Real-time Air Gap Substrate Validation
        const subCheck = validatePathSubstrate(manualStartPoint, p, n, meshRef.current);
        setLiveAirGap(subCheck.isAirGap ? { isAirGap: true, gapDistanceMm: subCheck.gapDistanceMm } : null);
      } else {
        setMeasuredDist(null);
        setDisplayDist(null);
        setLiveAirGap(null);
      }

      if (mode === 'add_seam') {
        setManualCandidatePoint(hitCoord, { x: n.x, y: n.y, z: n.z });
      }

      // Smooth Fade-In when actively hovering or measuring points
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setIsCoordsVisible(true);
    } else {
      setCursorPos(null);
      setCursorNormal(null);
      setActiveSnapType(null);
      setMeasuredDist(null);

      // Smooth slow Fade-Out when cursor leaves or stops measuring
      if (!fadeTimeoutRef.current) {
        fadeTimeoutRef.current = setTimeout(() => {
          setIsCoordsVisible(false);
          fadeTimeoutRef.current = null;
        }, 800);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    if (mode === 'add_seam') {
      if (!cursorPos || !meshRef.current || !cameraRef.current) return;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(meshRef.current);
      if (intersects.length === 0) return;

      const hit = intersects[0];
      const snapped = getSnappedPoint(hit, manualStartPoint, seams, meshRef.current);
      const normal = snapped.normal;
      const pt: Vector3D = {
        x: parseFloat(snapped.point.x.toFixed(2)),
        y: parseFloat(snapped.point.y.toFixed(2)),
        z: parseFloat(snapped.point.z.toFixed(2)),
      };
      const norm: Vector3D = {
        x: parseFloat(normal.x.toFixed(3)),
        y: parseFloat(normal.y.toFixed(3)),
        z: parseFloat(normal.z.toFixed(3)),
      };

      if (!manualStartPoint) {
        setManualStartPoint(pt, norm);
      } else {
        const subCheck = validatePathSubstrate(manualStartPoint, pt, norm, meshRef.current);
        addSeam(manualStartPoint, pt, norm, 'manual', undefined, subCheck.isAirGap, subCheck.gapDistanceMm);
        setLiveAirGap(null);
      }
    } else if (mode === 'orbit' && cameraRef.current) {
      // Direct 3D Click-to-Select Seams & Click-to-Deselect
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const seamHits = raycasterRef.current.intersectObjects(seamsGroupRef.current.children, true);
      if (seamHits.length > 0) {
        let hitObj: THREE.Object3D | null = seamHits[0].object;
        while (hitObj && !hitObj.userData?.seamId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.seamId) {
          selectSeam(hitObj.userData.seamId);
          return;
        }
      } else {
        // Clicked background -> deselect so all completed seams show as shiny metal
        selectSeam(null);
      }
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0D120D]">
      {/* Isolated Three.js Canvas Container: React reconciliation never touches its DOM children */}
      <div
        ref={canvasMountRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        className="w-full h-full cursor-crosshair"
      />

      {/* 3D Telemetry HUD Overlay (Seamless, transparent, white typography at bottom-left - never overlaps tabs) */}
      <div className="absolute bottom-5 left-5 z-10 pointer-events-none flex flex-col gap-1 font-mono text-xs select-none">
        {/* Model Name: Completely transparent, seamless, white */}
        <div className="flex items-center gap-2 py-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
          <span className="w-2 h-2 rounded-full bg-[#e97f01] shadow-[0_0_8px_#e97f01]" />
          <span className="text-[#A4B3A3] text-[11px] tracking-wider uppercase font-medium">PART:</span>
          <span className="font-semibold text-white tracking-wide text-[13px]">{activeModelName}</span>
        </div>

        {/* Dynamic X Y Z Coordinates: smooth fade in, slow fade out, seamless transparent in white */}
        <div
          className={`flex items-center gap-3 py-0.5 text-xs drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-all duration-700 ease-out ${
            isCoordsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
          }`}
        >
          <span className="text-[#A4B3A3]">
            X: <strong className="text-white font-semibold">{displayCoords ? displayCoords.x.toFixed(2) : '0.00'}</strong>
          </span>
          <span className="text-[#A4B3A3]">
            Y: <strong className="text-white font-semibold">{displayCoords ? displayCoords.y.toFixed(2) : '0.00'}</strong>
          </span>
          <span className="text-[#A4B3A3]">
            Z: <strong className="text-white font-semibold">{displayCoords ? displayCoords.z.toFixed(2) : '0.00'}</strong>
          </span>
          {displayDist !== null && (
            <span className="text-[#e97f01] font-medium ml-1">
              LENGTH: <strong className="text-white font-semibold">{displayDist} mm</strong>
            </span>
          )}
        </div>
      </div>

      {/* Modern Glassmorphic In-Focus Seam Specs Card (Appears when Right Sidebar is Collapsed) */}
      {isRightCollapsed && selectedSeam && !isSimulating && (
        <div
          className="absolute top-4 right-4 z-30 w-80 max-w-[calc(100vw-2.5rem)] bg-[#080D08]/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 text-white font-mono animate-in fade-in slide-in-from-right-4 duration-300"
          style={{ fontFamily: 'Onest, sans-serif' }}
        >
          {/* Header Status & Dismiss */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
              <span className="text-[10px] uppercase tracking-widest text-[#86EFAC] font-bold">
                SEAM IN FOCUS
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] border border-white/10 text-[#A7F3D0] rounded">
                #{selectedSeam.sequenceOrder}
              </span>
            </div>
            <button
              onClick={() => selectSeam(null)}
              className="text-[#64748B] hover:text-white p-1 rounded-md hover:bg-white/10 transition active:scale-95"
              title="Deselect Seam"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Seam Title & Quick Tag */}
          <div className="pt-2.5 pb-2">
            <h3 className="text-sm font-bold text-white tracking-wide truncate">
              {selectedSeam.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#A4B3A3]">
              <span className="font-semibold text-[#e97f01]">{selectedSeam.parameters.jointType}</span>
              <span>•</span>
              <span>{selectedSeam.parameters.process}</span>
              <span>•</span>
              <span className="text-white font-medium">{selectedSeam.length} mm</span>
            </div>
          </div>

          {/* Air Gap / Non-Manufacturable Warning Tag in HUD Card */}
          {selectedSeam.hasAirGap && (
            <div className="my-2 p-2 rounded-lg bg-[#271305]/80 border border-[#F59E0B]/50 text-[#FCD34D] text-[10px] font-mono flex items-start gap-2 backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#FBBF24]">Air Gap Detected (Non-Manufacturable)</span>
                <p className="text-[9px] text-[#FDE68A]/80 font-sans mt-0.5 leading-tight">
                  Path bridges empty space ({selectedSeam.airGapDistanceMm || 0}mm gap) without underlying substrate.
                </p>
              </div>
            </div>
          )}

          {/* Transparent Glassmorphic Parameter Grid */}
          <div className="grid grid-cols-2 gap-1.5 my-2 text-[10px] font-mono">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 hover:bg-white/[0.06] transition">
              <span className="text-[#8EA08D] block text-[9px] uppercase tracking-wider">SPEED</span>
              <span className="text-white font-bold text-xs">{selectedSeam.parameters.travelSpeed} mm/s</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 hover:bg-white/[0.06] transition">
              <span className="text-[#8EA08D] block text-[9px] uppercase tracking-wider">ARC POWER</span>
              <span className="text-[#38BDF8] font-bold text-xs">{selectedSeam.parameters.current}A • {selectedSeam.parameters.voltage}V</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 hover:bg-white/[0.06] transition">
              <span className="text-[#8EA08D] block text-[9px] uppercase tracking-wider">WIRE FEED • Ø</span>
              <span className="text-white font-bold text-xs">{selectedSeam.parameters.wireFeedSpeed}m • {selectedSeam.parameters.wireDiameter || 1.2}mm</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 hover:bg-white/[0.06] transition">
              <span className="text-[#8EA08D] block text-[9px] uppercase tracking-wider">TILT • LEAD</span>
              <span className="text-[#e97f01] font-bold text-xs">{selectedSeam.parameters.torchTiltAngle}° • {selectedSeam.parameters.torchLeadAngle}°</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => startSimulation(selectedSeam.id)}
              className="py-1.5 px-2 bg-gradient-to-r from-[#17301c] to-[#224428] hover:from-[#1e3c23] hover:to-[#2c5834] border border-[#2b5832] rounded-lg text-[#86EFAC] hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
              title="Simulate this specific seam path"
            >
              <Play className="w-3 h-3 fill-current text-[#4ADE80]" />
              <span>Simulate</span>
            </button>

            <button
              onClick={() => focusOnSeam(selectedSeam)}
              className="py-1.5 px-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-[#CBD5E1] hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              title="Re-focus camera on this seam"
            >
              <Target className="w-3 h-3 text-[#38BDF8]" />
              <span>Re-Focus</span>
            </button>
          </div>

          {/* Expand Full Parameters Panel */}
          {onExpandRight && (
            <button
              onClick={onExpandRight}
              className="w-full mt-2 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#e97f01]/50 rounded-lg text-[#e97f01] hover:text-[#fb923c] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Sliders className="w-3 h-3" />
              <span>Open Parameters Panel</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Kinematics Telemetry when Right Sidebar is Collapsed (Seamless, transparent, white at bottom-right) */}
      <div
        className={`absolute bottom-5 right-5 z-10 pointer-events-none flex flex-col gap-1 font-mono text-xs select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-all duration-700 ease-out ${
          isRightCollapsed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-end gap-2 text-right">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e97f01] shadow-[0_0_8px_#e97f01]" />
          <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-white tracking-wide text-xs">
            ARMATRIX KINEMATICS
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-[11px] text-right">
          <div className="text-[#38BDF8] font-bold text-[10px]">
            ● 100% REACHABLE (Zero Singularities)
          </div>
          <div className="text-[#A4B3A3]">
            Envelope: <strong className="text-white font-semibold">3500 mm (Snake-Arm)</strong>
          </div>
          <div className="text-[#A4B3A3]">
            Traverse: <strong className="text-white font-semibold">{rapidTraverseSpeed} mm/s</strong>
          </div>
          <div className="text-[#A4B3A3]">
            Total Seams: <strong className="text-[#22C55E] font-semibold">{jobSummary.total_weld_length_mm} mm</strong>
          </div>
          <div className="text-[#A4B3A3] pt-0.5">
            Total Cycle: <strong className="text-[#e97f01] font-bold">{jobSummary.total_cycle_time_sec}s</strong>
          </div>
        </div>
      </div>

      {/* Centered Reticle Targeting Banner (No pill shape, no pulse dots, white text, smooth fade in/out, zero slashes) */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 whitespace-nowrap pointer-events-none transition-all duration-300 ease-out ${
          mode === 'add_seam'
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div
          className={`font-mono text-xs px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-3 tracking-wide transition-all ${
            liveAirGap?.isAirGap
              ? 'bg-[#291305]/95 border border-[#F59E0B] text-[#FDE68A] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'bg-[#0C120C]/92 border border-white/20 text-white'
          }`}
        >
          {liveAirGap?.isAirGap ? (
            <>
              <span className="flex items-center gap-1.5 text-[#F59E0B] font-bold">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <span>NO SUBSTRATE:</span>
              </span>
              <span className="text-[#FCD34D] font-medium">
                Bridging empty space ({liveAirGap.gapDistanceMm} mm air gap) — Non-manufacturable!
              </span>
            </>
          ) : (
            <>
              <span className="text-white font-bold">
                {manualStartPoint ? 'STEP 2:' : 'CLICK-TO-WELD:'}
              </span>
              <span className="text-[#E2ECE1] font-normal">
                {manualStartPoint
                  ? `Click 2nd point to finalize seam (${measuredDist || 0} mm) — [ESC to Cancel]`
                  : 'Click 3D part to anchor start point — [ESC to Cancel]'}
              </span>
            </>
          )}
          {activeSnapType && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] tracking-wider font-mono font-semibold">
              SNAP: {activeSnapType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
