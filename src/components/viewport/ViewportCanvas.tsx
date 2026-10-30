'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D, TorchNozzleType } from '@/types/weld';

// Industrial Swan-Neck Robotic Torch Builder matching Armatrix's hyper-redundant arms
function buildRoboticTorch(nozzle: TorchNozzleType): THREE.Group {
  const group = new THREE.Group();

  // 1. Robot Wrist Mounting Flange (ISO standard circular flange, gunmetal grey)
  const flangeGeom = new THREE.CylinderGeometry(7.0, 7.0, 4.0, 24);
  const flangeMat = new THREE.MeshStandardMaterial({ color: '#1B211B', metalness: 0.85, roughness: 0.3 });
  const flange = new THREE.Mesh(flangeGeom, flangeMat);
  flange.position.y = 52;
  group.add(flange);

  // 2. Armatrix Actuation Collar (Armatrix Safety Orange #e97f01)
  const collarGeom = new THREE.CylinderGeometry(6.2, 6.2, 6.0, 24);
  const collarMat = new THREE.MeshStandardMaterial({ color: '#e97f01', metalness: 0.6, roughness: 0.25 });
  const collar = new THREE.Mesh(collarGeom, collarMat);
  collar.position.y = 47;
  group.add(collar);

  // 3. Swan-Neck Curved Gooseneck (Bent at 35 degrees toward the weld puddle)
  const upperTubeGeom = new THREE.CylinderGeometry(3.6, 3.6, 16, 20);
  const neckMat = new THREE.MeshStandardMaterial({ color: '#C8A051', metalness: 0.85, roughness: 0.25 }); // Polished bronze/brass
  const upperTube = new THREE.Mesh(upperTubeGeom, neckMat);
  upperTube.position.set(0, 36, 0);
  group.add(upperTube);

  const elbowGeom = new THREE.SphereGeometry(4.2, 16, 16);
  const elbow = new THREE.Mesh(elbowGeom, flangeMat);
  elbow.position.set(0, 27, 0);
  group.add(elbow);

  const lowerNeckGeom = new THREE.CylinderGeometry(3.2, 3.2, 18, 20);
  const lowerNeck = new THREE.Mesh(lowerNeckGeom, neckMat);
  lowerNeck.position.set(3.5, 17, 0);
  lowerNeck.rotation.z = -0.38;
  group.add(lowerNeck);

  // 4. Gas Diffuser / Torch Housing
  const diffuserGeom = new THREE.CylinderGeometry(4.5, 4.0, 10, 20);
  const diffuserMat = new THREE.MeshStandardMaterial({ color: '#2C352B', metalness: 0.9, roughness: 0.2 });
  const diffuser = new THREE.Mesh(diffuserGeom, diffuserMat);
  diffuser.position.set(6.8, 8, 0);
  diffuser.rotation.z = -0.38;
  group.add(diffuser);

  // 5. Interchangeable Industrial Nozzle Heads
  if (nozzle === 'conical') {
    // Heavy-duty GMAW/MIG Conical Bell Nozzle
    const nozzGeom = new THREE.CylinderGeometry(3.0, 5.2, 12, 20);
    const nozzMat = new THREE.MeshStandardMaterial({ color: '#C87D40', metalness: 0.92, roughness: 0.15 });
    const nozz = new THREE.Mesh(nozzGeom, nozzMat);
    nozz.position.set(9.0, -1.5, 0);
    nozz.rotation.z = -0.38;
    group.add(nozz);

    // Copper Contact Tip & Solid Wire Stick-out
    const tipGeom = new THREE.CylinderGeometry(1.0, 1.0, 5, 12);
    const tipMat = new THREE.MeshStandardMaterial({ color: '#E07A5F', metalness: 0.95, roughness: 0.1 });
    const tip = new THREE.Mesh(tipGeom, tipMat);
    tip.position.set(10.2, -5.5, 0);
    tip.rotation.z = -0.38;
    group.add(tip);

    const wireGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    const wireMat = new THREE.MeshStandardMaterial({ color: '#C5C6C7', metalness: 0.9, roughness: 0.1 });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    wire.position.set(11.2, -9.0, 0);
    wire.rotation.z = -0.38;
    group.add(wire);
  } else if (nozzle === 'narrow') {
    // Bottleneck Slim Needle Nozzle for Deep Confined Spaces (Armatrix Snake-Arm specialty)
    const bottleGeom = new THREE.CylinderGeometry(2.0, 4.2, 10, 20);
    const nozzMat = new THREE.MeshStandardMaterial({ color: '#D97706', metalness: 0.9, roughness: 0.2 });
    const bottle = new THREE.Mesh(bottleGeom, nozzMat);
    bottle.position.set(8.5, 0.5, 0);
    bottle.rotation.z = -0.38;
    group.add(bottle);

    // Slim needle extension
    const needleGeom = new THREE.CylinderGeometry(1.6, 1.8, 14, 20);
    const needleMat = new THREE.MeshStandardMaterial({ color: '#E5E7EB', metalness: 0.95, roughness: 0.15 });
    const needle = new THREE.Mesh(needleGeom, needleMat);
    needle.position.set(11.2, -8.5, 0);
    needle.rotation.z = -0.38;
    group.add(needle);

    // Wire stick-out
    const wireGeom = new THREE.CylinderGeometry(0.35, 0.35, 5, 8);
    const wireMat = new THREE.MeshStandardMaterial({ color: '#C5C6C7', metalness: 0.9, roughness: 0.1 });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    wire.position.set(12.8, -14.5, 0);
    wire.rotation.z = -0.38;
    group.add(wire);
  } else {
    // Coaxial Laser Optic Head with focus cone
    const laserHeadGeom = new THREE.CylinderGeometry(4.2, 4.2, 16, 24);
    const laserMat = new THREE.MeshStandardMaterial({ color: '#1F2937', metalness: 0.85, roughness: 0.25 });
    const laserHead = new THREE.Mesh(laserHeadGeom, laserMat);
    laserHead.position.set(8.8, -1.0, 0);
    laserHead.rotation.z = -0.38;
    group.add(laserHead);

    const opticRingGeom = new THREE.TorusGeometry(3.2, 0.8, 12, 24);
    const opticRingMat = new THREE.MeshStandardMaterial({ color: '#0284C7', emissive: '#38BDF8', emissiveIntensity: 0.8 });
    const opticRing = new THREE.Mesh(opticRingGeom, opticRingMat);
    opticRing.position.set(10.5, -6.5, 0);
    opticRing.rotation.x = Math.PI / 2;
    opticRing.rotation.y = -0.38;
    group.add(opticRing);

    const coneGeom = new THREE.ConeGeometry(2.8, 8, 20);
    const coneMat = new THREE.MeshStandardMaterial({ color: '#374151', metalness: 0.9, roughness: 0.2 });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(11.8, -9.5, 0);
    cone.rotation.z = -0.38;
    group.add(cone);
  }

  // Adjust tip offset so the active contact point aligns with the seam
  group.position.set(-11, 10, 0);
  return group;
}

