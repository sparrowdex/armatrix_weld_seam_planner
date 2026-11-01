'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D, WeldSeam } from '@/types/weld';
import { validatePathSubstrate } from '@/utils/substrateValidator';
import { analyzeMeshIntegrity } from '@/utils/meshIntegrity';
import { getEffectiveTorchVector, orientTorch } from '@/utils/torchKinematics';
import { getSnappedPoint } from '@/utils/snapping';
import { isTypingTarget, isSliderFocused } from '@/utils/keyboard';
import { buildRoboticTorch } from './torchModel';
import { ViewportOverlays } from './ViewportOverlays';
import {
  heatClock,
  BEAD_COOL_TAU,
  ripplePitchMm,
  createRippledBeadGeometry,
  beadCrownAngle,
  createHotBeadMaterial,
  createHazUniforms,
  setHazSegments,
  HAZ_FADE_END_SEC,
  applyHazTint,
} from '@/utils/weldVisuals';
import { arcAudio } from '@/utils/arcAudio';

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
  const selectSeam = useWeldStore((s) => s.selectSeam);
  const isSimulating = useWeldStore((s) => s.isSimulating);
  const playbackSpeed = useWeldStore((s) => s.playbackSpeed);
  const setPart = useWeldStore((s) => s.setPart);
  const setPartLoading = useWeldStore((s) => s.setPartLoading);

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
  const arcGlowRef = useRef<THREE.Sprite | null>(null);
  const puddleLightRef = useRef<THREE.PointLight | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Game-style Cinematic Camera Focus & Orbit Lerp refs
  const targetCameraPos = useRef<THREE.Vector3 | null>(null);
  const targetControlsTarget = useRef<THREE.Vector3 | null>(null);
  const isCameraTransitioning = useRef<boolean>(false);
  // On-demand rendering: the WebGL frame is only redrawn while something is changing.
  // Any store update, camera move, resize or pointer move extends the render window briefly.
  const renderUntilRef = useRef<number>(0);
  // Weld heat: per-seam deposit timing (real seconds) so finished beads keep cooling after rebuilds,
  // the time until which something is still glowing, and the plate's temper-tint (HAZ) uniforms.
  const weldTimesRef = useRef<Map<string, { start: number; speed: number }>>(new Map());
  const hotUntilRef = useRef<number>(0);
  const hazUniformsRef = useRef(createHazUniforms());
  const hazBaseCountRef = useRef(0);
  const invalidate = () => {
    renderUntilRef.current = performance.now() + 400;
  };
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
      // A manual orbit leaves any preset view, so the header highlight clears
      useWeldStore.getState().setActiveView(null);
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
    torchMeshGroup.add(buildRoboticTorch());
    torchContainer.add(torchMeshGroup);

    // Arc lighting: a blue-white core (the arc column itself) plus a warm orange fill from the molten pool.
    const arcLight = new THREE.PointLight('#DCEEFF', 0, 140, 1.6);
    arcLight.position.set(0, 1.5, 0);
    torchContainer.add(arcLight);
    arcLightRef.current = arcLight;

    const puddleLight = new THREE.PointLight('#FF7A1A', 0, 70, 1.8);
    puddleLight.position.set(0, 0.5, 0);
    torchContainer.add(puddleLight);
    puddleLightRef.current = puddleLight;

    // Arc glare: additive soft sprite so the arc reads as a light source without post-processing bloom
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const glowCtx = glowCanvas.getContext('2d');
    if (glowCtx) {
      const g = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.1, 'rgba(240, 248, 255, 0.95)');
      g.addColorStop(0.3, 'rgba(170, 210, 255, 0.4)');
      g.addColorStop(0.6, 'rgba(110, 170, 255, 0.1)');
      g.addColorStop(1, 'rgba(80, 150, 255, 0)');
      glowCtx.fillStyle = g;
      glowCtx.fillRect(0, 0, 64, 64);
    }
    const arcGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(glowCanvas),
        color: '#FFFFFF',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    arcGlow.position.set(0, 2.5, 0); // lifted along the torch axis so the work surface does not clip it
    arcGlow.scale.setScalar(14);
    arcGlow.renderOrder = 10;
    arcGlow.visible = false;
    torchContainer.add(arcGlow);
    arcGlowRef.current = arcGlow;

    // Spatter: world-space ballistic particles (spawn at the arc, fly off along the torch axis, fall under gravity, cool and fade)
    const sparkCount = 220; // headroom for the "sparky" easter egg
    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3));
    sparkGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3));

    // Soft circular ember texture so sparks aren't raw square pixel blocks
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = 16;
    sparkCanvas.height = 16;
    const sparkCtx = sparkCanvas.getContext('2d');
    if (sparkCtx) {
      const grad = sparkCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(255, 224, 102, 0.9)');
      grad.addColorStop(1, 'rgba(255, 120, 0, 0)');
      sparkCtx.fillStyle = grad;
      sparkCtx.fillRect(0, 0, 16, 16);
    }
    const sparkTexture = new THREE.CanvasTexture(sparkCanvas);

    const sparkMat = new THREE.PointsMaterial({
      map: sparkTexture,
      vertexColors: true,
      size: 1.8,
      transparent: true,
      opacity: 1,
      depthWrite: false, // Must be false so sparks never occlude translucent materials (such as Ghost X-Ray mode)
      blending: THREE.AdditiveBlending, // Additive: sparks add light, and fading a vertex colour to black fades the spark out
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    sparkPoints.userData = {
      vel: new Float32Array(sparkCount * 3),
      life: new Float32Array(sparkCount),
      maxLife: new Float32Array(sparkCount).fill(1),
    };
    sparkPoints.frustumCulled = false;
    sparkPoints.visible = false;
    scene.add(sparkPoints);
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
      let glided = false;
      if (state.mode === 'add_seam' && state.manualStartPoint && !isCameraTransitioning.current) {
        const mx = mouseRef.current.x; // [-1, 1]
        const my = mouseRef.current.y; // [-1, 1], +1 top, -1 bottom
        const glideSpeed = 1.6;

        // Downward panning when cursor approaches bottom margin (my < -0.62)
        if (my < -0.62) {
          const factor = Math.min(1.0, (-0.62 - my) / 0.32);
          controls.target.y -= glideSpeed * factor;
          camera.position.y -= glideSpeed * factor;
          glided = true;
        } else if (my > 0.62) {
          // Upward panning when cursor approaches top margin (my > 0.62)
          const factor = Math.min(1.0, (my - 0.62) / 0.32);
          controls.target.y += glideSpeed * factor;
          camera.position.y += glideSpeed * factor;
          glided = true;
        }

        // Horizontal panning relative to camera orientation
        if (mx < -0.72) {
          const factor = Math.min(1.0, (-0.72 - mx) / 0.22);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          right.y = 0;
          if (right.lengthSq() > 0.001) right.normalize();
          controls.target.addScaledVector(right, -glideSpeed * factor);
          camera.position.addScaledVector(right, -glideSpeed * factor);
          glided = true;
        } else if (mx > 0.72) {
          const factor = Math.min(1.0, (mx - 0.72) / 0.22);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          right.y = 0;
          if (right.lengthSq() > 0.001) right.normalize();
          controls.target.addScaledVector(right, glideSpeed * factor);
          camera.position.addScaledVector(right, glideSpeed * factor);
          glided = true;
        }
      }

      // three-stdlib types update() as void, but it returns true while the camera is still moving (orbit or damping)
      const controlsMoved = controls.update() as unknown as boolean;
      heatClock.value = performance.now() / 1000;
      if (
        controlsMoved ||
        glided ||
        isCameraTransitioning.current ||
        state.isSimulating ||
        performance.now() < renderUntilRef.current ||
        performance.now() < hotUntilRef.current
      ) {
        renderer.render(scene, camera);
      }
    };
    invalidate();
    const unsubscribeStore = useWeldStore.subscribe(invalidate);
    controls.addEventListener('change', invalidate);
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      invalidate();
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver tracks container width changes in real time as sidebars collapse/expand
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      unsubscribeStore();
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
      invalidate();
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

      applyHazTint(material, hazUniformsRef.current);
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

      // Facet wireframe: every edge between triangles that are not coplanar (1° threshold).
      // STL files triangulate flat faces arbitrarily, so a raw WireframeGeometry draws meaningless
      // diagonals across flat plates; this keeps true facets (cylinders, chamfers) and leaves flat faces clean.
      const wireframeGeom = new THREE.EdgesGeometry(geometry, 1);
      // Light blue and drawn over everything (hidden edges included), like a CAD wireframe view,
      // so it reads clearly against the green part and in ghost mode
      const wireframeMat = new THREE.LineBasicMaterial({
        color: '#7DD3FC',
        opacity: 0.85,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
      wireframe.renderOrder = 5;
      wireframe.visible = showWireframe;
      modelGroup.add(wireframe);
      wireframeRef.current = wireframe;

      const boxHelper = new THREE.BoxHelper(mesh, new THREE.Color('#e97f01'));
      boxHelper.visible = showBoundingBox;
      modelGroup.add(boxHelper);
      boundingBoxRef.current = boxHelper;

      setPart({
        name: activeModelName,
        integrity: analyzeMeshIntegrity(geometry),
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
        // Soft off-white ghost outline: recedes behind seams (orange) and approach vectors (blue)
        const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
        edgeMat.color.set('#F6F5EE');
        edgeMat.transparent = true;
        edgeMat.opacity = 0.55;
        edgeMat.needsUpdate = true;
        edgesRef.current.visible = true;
      }
    } else {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.depthWrite = true;
      mat.needsUpdate = true;
      if (edgesRef.current) {
        const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
        edgeMat.color.set('#243523');
        edgeMat.transparent = false;
        edgeMat.opacity = 1;
        edgeMat.needsUpdate = true;
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
      let cylinderGeom: THREE.BufferGeometry = new THREE.CylinderGeometry(beadRadius, beadRadius, length, 16);
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
        // Welded: rippled "stack of dimes" bead that keeps cooling from when it was deposited
        cylinderGeom.dispose();
        cylinderGeom = createRippledBeadGeometry(
          length,
          2.1 * wireScale,
          ripplePitchMm(seam.parameters.travelSpeed),
          beadCrownAngle(p1, p2, normal)
        );
        const timing = weldTimesRef.current.get(seam.id);
        cylinderMat = createHotBeadMaterial(timing ? timing.start : -1e6, timing ? timing.speed : 1);
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

  // Heat-affected zone: every welded seam leaves temper colours on the plate around it
  useEffect(() => {
    // Each segment carries the time it finished heating; without timing (welded long ago) it is already cold
    const segs: Array<[THREE.Vector3, THREE.Vector3, number]> = seams
      .filter((sm) => completedSeamIds.includes(sm.id) && !sm.hasAirGap)
      .map((sm) => {
        const timing = weldTimesRef.current.get(sm.id);
        const endTime = timing ? timing.start + sm.length / timing.speed : -1e6;
        return [
          new THREE.Vector3(sm.startPoint.x, sm.startPoint.y, sm.startPoint.z),
          new THREE.Vector3(sm.endPoint.x, sm.endPoint.y, sm.endPoint.z),
          endTime,
        ];
      });
    setHazSegments(hazUniformsRef.current, segs);
    hazBaseCountRef.current = hazUniformsRef.current.uHazCount.value;
    if (completedSeamIds.length === 0) weldTimesRef.current.clear();
    invalidate();
  }, [seams, completedSeamIds]);

  // Camera and simulation hotkeys (always on, ignored while typing in a field):
  //   Arrows: orbit in 15° steps (keeps any anchored seam point)   + / -: zoom
  //   F: frame the selected seam   Home: reset to ISO view   Space: play / pause simulation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (isTypingTarget(el)) return;
      if (useWeldStore.getState().shortcutsOpen) return;
      const cam = cameraRef.current;
      const ctr = controlsRef.current;
      if (!cam || !ctr) return;

      const glideTo = (pos: THREE.Vector3, target: THREE.Vector3) => {
        targetCameraPos.current = pos;
        targetControlsTarget.current = target;
        isCameraTransitioning.current = true;
        invalidate();
      };
      const currentGoal = () =>
        isCameraTransitioning.current && targetCameraPos.current ? targetCameraPos.current.clone() : cam.position.clone();
      const currentTarget = () =>
        isCameraTransitioning.current && targetControlsTarget.current ? targetControlsTarget.current.clone() : ctr.target.clone();

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (isSliderFocused(el)) return; // a focused slider uses its own arrow keys
        e.preventDefault();
        const target = currentTarget();
        const sph = new THREE.Spherical().setFromVector3(currentGoal().sub(target));
        const step = THREE.MathUtils.degToRad(15);
        if (e.key === 'ArrowLeft') sph.theta -= step;
        if (e.key === 'ArrowRight') sph.theta += step;
        if (e.key === 'ArrowUp') sph.phi -= step;
        if (e.key === 'ArrowDown') sph.phi += step;
        sph.phi = THREE.MathUtils.clamp(sph.phi, 0.05, ctr.maxPolarAngle);
        useWeldStore.getState().setActiveView(null);
        glideTo(target.clone().add(new THREE.Vector3().setFromSpherical(sph)), target);
        return;
      }

      if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_') {
        e.preventDefault();
        const target = currentTarget();
        const offset = currentGoal().sub(target);
        const factor = e.key === '-' || e.key === '_' ? 1.2 : 1 / 1.2;
        const dist = THREE.MathUtils.clamp(offset.length() * factor, ctr.minDistance, ctr.maxDistance);
        glideTo(target.clone().add(offset.setLength(dist)), target);
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        const st = useWeldStore.getState();
        const sel = st.seams.find((sm) => sm.id === st.selectedSeamId);
        if (sel) {
          e.preventDefault();
          useWeldStore.getState().setActiveView(null);
          focusOnSeam(sel);
          invalidate();
        }
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        useWeldStore.getState().setViewPreset('iso');
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        // Let a focused button keep its native Space behaviour
        if (el && el.tagName === 'BUTTON') return;
        const st = useWeldStore.getState();
        if (st.seams.length === 0) return;
        e.preventDefault();
        if (st.isSimulating) st.pauseSimulation();
        else st.startSimulation(st.selectedSeamId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      if (puddleLightRef.current) puddleLightRef.current.intensity = 0;
      if (arcGlowRef.current) arcGlowRef.current.visible = false;
      arcAudio.silence();
      if (arcSparksRef.current) {
        arcSparksRef.current.visible = false;
        (arcSparksRef.current.userData.life as Float32Array).fill(0);
      }
      return;
    }

    const torch = torchRef.current;
    const arcLight = arcLightRef.current;
    const dynamicGroup = dynamicBeadGroupRef.current;
    dynamicGroup.clear();
    torch.visible = true;

    // Active bead: full rippled seam geometry whose material reveals metal as it is deposited
    // (fragments ahead of the torch are discarded) and glows hot behind the arc.
    let activeBead: THREE.Mesh | null = null;
    const removeActiveBead = () => {
      if (!activeBead) return;
      dynamicGroup.remove(activeBead);
      activeBead.geometry.dispose();
      (activeBead.material as THREE.Material).dispose();
      activeBead = null;
    };
    const startActiveBead = (sm: WeldSeam, a: THREE.Vector3, b: THREE.Vector3, n: THREE.Vector3, weldSeconds: number) => {
      removeActiveBead();
      const startSec = performance.now() / 1000;
      const speed = sm.length / Math.max(0.001, weldSeconds);
      weldTimesRef.current.set(sm.id, { start: startSec, speed });
      const wScale = (sm.parameters.wireDiameter ?? 1.2) / 1.2;
      const len = a.distanceTo(b);
      const geom = createRippledBeadGeometry(len, 2.1 * wScale, ripplePitchMm(sm.parameters.travelSpeed), beadCrownAngle(a, b, n));
      activeBead = new THREE.Mesh(geom, createHotBeadMaterial(startSec, speed));
      activeBead.position.copy(a);
      activeBead.lookAt(b);
      dynamicGroup.add(activeBead);
    };

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
    let phase: 'approach' | 'welding' | 'retract' | 'traverse' | 'bow' = 'approach';
    let progress = 0;
    let lastTime = performance.now();
    let currentReportedPhase = '';

    const updatePhase = (newPhase: 'approach' | 'welding' | 'retract' | 'rapid_traverse' | 'dry_run') => {
      if (currentReportedPhase !== newPhase) {
        currentReportedPhase = newPhase;
        useWeldStore.getState().setSimPhase(newPhase);
      }
    };

    // Run-all mode never welds non-manufacturable (air-gap) seams: they are skipped, and the HUD says so.
    // A targeted single-seam run of an air-gap seam becomes an arc-off dry run instead (see welding phase).
    const skippedNames: string[] = [];
    const nextWeldableIndex = (from: number) => {
      let i = from;
      while (i < seams.length && seams[i].hasAirGap) {
        skippedNames.push(seams[i].name || `Seam ${i + 1}`);
        i++;
      }
      return i;
    };
    const publishSkipNotice = () => {
      if (skippedNames.length === 0) return;
      const list = skippedNames.length > 2 ? `${skippedNames.length} seams` : skippedNames.join(', ');
      useWeldStore.getState().setSimNotice(`Skipped ${list}: air gap, not manufacturable`);
    };

    if (!targetSeamId) {
      currentSeamIdx = nextWeldableIndex(currentSeamIdx);
      publishSkipNotice();
      if (currentSeamIdx >= seams.length) {
        useWeldStore.getState().pauseSimulation();
        return;
      }
    }
    let nextSeamIdx = currentSeamIdx + 1;

    updatePhase('approach');
    useWeldStore.getState().setSimCurrentSeamIndex(currentSeamIdx);

    // Easter egg: a seam named "... pink ..." gives the torch body a pink finish while it works that seam.
    // The arc, sparks and bead stay realistic so the actual weld is never misrepresented.
    const PINK = new THREE.Color('#FF6FB5');
    let torchIsPink: boolean | null = null; // null forces a reset on the first frame of every run
    const setTorchPink = (on: boolean) => {
      if (on === torchIsPink) return;
      torchIsPink = on;
      torch.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || mesh.name === 'torch_wire') return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat?.color) return;
        if (!mat.userData.baseColor) mat.userData.baseColor = mat.color.clone();
        mat.color.copy(mat.userData.baseColor as THREE.Color);
        if (on) mat.color.lerp(PINK, 0.6);
      });
    };

    // Arc state, written by the welding phase and consumed by tickArc once per frame
    const arcPos = new THREE.Vector3();
    const arcAxis = new THREE.Vector3(0, 1, 0);
    let arcEmitting = false;
    let arcProcess: string = 'MIG';
    let arcWireScale = 1;
    let arcCurrent = 180;
    let arcBacon = false;
    let arcFlavor: 'sparky' | 'pink' | null = null;
    let arcLevel = 0; // smoothed 0..1: ramps up on arc strike, fades on crater fill / retract
    const puddleLight = puddleLightRef.current;
    const arcGlow = arcGlowRef.current;
    const sparks = arcSparksRef.current;
    const SPARK_GRAVITY = 420; // mm/s² (scaled for the mm-unit scene and sim playback)
    const sparkDir = new THREE.Vector3();

    const tickArc = (dt: number, now: number) => {
      arcLevel = THREE.MathUtils.lerp(arcLevel, arcEmitting ? 1 : 0, arcEmitting ? 0.3 : 0.18);
      arcAudio.update(arcLevel, arcProcess, arcCurrent, useWeldStore.getState().soundEnabled, arcBacon);
      const t = now / 1000;
      // Layered low-frequency flicker instead of per-frame random strobing
      const flicker = 0.82 + 0.1 * Math.sin(t * 41) + 0.05 * Math.sin(t * 113 + 1.7) + 0.05 * Math.random();
      const tint =
        arcProcess === 'TIG' ? '#BFDDFF' : arcProcess === 'LASER' ? '#FFF2E0' : '#DCEEFF';

      if (arcLight) {
        arcLight.color.set(tint);
        arcLight.intensity = 60 * arcLevel * flicker;
      }
      if (puddleLight) puddleLight.intensity = 22 * arcLevel * (0.92 + 0.08 * Math.sin(t * 9));
      if (arcGlow) {
        arcGlow.visible = arcLevel > 0.02;
        const gm = arcGlow.material as THREE.SpriteMaterial;
        gm.color.set(tint);
        gm.opacity = 0.9 * arcLevel * flicker;
        arcGlow.scale.setScalar((9 + 6 * flicker) * Math.max(0.75, arcWireScale));
      }

      if (sparks) {
        const vel = sparks.userData.vel as Float32Array;
        const life = sparks.userData.life as Float32Array;
        const maxLife = sparks.userData.maxLife as Float32Array;
        const posArr = (sparks.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
        const colArr = (sparks.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;
        // MIG throws the most spatter, laser some, TIG almost none
        const baseRate = arcProcess === 'TIG' ? 12 : arcProcess === 'LASER' ? 90 : 240;
        const rate = arcFlavor === 'sparky' ? Math.max(baseRate, 240) * 3 : baseRate;
        let budget = arcEmitting ? Math.round(dt * rate + Math.random()) : 0;
        let alive = 0;

        for (let i = 0; i < life.length; i++) {
          const i3 = i * 3;
          if (life[i] <= 0) {
            if (budget <= 0) {
              colArr[i3] = colArr[i3 + 1] = colArr[i3 + 2] = 0;
              continue;
            }
            budget--;
            sparkDir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            sparkDir.addScaledVector(arcAxis, 1.2).normalize();
            const speed = (70 + Math.random() * 140) * (arcFlavor === 'sparky' ? 1.5 : 1);
            vel[i3] = sparkDir.x * speed;
            vel[i3 + 1] = sparkDir.y * speed;
            vel[i3 + 2] = sparkDir.z * speed;
            posArr[i3] = arcPos.x;
            posArr[i3 + 1] = arcPos.y;
            posArr[i3 + 2] = arcPos.z;
            maxLife[i] = life[i] = 0.25 + Math.random() * 0.45;
          }

          life[i] -= dt;
          vel[i3 + 1] -= SPARK_GRAVITY * dt;
          posArr[i3] += vel[i3] * dt;
          posArr[i3 + 1] += vel[i3 + 1] * dt;
          posArr[i3 + 2] += vel[i3 + 2] * dt;

          // Cooling: white-yellow when fresh, dull orange as it dies, fading to black (invisible under additive blending)
          const f = Math.max(0, life[i] / maxLife[i]);
          colArr[i3] = f;
          colArr[i3 + 1] = (0.45 + 0.5 * f) * f;
          colArr[i3 + 2] = (0.1 + 0.6 * f * f) * f;
          alive++;
        }

        sparks.geometry.getAttribute('position').needsUpdate = true;
        sparks.geometry.getAttribute('color').needsUpdate = true;
        sparks.visible = alive > 0;
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      arcEmitting = false;

      const seam = seams[currentSeamIdx];
      if (!seam) {
        useWeldStore.getState().pauseSimulation();
        return;
      }

      setTorchPink(/\bpink\b/i.test(seam.name || ''));

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
        moltenPuddleMesh.visible = false;
        updatePhase('approach');

        if (progress >= 1) {
          progress = 0;
          phase = 'welding';
          if (!seam.hasAirGap) startActiveBead(seam, pStart, pEnd, normal, weldDuration);
          // Easter egg: a dry run over open air gets a deadpan remark
          if (seam.hasAirGap) {
            const quips = [
              'Welding thin air. Bold strategy.',
              'We’re just doing anything now, huh.',
              'The arc has questions.',
              'That’s not a joint, that’s a vibe.',
            ];
            useWeldStore.getState().showFunToast(quips[Math.floor(Math.random() * quips.length)]);
          }
          // Easter egg: MIG really does sound like frying bacon
          if (!seam.hasAirGap) {
            const nm = seam.name || '';
            if (/\bbacon\b/i.test(nm)) useWeldStore.getState().showFunToast('Smells about right.');
            else if (/\bsparky\b/i.test(nm)) useWeldStore.getState().showFunToast('Living up to the name.');
            else if (/\bpink\b/i.test(nm)) useWeldStore.getState().showFunToast('Pretty in pink, strong as steel.');
          }
        }
      } else if (phase === 'welding') {
        progress += dt / weldDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pStart, pEnd, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(effectiveTorchAxis);

        if (seam.hasAirGap) {
          // Dry run: trace the path with the arc OFF. No bead, no pool, no spatter, never marked as welded.
          moltenPuddleMesh.visible = false;
          updatePhase('dry_run');
        } else {
          // Heat-affected zone grows with the deposited length
          const haz = hazUniformsRef.current;
          const slot = Math.min(hazBaseCountRef.current, haz.uHazA.value.length - 1);
          haz.uHazA.value[slot].copy(pStart);
          haz.uHazB.value[slot].copy(currentPos);
          haz.uHazT.value[slot] = performance.now() / 1000; // still being heated
          haz.uHazCount.value = slot + 1;
          // Keep drawing until both the bead glow and the temper tint have faded
          hotUntilRef.current = performance.now() + (Math.max(4 * BEAD_COOL_TAU, HAZ_FADE_END_SEC) + 0.5) * 1000;

          // Active glowing molten puddle at contact point (scaled dynamically to wire diameter)
          moltenPuddleMesh.scale.setScalar(wireScale);
          moltenPuddleMesh.visible = true;
          moltenPuddleMesh.position.copy(currentPos);

          arcEmitting = true;
          arcPos.copy(currentPos);
          arcAxis.copy(effectiveTorchAxis);
          arcProcess = seam.parameters.process;
          arcWireScale = wireScale;
          arcCurrent = seam.parameters.current;
          arcBacon = /\bbacon\b/i.test(seam.name || '');
          arcFlavor = /\bsparky\b/i.test(seam.name || '') ? 'sparky' : /\bpink\b/i.test(seam.name || '') ? 'pink' : null;
          updatePhase('welding');
        }

        if (progress >= 1) {
          if (!seam.hasAirGap) useWeldStore.getState().markSeamCompleted(seam.id);
          moltenPuddleMesh.visible = false;
          progress = 0;
          phase = 'retract';
        }
      } else if (phase === 'retract') {
        progress += dt / retractDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pEnd, pRetract, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(effectiveTorchAxis);
        moltenPuddleMesh.visible = false;
        updatePhase('retract');

        if (progress >= 1) {
          progress = 0;
          removeActiveBead();
          if (targetSeamId) {
            // Targeted single-seam preview complete! Retract cleanly and stop.
            useWeldStore.getState().pauseSimulation();
            return;
          }
          nextSeamIdx = nextWeldableIndex(currentSeamIdx + 1);
          publishSkipNotice();
          if (nextSeamIdx < seams.length) {
            phase = 'traverse';
          } else {
            // Easter egg: after a perfect Run All (every seam welded, nothing skipped) the torch takes a bow
            const done = useWeldStore.getState().completedSeamIds;
            const perfect = skippedNames.length === 0 && seams.every((sm) => done.includes(sm.id));
            if (perfect) {
              phase = 'bow';
            } else {
              useWeldStore.getState().pauseSimulation();
              return;
            }
          }
        }
      } else if (phase === 'bow') {
        // A small, polite nod at the retract point: dip forward and come back up
        progress += dt / 1.1;
        torch.position.copy(pRetract);
        safeQuaternion(effectiveTorchAxis);
        torch.rotateX(Math.sin(Math.min(1, progress) * Math.PI) * 0.45);
        if (progress >= 1) {
          safeQuaternion(effectiveTorchAxis);
          useWeldStore.getState().pauseSimulation();
          return;
        }
      } else if (phase === 'traverse') {
        progress += dt / traverseDuration;
        const nextSeam = seams[nextSeamIdx];
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
        moltenPuddleMesh.visible = false;
        updatePhase('rapid_traverse');

        if (progress >= 1) {
          progress = 0;
          currentSeamIdx = nextSeamIdx;
          useWeldStore.getState().setSimCurrentSeamIndex(currentSeamIdx);
          phase = 'approach';
        }
      }

      tickArc(dt, now);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (arcLightRef.current) arcLightRef.current.intensity = 0;
      if (puddleLightRef.current) puddleLightRef.current.intensity = 0;
      if (arcGlowRef.current) arcGlowRef.current.visible = false;
      arcAudio.silence();
      if (arcSparksRef.current) {
        arcSparksRef.current.visible = false;
        (arcSparksRef.current.userData.life as Float32Array).fill(0);
      }
    };
  }, [isSimulating, seams, playbackSpeed]);

  // Pointer Movement & Raycast Snapping
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    invalidate();
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
    // Clicking the 3D view hands keyboard focus back to it (like CAD tools), so a slider or field
    // touched earlier no longer captures hotkeys
    const focused = document.activeElement as HTMLElement | null;
    if (focused && focused !== document.body) focused.blur();
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

      <ViewportOverlays
        isRightCollapsed={isRightCollapsed}
        onExpandRight={onExpandRight}
        focusOnSeam={focusOnSeam}
        isCoordsVisible={isCoordsVisible}
        displayCoords={displayCoords}
        displayDist={displayDist}
        liveAirGap={liveAirGap}
        measuredDist={measuredDist}
        activeSnapType={activeSnapType}
      />
    </div>
  );
};
