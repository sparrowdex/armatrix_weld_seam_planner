'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D, WeldSeam } from '@/types/weld';

export const ViewportCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Store bindings
  const {
    mode,
    showWireframe,
    showNormals,
    showBoundingBox,
    showWaypoints,
    viewPreset,
    setViewPreset,
    activeModelName,
    manualStartPoint,
    setManualStartPoint,
    setManualCandidatePoint,
    addSeam,
    seams,
    selectedSeamId,
    selectSeam,
    isSimulating,
    playbackSpeed,
    setPart,
    setPartLoading,
  } = useWeldStore();

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const boundingBoxRef = useRef<THREE.BoxHelper | null>(null);
  const seamsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const previewSeamRef = useRef<THREE.Group>(new THREE.Group());
  const torchRef = useRef<THREE.Group | null>(null);
  const arcLightRef = useRef<THREE.PointLight | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Cursor coordinates display
  const [cursorPos, setCursorPos] = useState<Vector3D | null>(null);

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0F130F'); // Tactical Armatrix dark charcoal
    sceneRef.current = scene;

    // Grid floor & axes
    const grid = new THREE.GridHelper(300, 30, '#2A3626', '#1A2218');
    grid.position.y = -0.5;
    scene.add(grid);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(160, 140, 180);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 1200;
    controls.minDistance = 20;
    controls.target.set(0, 20, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight('#E8EFE5', 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#FFFFFF', 1.8);
    keyLight.position.set(120, 200, 150);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#FF7700', 0.6); // Armatrix orange fill
    fillLight.position.set(-150, 80, -120);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#77AA77', 0.8); // Olive rim
    rimLight.position.set(0, -100, 100);
    scene.add(rimLight);

    // Groups
    scene.add(seamsGroupRef.current);
    scene.add(previewSeamRef.current);

    // 6. Build Welding Torch 3D Model
    const torchGroup = new THREE.Group();
    // Body (dark graphite)
    const torchBodyGeom = new THREE.CylinderGeometry(4, 4, 35, 16);
    const torchBodyMat = new THREE.MeshStandardMaterial({ color: '#1B1E1B', metalness: 0.9, roughness: 0.3 });
    const torchBody = new THREE.Mesh(torchBodyGeom, torchBodyMat);
    torchBody.position.y = 25;
    torchGroup.add(torchBody);

    // Red Collar (Armatrix welding tool accent)
    const collarGeom = new THREE.CylinderGeometry(4.5, 4.5, 8, 16);
    const collarMat = new THREE.MeshStandardMaterial({ color: '#D92626', metalness: 0.5, roughness: 0.3 });
    const collar = new THREE.Mesh(collarGeom, collarMat);
    collar.position.y = 12;
    torchGroup.add(collar);

    // Copper Nozzle
    const nozzleGeom = new THREE.ConeGeometry(3.5, 12, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: '#B87333', metalness: 0.95, roughness: 0.15 });
    const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.y = 2;
    torchGroup.add(nozzle);

    // Arc flash light at tip
    const arcLight = new THREE.PointLight('#38BDF8', 0, 50);
    arcLight.position.set(0, 0, 0);
    torchGroup.add(arcLight);
    arcLightRef.current = arcLight;

    torchGroup.visible = false;
    scene.add(torchGroup);
    torchRef.current = torchGroup;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
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
    };
  }, []);

  // Handle Preset Views
  useEffect(() => {
    if (!viewPreset || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (viewPreset) {
      case 'iso':
        camera.position.set(160, 140, 180);
        controls.target.set(0, 20, 0);
        break;
      case 'top':
        camera.position.set(0, 250, 0);
        controls.target.set(0, 0, 0);
        break;
      case 'front':
        camera.position.set(0, 20, 250);
        controls.target.set(0, 20, 0);
        break;
      case 'right':
        camera.position.set(250, 20, 0);
        controls.target.set(0, 20, 0);
        break;
    }
    controls.update();
    setViewPreset(null);
  }, [viewPreset, setViewPreset]);

  // Load STL Model whenever activeModelName changes or on mount
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setPartLoading(true);

    let modelUrl = `/models/bracket.stl`;
    if (activeModelName === 'Pipe T-Joint') modelUrl = `/models/pipe_joint.stl`;
    if (activeModelName === 'Box Flange') modelUrl = `/models/box_flange.stl`;

    const loader = new STLLoader();
    loader.load(
      modelUrl,
      (geometry) => {
        // Remove existing mesh
        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
        }
        if (wireframeRef.current) {
          scene.remove(wireframeRef.current);
          wireframeRef.current.geometry.dispose();
        }
        if (boundingBoxRef.current) {
          scene.remove(boundingBoxRef.current);
        }

        // Center geometry and align to floor
        geometry.computeVertexNormals();
        geometry.center();
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const minY = bbox.min.y;
        geometry.translate(0, -minY, 0); // Put on ground grid

        // Update bbox after translation
        geometry.computeBoundingBox();
        const finalBox = geometry.boundingBox!;
        const width = parseFloat((finalBox.max.x - finalBox.min.x).toFixed(1));
        const height = parseFloat((finalBox.max.y - finalBox.min.y).toFixed(1));
        const depth = parseFloat((finalBox.max.z - finalBox.min.z).toFixed(1));

        // Industrial Machined Steel PBR Material
        const material = new THREE.MeshStandardMaterial({
          color: '#343E34', // Armatrix dark industrial steel-green
          metalness: 0.85,
          roughness: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshRef.current = mesh;

        // Wireframe edges overlay
        const wireframeGeom = new THREE.WireframeGeometry(geometry);
        const wireframeMat = new THREE.LineBasicMaterial({ color: '#556655', opacity: 0.25, transparent: true });
        const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
        wireframe.visible = showWireframe;
        scene.add(wireframe);
        wireframeRef.current = wireframe;

        // Bounding Box
        const boxHelper = new THREE.BoxHelper(mesh, new THREE.Color('#FF5B00'));
        boxHelper.visible = showBoundingBox;
        scene.add(boxHelper);
        boundingBoxRef.current = boxHelper;

        // Update Store
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

        // Adjust camera target
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

  // Render Weld Seams in 3D
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

      // 1. Weld Bead Cylinder
      const beadRadius = isSelected ? 2.2 : 1.5;
      const cylinderGeom = new THREE.CylinderGeometry(beadRadius, beadRadius, length, 12);
      cylinderGeom.translate(0, length / 2, 0);
      cylinderGeom.rotateX(Math.PI / 2);

      const color = isSelected ? '#FF5B00' : '#22C55E';
      const cylinderMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(isSelected ? '#FF5B00' : '#15803D'),
        emissiveIntensity: isSelected ? 0.7 : 0.3,
        roughness: 0.2,
        metalness: 0.8,
      });

      const beadMesh = new THREE.Mesh(cylinderGeom, cylinderMat);
      beadMesh.position.copy(p1);
      beadMesh.lookAt(p2);
      seamContainer.add(beadMesh);

      // 2. Start & End Spheres
      const startSphere = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 3.0 : 2.2, 12, 12),
        new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0284C7', emissiveIntensity: 0.6 })
      );
      startSphere.position.copy(p1);
      seamContainer.add(startSphere);

      const endSphere = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 3.0 : 2.2, 12, 12),
        new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#B91C1C', emissiveIntensity: 0.6 })
      );
      endSphere.position.copy(p2);
      seamContainer.add(endSphere);

      // 3. Direction Arrow
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const arrowHelper = new THREE.ArrowHelper(dir, mid, Math.min(15, length * 0.4), isSelected ? 0xffffff : 0xffaa00, 4, 3);
      seamContainer.add(arrowHelper);

      // 4. Torch Approach Normal Vector (White/Cyan pin)
      if (showNormals) {
        const normalHelper = new THREE.ArrowHelper(normal, mid, 18, 0x38bdf8, 4, 2.5);
        seamContainer.add(normalHelper);

        // Approach & Retract Waypoint paths
        const appPt = new THREE.Vector3().copy(p1).addScaledVector(normal, seam.parameters.approachDistance);
        const retPt = new THREE.Vector3().copy(p2).addScaledVector(normal, seam.parameters.retractDistance);

        const approachGeom = new THREE.BufferGeometry().setFromPoints([appPt, p1]);
        const retractGeom = new THREE.BufferGeometry().setFromPoints([p2, retPt]);
        const dashedMat = new THREE.LineDashedMaterial({ color: '#93C5FD', dashSize: 2, gapSize: 2 });
        const appLine = new THREE.Line(approachGeom, dashedMat);
        const retLine = new THREE.Line(retractGeom, dashedMat);
        appLine.computeLineDistances();
        retLine.computeLineDistances();
        seamContainer.add(appLine);
        seamContainer.add(retLine);

        // Approach / Retract Spheres
        if (showWaypoints) {
          const appSphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), new THREE.MeshBasicMaterial({ color: '#60A5FA' }));
          appSphere.position.copy(appPt);
          const retSphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), new THREE.MeshBasicMaterial({ color: '#F87171' }));
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

      // Pulsing Start marker
      const startMarker = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#FF5B00', emissive: '#FF5B00', emissiveIntensity: 0.9 })
      );
      startMarker.position.copy(p1);
      group.add(startMarker);

      if (cursorPos) {
        const p2 = new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z);
        const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineBasicMaterial({ color: '#FF7700', linewidth: 3 });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        const endPreview = new THREE.Mesh(
          new THREE.SphereGeometry(2.5, 12, 12),
          new THREE.MeshBasicMaterial({ color: '#EAB308' })
        );
        endPreview.position.copy(p2);
        group.add(endPreview);
      }
    }
  }, [mode, manualStartPoint, cursorPos]);

  // Simulation Animation Runner
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
    let progress = 0; // 0 to 1 in phase
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const seam = seams[currentSeamIdx];
      if (!seam) {
        useWeldStore.getState().pauseSimulation();
        return;
      }

      const pStart = new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z);
      const pEnd = new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z);
      const normal = new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z).normalize();
      const pApproach = new THREE.Vector3().copy(pStart).addScaledVector(normal, seam.parameters.approachDistance);
      const pRetract = new THREE.Vector3().copy(pEnd).addScaledVector(normal, seam.parameters.retractDistance);

      const weldDuration = Math.max(0.5, seam.length / seam.parameters.travelSpeed) / playbackSpeed;
      const approachDuration = 0.8 / playbackSpeed;
      const retractDuration = 0.8 / playbackSpeed;
      const traverseDuration = 1.0 / playbackSpeed;

      if (phase === 'approach') {
        progress += dt / approachDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pApproach, pStart, Math.min(1, progress));
        torch.position.copy(currentPos);
        torch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        if (arcLight) arcLight.intensity = 0;
        useWeldStore.getState().setSimPhase('approach');

        if (progress >= 1) {
          progress = 0;
          phase = 'welding';
        }
      } else if (phase === 'welding') {
        progress += dt / weldDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pStart, pEnd, Math.min(1, progress));
        torch.position.copy(currentPos);
        torch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        // Welding arc flicker
        if (arcLight) {
          arcLight.intensity = 15 + Math.random() * 15;
          arcLight.color.set(Math.random() > 0.3 ? '#38BDF8' : '#FFFFFF');
        }
        useWeldStore.getState().setSimPhase('welding');

        if (progress >= 1) {
          progress = 0;
          phase = 'retract';
        }
      } else if (phase === 'retract') {
        progress += dt / retractDuration;
        const currentPos = new THREE.Vector3().lerpVectors(pEnd, pRetract, Math.min(1, progress));
        torch.position.copy(currentPos);
        torch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        if (arcLight) arcLight.intensity = 0;
        useWeldStore.getState().setSimPhase('retract');

        if (progress >= 1) {
          progress = 0;
          if (currentSeamIdx < seams.length - 1) {
            phase = 'traverse';
          } else {
            // Finished all seams
            useWeldStore.getState().pauseSimulation();
            return;
          }
        }
      } else if (phase === 'traverse') {
        progress += dt / traverseDuration;
        const nextSeam = seams[currentSeamIdx + 1];
        const nextApproach = new THREE.Vector3(nextSeam.startPoint.x, nextSeam.startPoint.y, nextSeam.startPoint.z).addScaledVector(
          new THREE.Vector3(nextSeam.normal.x, nextSeam.normal.y, nextSeam.normal.z).normalize(),
          nextSeam.parameters.approachDistance
        );
        const currentPos = new THREE.Vector3().lerpVectors(pRetract, nextApproach, Math.min(1, progress));
        torch.position.copy(currentPos);
        useWeldStore.getState().setSimPhase('rapid_traverse');

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

  // Mouse Move & Click Handling for 3D Interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !meshRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
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

      if (mode === 'add_seam') {
        setManualCandidatePoint(hitCoord, { x: n.x, y: n.y, z: n.z });
      }
    } else {
      setCursorPos(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary left click
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
      // Set start point
      setManualStartPoint(pt, norm);
    } else {
      // Set end point and create seam!
      addSeam(manualStartPoint, pt, norm, 'manual');
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      className="relative w-full h-full cursor-crosshair select-none overflow-hidden bg-[#0D100D]"
    >
      {/* 3D Telemetry HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5 font-mono text-xs">
        <div className="flex items-center gap-2 bg-[#141A14]/80 backdrop-blur-md px-3 py-1.5 border border-[#263322] rounded text-[#E2E8F0]">
          <span className="w-2 h-2 rounded-full bg-[#FF5B00] animate-pulse" />
          <span className="text-[#A0AEC0]">ACTIVE MODEL:</span>
          <span className="font-semibold text-white">{activeModelName}</span>
        </div>
        {cursorPos && (
          <div className="bg-[#141A14]/80 backdrop-blur-md px-3 py-1.5 border border-[#263322] rounded text-[#A0AEC0] flex gap-3">
            <span>X: <strong className="text-white">{cursorPos.x}</strong></span>
            <span>Y: <strong className="text-white">{cursorPos.y}</strong></span>
            <span>Z: <strong className="text-white">{cursorPos.z}</strong></span>
          </div>
        )}
      </div>

      {/* Mode Instruction Banner */}
      {mode === 'add_seam' && (
        <div className="absolute top-4 right-4 z-10 bg-[#FF5B00]/90 text-white font-mono text-xs px-4 py-2 rounded shadow-lg backdrop-blur flex items-center gap-2 animate-bounce">
          <span>{manualStartPoint ? 'CLICK 2ND POINT TO COMPLETE SEAM' : 'CLICK ON MESH TO SET WELD START POINT'}</span>
        </div>
      )}
    </div>
  );
};