export const ViewportCanvas: React.FC = () => {
  // Separate mount ref for Three.js WebGL canvas to avoid React reconciliation conflicts
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Selective Zustand selectors to prevent canvas unmounts / loop thrashing
  const mode = useWeldStore((s) => s.mode);
  const showWireframe = useWeldStore((s) => s.showWireframe);
  const showNormals = useWeldStore((s) => s.showNormals);
  const showBoundingBox = useWeldStore((s) => s.showBoundingBox);
  const showWaypoints = useWeldStore((s) => s.showWaypoints);
  const viewPreset = useWeldStore((s) => s.viewPreset);
  const setViewPreset = useWeldStore((s) => s.setViewPreset);
  const activeModelName = useWeldStore((s) => s.activeModelName);
  const manualStartPoint = useWeldStore((s) => s.manualStartPoint);
  const setManualStartPoint = useWeldStore((s) => s.setManualStartPoint);
  const setManualCandidatePoint = useWeldStore((s) => s.setManualCandidatePoint);
  const addSeam = useWeldStore((s) => s.addSeam);
  const seams = useWeldStore((s) => s.seams);
  const selectedSeamId = useWeldStore((s) => s.selectedSeamId);
  const isSimulating = useWeldStore((s) => s.isSimulating);
  const playbackSpeed = useWeldStore((s) => s.playbackSpeed);
  const nozzleType = useWeldStore((s) => s.nozzleType);
  const setPart = useWeldStore((s) => s.setPart);
  const setPartLoading = useWeldStore((s) => s.setPartLoading);

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
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
  const arcLightRef = useRef<THREE.PointLight | null>(null);
  const arcSparksRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Cursor coordinates display & smooth fade-in/fade-out
  const [cursorPos, setCursorPos] = useState<Vector3D | null>(null);
  const [measuredDist, setMeasuredDist] = useState<number | null>(null);
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

    // CAD Grid Floor
    const grid = new THREE.GridHelper(360, 36, '#283B25', '#162215');
    grid.position.y = 0;
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
    renderer.toneMappingExposure = 1.35;
    
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
    controlsRef.current = controls;

    // 5. High-Fidelity Omni-Directional CAD Studio Lighting (Zero Shadow Acne)
    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#384838', 2.2);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight('#FFFFFF', 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.4);
    keyLight.position.set(180, 260, 200);
    scene.add(keyLight);

    const fillLight1 = new THREE.DirectionalLight('#E2E8F0', 2.0);
    fillLight1.position.set(-180, 200, 160);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight('#CBD5E1', 1.8);
    fillLight2.position.set(160, 180, -180);
    scene.add(fillLight2);

    const rimLight = new THREE.DirectionalLight('#e97f01', 1.5);
    rimLight.position.set(-160, 160, -180);
    scene.add(rimLight);

    const bottomBounce = new THREE.DirectionalLight('#607060', 1.0);
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

    // 7. Industrial Robotic Swan-Neck Welding Torch & Arc Lighting
    const torchContainer = new THREE.Group();
    const torchMesh = buildRoboticTorch(nozzleType);
    torchContainer.add(torchMesh);

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
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Dynamically update Robotic Torch when nozzle type changes
  useEffect(() => {
    if (!torchRef.current) return;
    const torchContainer = torchRef.current;
    for (let i = torchContainer.children.length - 1; i >= 0; i--) {
      const child = torchContainer.children[i];
      if (child.type === 'Group') {
        torchContainer.remove(child);
      }
    }
    const newTorchMesh = buildRoboticTorch(nozzleType);
    torchContainer.add(newTorchMesh);
  }, [nozzleType]);

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

    let modelUrl = `/models/bracket.stl`;
    if (activeModelName === 'Pipe T-Joint') modelUrl = `/models/pipe_joint.stl`;
    if (activeModelName === 'Box Flange') modelUrl = `/models/box_flange.stl`;
    if (activeModelName === 'Armatrix Emblem') modelUrl = `/models/armatrix_emblem.stl`;

    const loader = new STLLoader();
    loader.load(
      modelUrl,
      (geometry) => {
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

        // High-clarity satin alloy material with crisp omni-directional lighting
        const material = new THREE.MeshStandardMaterial({
          color: '#C6D2C5',
          metalness: 0.15,
          roughness: 0.35,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
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
        setPartLoading(false);

        if (controlsRef.current) {
          controlsRef.current.target.set(0, height / 2, 0);
          controlsRef.current.update();
        }
      },
      undefined,
      (err) => {
        console.error('Error loading STL:', err);
        setPartLoading(false);
      }
    );
  }, [activeModelName, setPart, setPartLoading]);

  // Wireframe & Bounding Box toggles
  useEffect(() => {
    if (wireframeRef.current) wireframeRef.current.visible = showWireframe;
  }, [showWireframe]);

  useEffect(() => {
    if (boundingBoxRef.current) boundingBoxRef.current.visible = showBoundingBox;
  }, [showBoundingBox]);

  // Render Planned Weld Seams
  useEffect(() => {
    const group = seamsGroupRef.current;
    group.clear();

    seams.forEach((seam) => {
      const isSelected = seam.id === selectedSeamId;
      const p1 = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
      const p2 = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
      const normal = new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z).normalize();
      const length = p1.distanceTo(p2);

      if (length < 0.1) return;

      const seamContainer = new THREE.Group();

      const beadRadius = isSelected ? 2.5 : 1.7;
      const cylinderGeom = new THREE.CylinderGeometry(beadRadius, beadRadius, length, 16);
      cylinderGeom.translate(0, length / 2, 0);
      cylinderGeom.rotateX(Math.PI / 2);

      const color = isSelected ? '#e97f01' : '#22C55E';
      const cylinderMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(isSelected ? '#e97f01' : '#15803D'),
        emissiveIntensity: isSelected ? 0.85 : 0.4,
        roughness: 0.2,
        metalness: 0.85,
      });

      const beadMesh = new THREE.Mesh(cylinderGeom, cylinderMat);
      beadMesh.position.copy(p1);
      beadMesh.lookAt(p2);
      seamContainer.add(beadMesh);

      const startSphere = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 3.0 : 2.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0284C7', emissiveIntensity: 0.6 })
      );
      startSphere.position.copy(p1);
      seamContainer.add(startSphere);

      const endSphere = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 3.0 : 2.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#B91C1C', emissiveIntensity: 0.6 })
      );
      endSphere.position.copy(p2);
      seamContainer.add(endSphere);

      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const arrowHelper = new THREE.ArrowHelper(dir, mid, Math.min(18, length * 0.45), isSelected ? 0xffffff : 0xe97f01, 4, 3);
      seamContainer.add(arrowHelper);

      if (showNormals) {
        const normalHelper = new THREE.ArrowHelper(normal, mid, 20, 0x38bdf8, 4, 2.5);
        seamContainer.add(normalHelper);

        const appPt = new THREE.Vector3().copy(p1).addScaledVector(normal, seam.parameters.approachDistance);
        const retPt = new THREE.Vector3().copy(p2).addScaledVector(normal, seam.parameters.retractDistance);

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
          const appSphere = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 10), new THREE.MeshBasicMaterial({ color: '#60A5FA' }));
          appSphere.position.copy(appPt);
          const retSphere = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 10), new THREE.MeshBasicMaterial({ color: '#F87171' }));
          retSphere.position.copy(retPt);
          seamContainer.add(appSphere);
          seamContainer.add(retSphere);
        }
      }

      group.add(seamContainer);
    });
  }, [seams, selectedSeamId, showNormals, showWaypoints]);

  // Live Preview Seam during interactive 'add_seam' click
  useEffect(() => {
    const group = previewSeamRef.current;
    group.clear();

    if (mode === 'add_seam' && manualStartPoint) {
      const p1 = new THREE.Vector3(manualStartPoint.x, manualStartPoint.y, manualStartPoint.z);

      const startMarker = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#e97f01', emissive: '#e97f01', emissiveIntensity: 0.9 })
      );
      startMarker.position.copy(p1);
      group.add(startMarker);

      if (cursorPos) {
        const p2 = new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z);
        const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineBasicMaterial({ color: '#e97f01', linewidth: 3 });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        const endPreview = new THREE.Mesh(
          new THREE.SphereGeometry(2.5, 12, 12),
          new THREE.MeshBasicMaterial({ color: '#38BDF8' })
        );
        endPreview.position.copy(p2);
        group.add(endPreview);
      }
    }
  }, [mode, manualStartPoint, cursorPos]);

  // Interactive Snapping Reticle visibility
  useEffect(() => {
    if (!reticleRef.current) return;
    if (mode === 'add_seam' && cursorPos) {
      reticleRef.current.visible = true;
      reticleRef.current.position.set(cursorPos.x, cursorPos.y, cursorPos.z);
    } else {
      reticleRef.current.visible = false;
    }
  }, [mode, cursorPos]);

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

    // Active Deposited Bead Segment (Solidifying Metallic Alloy)
    const activeBeadGeom = new THREE.CylinderGeometry(2.3, 2.3, 1, 16);
    activeBeadGeom.translate(0, 0.5, 0);
    activeBeadGeom.rotateX(Math.PI / 2);
    const activeBeadMat = new THREE.MeshStandardMaterial({
      color: '#B5C4B5',
      metalness: 0.88,
      roughness: 0.28,
    });
    const activeBeadMesh = new THREE.Mesh(activeBeadGeom, activeBeadMat);
    activeBeadMesh.visible = false;
    dynamicGroup.add(activeBeadMesh);

    // Glowing Molten Weld Puddle right at torch tip
    const moltenPuddleGeom = new THREE.SphereGeometry(2.8, 14, 14);
    const moltenPuddleMat = new THREE.MeshStandardMaterial({
      color: '#FF4500',
      emissive: '#FF8800',
      emissiveIntensity: 3.2,
    });
    const moltenPuddleMesh = new THREE.Mesh(moltenPuddleGeom, moltenPuddleMat);
    moltenPuddleMesh.visible = false;
    dynamicGroup.add(moltenPuddleMesh);

    let animId: number;
    let currentSeamIdx = 0;
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
    useWeldStore.getState().setSimCurrentSeamIndex(0);

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const seam = seams[currentSeamIdx];
      if (!seam) {
        useWeldStore.getState().pauseSimulation();
        return;
      }

      const pStart = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
      const pEnd = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
      const normal = new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z);
      if (normal.lengthSq() < 0.001) normal.set(0, 1, 0);
      normal.normalize();

      const pApproach = new THREE.Vector3().copy(pStart).addScaledVector(normal, Math.max(10, seam.parameters.approachDistance));
      const pRetract = new THREE.Vector3().copy(pEnd).addScaledVector(normal, Math.max(10, seam.parameters.retractDistance));

      const spd = Math.max(0.2, playbackSpeed);
      const weldDuration = Math.max(0.6, seam.length / Math.max(1, seam.parameters.travelSpeed)) / spd;
      const approachDuration = 0.8 / spd;
      const retractDuration = 0.8 / spd;
      const traverseDuration = 1.0 / spd;

      // Safe orientation calculation
      const safeQuaternion = (targetNormal: THREE.Vector3) => {
        const up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(up.dot(targetNormal)) > 0.99) {
          up.set(0, 0, 1);
        }
        torch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetNormal);
      };

      if (phase === 'approach') {
        progress += dt / approachDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pApproach, pStart, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(normal);
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
        safeQuaternion(normal);

        // Progressive Metallic Weld Bead Deposition behind torch tip
        const beadLen = pStart.distanceTo(currentPos);
        if (beadLen > 0.4) {
          activeBeadMesh.visible = true;
          activeBeadMesh.position.copy(pStart);
          activeBeadMesh.scale.set(1, 1, beadLen);
          activeBeadMesh.lookAt(currentPos);
        }

        // Active glowing molten puddle at contact point
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
          // Permanently solidify finished metallic weld bead for this completed seam
          const finishedGeom = new THREE.CylinderGeometry(2.3, 2.3, seam.length, 16);
          finishedGeom.translate(0, seam.length / 2, 0);
          finishedGeom.rotateX(Math.PI / 2);
          const finishedMat = new THREE.MeshStandardMaterial({
            color: '#B5C4B5',
            metalness: 0.88,
            roughness: 0.28,
          });
          const finishedMesh = new THREE.Mesh(finishedGeom, finishedMat);
          finishedMesh.position.copy(pStart);
          finishedMesh.lookAt(pEnd);
          dynamicGroup.add(finishedMesh);

          activeBeadMesh.visible = false;
          moltenPuddleMesh.visible = false;
          progress = 0;
          phase = 'retract';
        }
      } else if (phase === 'retract') {
        progress += dt / retractDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pEnd, pRetract, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(normal);
        if (arcLight) arcLight.intensity = 0;
        if (arcSparksRef.current) (arcSparksRef.current.material as THREE.PointsMaterial).opacity = 0;
        activeBeadMesh.visible = false;
        moltenPuddleMesh.visible = false;
        updatePhase('retract');

        if (progress >= 1) {
          progress = 0;
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
        const nextApproach = new THREE.Vector3(nextSeam.startPoint.x, nextSeam.startPoint.y, nextSeam.startPoint.z).addScaledVector(
          nextNorm,
          Math.max(10, nextSeam.parameters.approachDistance)
        );
        const currentPos = new THREE.Vector3().lerpVectors(pRetract, nextApproach, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(nextNorm);
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
      const p = hit.point;
      const n = hit.face ? hit.face.normal.clone().transformDirection(meshRef.current.matrixWorld) : new THREE.Vector3(0, 1, 0);

      const hitCoord: Vector3D = {
        x: parseFloat(p.x.toFixed(2)),
        y: parseFloat(p.y.toFixed(2)),
        z: parseFloat(p.z.toFixed(2)),
      };
      setCursorPos(hitCoord);
      setDisplayCoords(hitCoord);

      if (manualStartPoint) {
        const dx = hitCoord.x - manualStartPoint.x;
        const dy = hitCoord.y - manualStartPoint.y;
        const dz = hitCoord.z - manualStartPoint.z;
        const dist = parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(1));
        setMeasuredDist(dist);
        setDisplayDist(dist);
      } else {
        setMeasuredDist(null);
        setDisplayDist(null);
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
    if (mode !== 'add_seam' || !cursorPos || !meshRef.current || !cameraRef.current) return;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current);
    if (intersects.length === 0) return;

    const hit = intersects[0];
    const normal = hit.face ? hit.face.normal.clone().transformDirection(meshRef.current.matrixWorld) : new THREE.Vector3(0, 1, 0);
    const pt: Vector3D = {
      x: parseFloat(hit.point.x.toFixed(2)),
      y: parseFloat(hit.point.y.toFixed(2)),
      z: parseFloat(hit.point.z.toFixed(2)),
    };
    const norm: Vector3D = {
      x: parseFloat(normal.x.toFixed(3)),
      y: parseFloat(normal.y.toFixed(3)),
      z: parseFloat(normal.z.toFixed(3)),
    };

    if (!manualStartPoint) {
      setManualStartPoint(pt, norm);
    } else {
      addSeam(manualStartPoint, pt, norm, 'manual');
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0D120D]">
      {/* Isolated Three.js Canvas Container: React reconciliation never touches its DOM children */}
      <div
        ref={canvasMountRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-crosshair"
      />

      {/* 3D Telemetry HUD Overlay (Seamless, transparent, white typography with no boxes) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1 font-mono text-xs select-none">
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

      {/* Smooth Mode Instruction & Reticle Banner */}
      {mode === 'add_seam' && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 transition-all duration-300 ease-out">
          <div className="bg-[#e97f01] text-white font-mono text-xs px-4 py-2 rounded-lg shadow-xl backdrop-blur flex items-center gap-2.5 font-bold tracking-wide animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>
              {manualStartPoint
                ? `ANCHORED: CLICK 2ND POINT TO FINALIZE SEAM (${measuredDist || 0} mm)`
                : 'SURFACE TARGETING: CLICK MESH TO ANCHOR START POINT'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
