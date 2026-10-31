'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D, TorchNozzleType } from '@/types/weld';

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
    wire.position.y = 1.0;
    group.add(wire);

    return group;
  }

  // Authentic Industrial Binzel-style Robotic Welding Torch (from reference photo)
  // 1. Protruding Copper Contact Tip & Welding Wire (Origin at 0, 0, 0 where arc strikes)
  const wireGeom = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 12);
  const wireMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', metalness: 0.95, roughness: 0.1 });
  const wire = new THREE.Mesh(wireGeom, wireMat);
  wire.position.y = 1.6;
  group.add(wire);

  const contactTipGeom = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 16);
  const contactTipMat = new THREE.MeshStandardMaterial({ color: '#B45309', metalness: 0.9, roughness: 0.2 });
  const contactTip = new THREE.Mesh(contactTipGeom, contactTipMat);
  contactTip.position.y = 4.0;
  group.add(contactTip);

  // 2. Tapered Chrome Gas Nozzle (Chrome finish, tapered towards joint)
  const nozzleGeom = new THREE.CylinderGeometry(3.5, 2.2, 13, 24);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: '#F1F5F9', metalness: 0.95, roughness: 0.12 });
  const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
  nozzle.position.y = 11.5;
  group.add(nozzle);

  // 3. Nozzle Retaining Ring / Gas Diffuser Collar (Knurled chrome slots)
  const collarGeom = new THREE.CylinderGeometry(3.8, 3.7, 3, 24);
  const collarMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', metalness: 0.9, roughness: 0.25 });
  const collar = new THREE.Mesh(collarGeom, collarMat);
  collar.position.y = 18.5;
  group.add(collar);

  // 4. Smooth Curved Stainless Steel Gooseneck (Continuous curve)
  const curvePoints = [
    new THREE.Vector3(0, 20, 0),
    new THREE.Vector3(0, 26, 2),
    new THREE.Vector3(0, 33, 4.5),
    new THREE.Vector3(0, 39, 6),
  ];
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const neckGeom = new THREE.TubeGeometry(curve, 24, 2.1, 16, false);
  const neckMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.88, roughness: 0.22 });
  const neck = new THREE.Mesh(neckGeom, neckMat);
  group.add(neck);

  // 5. Machined Hex/Round Brass Mounting Collar (Golden brass)
  const brassGeom = new THREE.CylinderGeometry(3.8, 3.8, 5.5, 20);
  const brassMat = new THREE.MeshStandardMaterial({ color: '#D4AF37', metalness: 0.92, roughness: 0.22 });
  const brass = new THREE.Mesh(brassGeom, brassMat);
  brass.position.set(0, 42, 6);
  group.add(brass);

  // 6. Heavy-Duty Ergonomic Torch Body (Matte black housing)
  const bodyGeom = new THREE.CylinderGeometry(4.5, 4.5, 20, 24);
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#1B201C', metalness: 0.35, roughness: 0.55 });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, 54, 6);
  group.add(body);

  // 7. Raised Switch/Sensor Module on Torch Body
  const sensorBoxGeom = new THREE.BoxGeometry(4.0, 9.5, 5.0);
  const sensorBoxMat = new THREE.MeshStandardMaterial({ color: '#141814', metalness: 0.4, roughness: 0.5 });
  const sensorBox = new THREE.Mesh(sensorBoxGeom, sensorBoxMat);
  sensorBox.position.set(0, 56, 9.2);
  group.add(sensorBox);

  // 8. Tactile Red Actuation Button on Sensor Module (From user photo)
  const buttonGeom = new THREE.CylinderGeometry(1.3, 1.3, 1.4, 16);
  const buttonMat = new THREE.MeshStandardMaterial({
    color: '#EF4444',
    emissive: '#B91C1C',
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4,
  });
  const button = new THREE.Mesh(buttonGeom, buttonMat);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 58, 12.0);
  group.add(button);

  // 9. Rear Corrugated Cable Strain-Relief Hose (Flexible black corrugated tubing)
  const hoseGeom = new THREE.CylinderGeometry(3.9, 3.9, 22, 20);
  const hoseMat = new THREE.MeshStandardMaterial({ color: '#111411', metalness: 0.2, roughness: 0.75 });
  const hose = new THREE.Mesh(hoseGeom, hoseMat);
  hose.position.set(0, 74, 6);
  group.add(hose);

  // Corrugated ribbed rings along the hose
  for (let r = 0; r < 6; r++) {
    const ringGeom = new THREE.TorusGeometry(4.0, 0.35, 8, 20);
    const ringMat = new THREE.MeshStandardMaterial({ color: '#1C221C', roughness: 0.6 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 65 + r * 3.4, 6);
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

interface ViewportCanvasProps {
  isRightCollapsed?: boolean;
  isLeftCollapsed?: boolean;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({ isRightCollapsed = false, isLeftCollapsed = false }) => {
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
  const playbackSpeed = useWeldStore((s) => s.playbackSpeed);
  const rapidTraverseSpeed = useWeldStore((s) => s.rapidTraverseSpeed);
  const exportJobJSON = useWeldStore((s) => s.exportJobJSON);
  const setPart = useWeldStore((s) => s.setPart);
  const setPartLoading = useWeldStore((s) => s.setPartLoading);

  const jobSummary = exportJobJSON().job_summary;

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
  const torchMeshGroupRef = useRef<THREE.Group>(new THREE.Group());
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
      const material = new THREE.MeshStandardMaterial({
        color: '#5C6D60',
        metalness: 0.28,
        roughness: 0.48,
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

      // STRICT ANTI-Z-FIGHTING 3-STATE SEAM RENDERING:
      // 1. If IS SELECTED: Render vibrant Armatrix Orange (#e97f01). The metallic bead under it is NEVER rendered,
      //    guaranteeing zero visual z-fighting or glitching!
      // 2. If NOT SELECTED and HAS BEEN WELDED/SIMULATED: Render shiny metallic bead (#D4E2D4, metalness 0.92, roughness 0.18).
      // 3. If NOT SELECTED and NOT WELDED: Render clean CAD planning green (#22C55E).
      const wireScale = (seam.parameters.wireDiameter ?? 1.2) / 1.2;
      const beadRadius = (isSelected ? 2.5 : isCompleted ? 2.3 : 1.7) * wireScale;
      const cylinderGeom = new THREE.CylinderGeometry(beadRadius, beadRadius, length, 16);
      cylinderGeom.translate(0, length / 2, 0);
      cylinderGeom.rotateX(Math.PI / 2);

      let cylinderMat: THREE.Material;
      if (isSelected) {
        cylinderMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#e97f01'),
          emissive: new THREE.Color('#e97f01'),
          emissiveIntensity: 0.85,
          roughness: 0.25,
          metalness: 0.5,
        });
      } else if (isCompleted) {
        cylinderMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#D4E2D4'),
          metalness: 0.92,
          roughness: 0.18,
        });
      } else {
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
  }, [seams, selectedSeamId, completedSeamIds, showNormals, showWaypoints, isSimulating]);

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
        positionCylinderBetweenPoints(activeBeadMesh, pStart, currentPos, 2.5);

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

    if (mode === 'add_seam') {
      if (!cursorPos || !meshRef.current || !cameraRef.current) return;

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
          if (manualStartPoint) {
            setManualStartPoint(null, null);
          }
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

      {/* Smooth Mode Instruction & Reticle Banner */}
      {mode === 'add_seam' && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 transition-all duration-300 ease-out">
          <div className="bg-[#e97f01] text-white font-mono text-xs px-4 py-2 rounded-lg shadow-xl backdrop-blur flex items-center gap-2.5 font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>
              {manualStartPoint
                ? `ANCHORED: CLICK 2ND POINT TO FINALIZE (${measuredDist || 0} mm) — [ESC or Right-Click to Cancel]`
                : 'SURFACE TARGETING: CLICK MESH TO ANCHOR START POINT — [ESC to Cancel]'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
