'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D } from '@/types/weld';

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
  const setPart = useWeldStore((s) => s.setPart);
  const setPartLoading = useWeldStore((s) => s.setPartLoading);

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const edgesRef = useRef<THREE.LineSegments | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const boundingBoxRef = useRef<THREE.BoxHelper | null>(null);
  const seamsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const previewSeamRef = useRef<THREE.Group>(new THREE.Group());
  const reticleRef = useRef<THREE.Group>(new THREE.Group());
  const torchRef = useRef<THREE.Group | null>(null);
  const arcLightRef = useRef<THREE.PointLight | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Cursor coordinates display
  const [cursorPos, setCursorPos] = useState<Vector3D | null>(null);
  const [measuredDist, setMeasuredDist] = useState<number | null>(null);

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

    // 5. Omni-Directional CAD Studio Lighting
    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#4A5D4A', 2.0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight('#FFFFFF', 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.2);
    keyLight.position.set(150, 250, 180);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight1 = new THREE.DirectionalLight('#E2E8F0', 1.8);
    fillLight1.position.set(-160, 180, 140);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight('#CBD5E1', 1.6);
    fillLight2.position.set(140, 160, -160);
    scene.add(fillLight2);

    const rimLight = new THREE.DirectionalLight('#e97f01', 1.4);
    rimLight.position.set(-150, 140, -180);
    scene.add(rimLight);

    // Groups
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

    // 7. Robotic Welding Torch 3D Model
    const torchGroup = new THREE.Group();
    const torchBodyGeom = new THREE.CylinderGeometry(4.2, 4.2, 36, 20);
    const torchBodyMat = new THREE.MeshStandardMaterial({ color: '#1B1E1B', metalness: 0.85, roughness: 0.25 });
    const torchBody = new THREE.Mesh(torchBodyGeom, torchBodyMat);
    torchBody.position.y = 26;
    torchGroup.add(torchBody);

    const collarGeom = new THREE.CylinderGeometry(4.8, 4.8, 8, 20);
    const collarMat = new THREE.MeshStandardMaterial({ color: '#e97f01', metalness: 0.7, roughness: 0.2 });
    const collar = new THREE.Mesh(collarGeom, collarMat);
    collar.position.y = 13;
    torchGroup.add(collar);

    const nozzleGeom = new THREE.ConeGeometry(3.6, 12, 20);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: '#C87D40', metalness: 0.95, roughness: 0.15 });
    const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.y = 2;
    torchGroup.add(nozzle);

    const arcLight = new THREE.PointLight('#38BDF8', 0, 75);
    arcLight.position.set(0, 0, 0);
    torchGroup.add(arcLight);
    arcLightRef.current = arcLight;

    torchGroup.visible = false;
    scene.add(torchGroup);
    torchRef.current = torchGroup;

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

    let modelUrl = `/models/bracket.stl`;
    if (activeModelName === 'Pipe T-Joint') modelUrl = `/models/pipe_joint.stl`;
    if (activeModelName === 'Box Flange') modelUrl = `/models/box_flange.stl`;
    if (activeModelName === 'Armatrix Emblem') modelUrl = `/models/armatrix_emblem.stl`;

    const loader = new STLLoader();
    loader.load(
      modelUrl,
      (geometry) => {
        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
        }
        if (edgesRef.current) {
          scene.remove(edgesRef.current);
          edgesRef.current.geometry.dispose();
        }
        if (wireframeRef.current) {
          scene.remove(wireframeRef.current);
          wireframeRef.current.geometry.dispose();
        }
        if (boundingBoxRef.current) {
          scene.remove(boundingBoxRef.current);
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

        const material = new THREE.MeshStandardMaterial({
          color: '#B2C2B5',
          metalness: 0.18,
          roughness: 0.45,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshRef.current = mesh;

        const edgeGeometry = new THREE.EdgesGeometry(geometry, 25);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: '#182417', linewidth: 1.5 });
        const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        scene.add(edgeLines);
        edgesRef.current = edgeLines;

        const wireframeGeom = new THREE.WireframeGeometry(geometry);
        const wireframeMat = new THREE.LineBasicMaterial({ color: '#3A5239', opacity: 0.4, transparent: true });
        const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
        wireframe.visible = showWireframe;
        scene.add(wireframe);
        wireframeRef.current = wireframe;

        const boxHelper = new THREE.BoxHelper(mesh, new THREE.Color('#e97f01'));
        boxHelper.visible = showBoundingBox;
        scene.add(boxHelper);
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
    torch.visible = true;

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
        if (arcLight) {
          arcLight.intensity = 25 + Math.random() * 25;
          arcLight.color.set(Math.random() > 0.3 ? '#38BDF8' : '#FFFFFF');
        }
        updatePhase('welding');

        if (progress >= 1) {
          progress = 0;
          phase = 'retract';
        }
      } else if (phase === 'retract') {
        progress += dt / retractDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pEnd, pRetract, Math.min(1, progress));
        torch.position.copy(currentPos);
        safeQuaternion(normal);
        if (arcLight) arcLight.intensity = 0;
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

      if (manualStartPoint) {
        const dx = hitCoord.x - manualStartPoint.x;
        const dy = hitCoord.y - manualStartPoint.y;
        const dz = hitCoord.z - manualStartPoint.z;
        setMeasuredDist(parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(1)));
      } else {
        setMeasuredDist(null);
      }

      if (mode === 'add_seam') {
        setManualCandidatePoint(hitCoord, { x: n.x, y: n.y, z: n.z });
      }
    } else {
      setCursorPos(null);
      setMeasuredDist(null);
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

      {/* 3D Telemetry HUD Overlay (Sibling to canvas, safe from removeChild) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5 font-mono text-xs">
        <div className="flex items-center gap-2 bg-[#121A12]/90 backdrop-blur-md px-3 py-1.5 border border-[#233321] rounded text-[#E2E8F0] shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#e97f01] animate-pulse" />
          <span className="text-[#8EA28D]">PART:</span>
          <span className="font-semibold text-white tracking-wide">{activeModelName}</span>
        </div>
        {cursorPos && (
          <div className="bg-[#121A12]/90 backdrop-blur-md px-3 py-1.5 border border-[#233321] rounded text-[#8EA28D] flex gap-3 shadow-md">
            <span>X: <strong className="text-white">{cursorPos.x}</strong></span>
            <span>Y: <strong className="text-white">{cursorPos.y}</strong></span>
            <span>Z: <strong className="text-white">{cursorPos.z}</strong></span>
            {measuredDist !== null && (
              <span className="text-[#e97f01]">LENGTH: <strong className="text-white">{measuredDist} mm</strong></span>
            )}
          </div>
        )}
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
