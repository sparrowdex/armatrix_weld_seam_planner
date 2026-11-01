'use client';

import React, { useState } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Target,
  Plus,
  Trash2,
  RotateCw,
  ChevronLeft,
  SlidersHorizontal,
  CheckCircle,
  Pencil,
  Play,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  AlertTriangle,
  Split,
  Undo2,
} from 'lucide-react';
import { STLLoader } from 'three-stdlib';
import { detectCandidateSeams } from '@/utils/seamDetector';
import { minCreaseLengthMm } from '@/utils/partScale';
import { applyPartRotation } from '@/utils/partOrientation';

const RENAME_HINTS = ['bacon', 'sparky', 'pink'];

interface SidebarLeftProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ onToggleCollapse }) => {
  const {
    part,
    mode,
    setMode,
    seams,
    seamHistory,
    selectedSeamId,
    completedSeamIds,
    selectSeam,
    addSeam,
    removeSeam,
    reverseSeamDirection,
    flipSeamNormal,
    renameSeam,
    reorderSeams,
    clearSeams,
    undo,
    optimizeSeamSequence,
    activeModelName,
    customModels,
    startSimulation,
  } = useWeldStore();

  const [showOptimizedToast, setShowOptimizedToast] = useState(false);
  const [detectionToast, setDetectionToast] = useState<string | null>(null);
  const [editingSeamId, setEditingSeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  // Rename hint rotates through a few playful names; each one has a hidden effect in the simulator
  const [hintIndex, setHintIndex] = useState(0);

  // Opens with an empty field so the placeholder hint shows; leaving it empty keeps the current name
  const handleStartRename = (seamId: string, _currentName: string) => {
    setEditingSeamId(seamId);
    setEditingName('');
    setHintIndex((i) => i + 1);
  };

  const handleSaveRename = (seamId: string) => {
    if (editingName.trim()) {
      renameSeam(seamId, editingName.trim());
    }
    setEditingSeamId(null);
  };

  const handleOptimize = () => {
    optimizeSeamSequence();
    setShowOptimizedToast(true);
    setTimeout(() => setShowOptimizedToast(false), 3500);
  };

  const handleAutoDetect = () => {
    clearSeams();

    if (activeModelName === 'Structural L-Bracket') {
      // Geometry (after load centering): plate X −60..60, upright front face Z = −31, base top Y = 14,
      // gussets X −40..−30 and 30..40, gusset foot Z −31..24, gusset top Y = 74.
      // Rule: a seam end that runs into a wall (3-way corner) stops 4 mm short so the 3.2 mm-radius nozzle
      // clears the wall; a free end (plate edge, gusset toe, gusset top) runs the full joint, inset 0.5 mm
      // so the end point stays on metal.
      // 1. Center bay root fillet: walled by both gussets
      addSeam({ x: -26, y: 14, z: -31 }, { x: 26, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Center Root Fillet');
      // 2. Left gusset to base plate: corner end clearance, runs out to the gusset toe
      addSeam({ x: -30, y: 14, z: -27 }, { x: -30, y: 14, z: 23.5 }, { x: 0.707, y: 0.707, z: 0 }, 'detected', 'Left Gusset Base');
      // 3. Left gusset to upright: corner end clearance, runs up to the gusset top
      addSeam({ x: -30, y: 18, z: -31 }, { x: -30, y: 73.5, z: -31 }, { x: 0.707, y: 0, z: 0.707 }, 'detected', 'Left Gusset Vertical');
      // 4. Right gusset to base plate
      addSeam({ x: 30, y: 14, z: -27 }, { x: 30, y: 14, z: 23.5 }, { x: -0.707, y: 0.707, z: 0 }, 'detected', 'Right Gusset Base');
      // 5. Right gusset to upright
      addSeam({ x: 30, y: 18, z: -31 }, { x: 30, y: 73.5, z: -31 }, { x: -0.707, y: 0, z: 0.707 }, 'detected', 'Right Gusset Vertical');
      // 6. Left outer root: from the plate edge to the left gusset's outer face
      addSeam({ x: -59.5, y: 14, z: -31 }, { x: -44, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Left Outer Root');
      // 7. Right outer root: from the right gusset's outer face to the plate edge
      addSeam({ x: 44, y: 14, z: -31 }, { x: 59.5, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Right Outer Root');
    } else if (activeModelName === 'Pipe T-Joint') {
      // 12-segment saddle seam on the true branch-to-header intersection curve.
      // Branch R = 18 mm (vertical axis), header R = 25 mm (axis along X at y = 36).
      // Saddle height: y(θ) = 36 + sqrt(R² − z²), crown y = 61 at x = ±18, valley y = 53.35 at z = ±18.
      // Vertices fall every 30°, exactly on the 24-facet branch mesh edges, so the chords hug the pipe wall.
      // Torch normal per segment = bisector of the branch outward radial and the header outward normal
      // (the fillet's true bisecting angle, which rotates continuously around the saddle).
      const BRANCH_R = 18;
      const HEADER_R = 25;
      const HEADER_Y = 36;
      const SEGMENTS = 12;
      const saddlePoint = (deg: number) => {
        const t = (deg * Math.PI) / 180;
        const x = BRANCH_R * Math.cos(t);
        const z = BRANCH_R * Math.sin(t);
        const y = HEADER_Y + Math.sqrt(HEADER_R * HEADER_R - z * z);
        return { x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) };
      };
      const saddleNormal = (deg: number) => {
        const t = (deg * Math.PI) / 180;
        const z = BRANCH_R * Math.sin(t);
        const y = Math.sqrt(HEADER_R * HEADER_R - z * z);
        const nx = Math.cos(t);
        const ny = y / HEADER_R;
        const nz = Math.sin(t) + z / HEADER_R;
        const len = Math.hypot(nx, ny, nz);
        return { x: +(nx / len).toFixed(3), y: +(ny / len).toFixed(3), z: +(nz / len).toFixed(3) };
      };
      const regionName = (deg: number) => {
        const d = ((deg % 180) + 180) % 180;
        if (d < 30 || d >= 150) return 'Crown';
        if (d >= 60 && d < 120) return 'Valley';
        return 'Flank';
      };
      for (let k = 0; k < SEGMENTS; k++) {
        const a0 = (360 / SEGMENTS) * k;
        const a1 = a0 + 360 / SEGMENTS;
        const mid = (a0 + a1) / 2;
        addSeam(saddlePoint(a0), saddlePoint(a1), saddleNormal(mid), 'detected', `Saddle ${k + 1} ${regionName(mid)} (${a0}°–${a1}°)`);
      }
    } else if (activeModelName === 'Confined Box Flange' || activeModelName === 'Box Flange') {
      // 4 Internal Floor Fillet Seams inside the deep confined ship cell / compartment
      addSeam({ x: -46, y: 14, z: -37 }, { x: 46, y: 14, z: -37 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Back Floor Fillet');
      addSeam({ x: 46, y: 14, z: -37 }, { x: 46, y: 14, z: 37 }, { x: -0.707, y: 0.707, z: 0 }, 'detected', 'Right Floor Fillet');
      addSeam({ x: 46, y: 14, z: 37 }, { x: -46, y: 14, z: 37 }, { x: 0, y: 0.707, z: -0.707 }, 'detected', 'Front Floor Fillet');
      addSeam({ x: -46, y: 14, z: 37 }, { x: -46, y: 14, z: -37 }, { x: 0.707, y: 0.707, z: 0 }, 'detected', 'Left Floor Fillet');
    } else {
      // True Topological Mesh Crease Detection for uploaded custom STLs
      const activeCustom = customModels.find((m) => m.name === activeModelName);
      if (activeCustom) {
        try {
          const loader = new STLLoader();
          const geom = loader.parse(activeCustom.buffer);
          applyPartRotation(geom, useWeldStore.getState().partRotation);
          geom.computeVertexNormals();
          geom.center();
          geom.computeBoundingBox();
          const bbox = geom.boundingBox!;
          geom.translate(0, -bbox.min.y, 0);

          geom.computeBoundingBox();
          const bb = geom.boundingBox!;
          const diag = bb.max.distanceTo(bb.min);
          const candidateSeams = detectCandidateSeams(geom, 35, minCreaseLengthMm(diag));
          if (candidateSeams.length > 0) {
            candidateSeams.slice(0, 24).forEach((cs, i) => {
              addSeam(cs.start, cs.end, cs.normal, 'detected', `Crease ${i + 1}`);
            });
            const found = `Detected ${Math.min(candidateSeams.length, 24)} weld creases.`;
            setDetectionToast(found);
            useWeldStore.getState().showFunToast(found);
            setTimeout(() => setDetectionToast(null), 3500);
            return;
          }
        } catch (e) {
          console.warn('Crease detection failed on this STL:', e);
        }
      }
      const none = 'No weld joints found. Welds sit where two parts meet, so a single solid has none. Use manual click-to-weld to place seams yourself.';
      setDetectionToast(none);
      useWeldStore.getState().showFunToast(none, 'warn');
      setTimeout(() => setDetectionToast(null), 3500);
    }
  };

  const checkGussetClash = (seam: { startPoint: { x: number; y: number; z: number }; endPoint: { x: number; y: number; z: number } }): boolean => {
    if (activeModelName !== 'Structural L-Bracket') return false;
    const minX = Math.min(seam.startPoint.x, seam.endPoint.x);
    const maxX = Math.max(seam.startPoint.x, seam.endPoint.x);
    // Left gusset spans x = -36 to -30; right gusset spans x = 30 to 36
    const crossesLeft = minX < -33 && maxX > -33;
    const crossesRight = minX < 33 && maxX > 33;
    const nearRootY = seam.startPoint.y < 35 && seam.endPoint.y < 35;
    const nearRootZ = Math.abs(seam.startPoint.z - (-31)) < 15 || Math.abs(seam.endPoint.z - (-31)) < 15;
    return (crossesLeft || crossesRight) && nearRootY && nearRootZ;
  };

  const handleSplitAroundGussets = (seamId: string) => {
    removeSeam(seamId);
    // Replaces the colliding continuous pass with 3 collision-free segmented passes with 4mm setback from gussets
    addSeam({ x: -59.5, y: 14, z: -31 }, { x: -44, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Left Outer Root');
    addSeam({ x: -26, y: 14, z: -31 }, { x: 26, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Center Root Fillet');
    addSeam({ x: 44, y: 14, z: -31 }, { x: 59.5, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Right Outer Root');
  };

  const handleFullRootPass = () => {
    clearSeams();
    addSeam(
      { x: -59.5, y: 14, z: -31 },
      { x: 59.5, y: 14, z: -31 },
      { x: 0, y: 0.707, z: 0.707 },
      'detected',
      'Stage 1 Continuous Root (Pre-Gusset)'
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSeams = [...seams];
    const temp = newSeams[index - 1];
    newSeams[index - 1] = newSeams[index];
    newSeams[index] = temp;
    reorderSeams(newSeams);
  };

  const handleMoveDown = (index: number) => {
    if (index === seams.length - 1) return;
    const newSeams = [...seams];
    const temp = newSeams[index + 1];
    newSeams[index + 1] = newSeams[index];
    newSeams[index] = temp;
    reorderSeams(newSeams);
  };

  const totalLength = seams.reduce((acc, s) => acc + s.length, 0).toFixed(1);
  const estArc = seams.reduce((acc, s) => acc + s.length / Math.max(1, s.parameters.travelSpeed), 0).toFixed(1);

  return (
    <aside className="w-80 h-full bg-[#0A0D0A] border-r border-[#182118] flex flex-col z-10 select-none overflow-hidden relative">
      {/* Panel header */}
      <div className="h-11 px-4 border-b border-[#182118] flex items-center justify-between shrink-0">
        <span className="ax-label !text-[#F6F5EE]">Part &amp; Seams</span>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="ax-icon-btn" title="Collapse seams panel" aria-label="Collapse seams panel">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 01 Workpiece: one compact readout line */}
      <div className="px-4 py-3 border-b border-[#182118] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="ax-index">01</span>
            <span className="ax-label">Workpiece</span>
          </div>
          {part?.integrity &&
            (part.integrity.isWatertight ? (
              <span
                className="ax-chip ax-chip-ok"
                title={`Closed surface: every mesh edge is shared by two triangles, so crease detection and air-gap checks are reliable.${
                  part.integrity.nonManifoldEdges > 0
                    ? ` ${part.integrity.nonManifoldEdges} edge(s) are shared by more than two triangles where separate bodies touch, which is normal for a welded assembly.`
                    : ''
                }`}
              >
                Watertight
              </span>
            ) : (
              <span
                className="ax-chip !border-[#F59E0B]/50 !text-[#FBBF24]"
                title={`${part.integrity.openEdges} open edge(s): the surface has holes or gaps. Crease detection and air-gap checks may be unreliable near them. Repair the STL in your CAD tool for best results.`}
              >
                Open mesh
              </span>
            ))}
        </div>
        {part && customModels.some((m) => m.name === activeModelName) && (
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[11px] text-[#7D8F7C]" title="STL has no 'up'. Turn an uploaded part upright if it arrives on its side.">
              Orientation
            </span>
            <div className="flex items-center gap-1 -mr-1.5">
              {(['x', 'z'] as const).map((axis) => (
                <button
                  key={axis}
                  onClick={(e) => {
                    const dir = e.shiftKey ? -1 : 1;
                    const hadSeams = useWeldStore.getState().seams.length > 0;
                    useWeldStore.getState().rotatePart(axis, dir);
                    // Only explain when something was actually cleared
                    if (hadSeams) {
                      useWeldStore
                        .getState()
                        .showFunToast('Seams were cleared because their positions no longer match the rotated part.');
                    }
                  }}
                  className="ax-btn ax-btn-ghost !h-6 !px-2 !text-[11px]"
                  title={`Turn the part 90° about ${axis.toUpperCase()} (Shift+click turns the other way)`}
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{axis.toUpperCase()} 90°</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {part ? (
          <div className="flex items-baseline justify-between mt-2.5">
            <span
              className="ax-num text-[13px] text-[#F6F5EE]"
              title="Workpiece bounding envelope, width × height × depth (mm). Used for clamping and reach checks."
            >
              {part.dimensions.width} × {part.dimensions.height} × {part.dimensions.depth}
              <span className="text-[11px] text-[#7D8F7C] ml-1">mm</span>
            </span>
            <span className="ax-num text-[11px] text-[#7D8F7C]" title="Triangle facets in the STL mesh">
              {part.triangleCount.toLocaleString()} triangles
            </span>
          </div>
        ) : (
          <div className="text-[12px] text-[#7D8F7C] mt-2">Processing CAD geometry…</div>
        )}
      </div>

      {/* 02 Seam tools: two rows */}
      <div className="px-4 py-3 border-b border-[#182118] shrink-0 flex flex-col gap-2" data-tour="seams">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="ax-index">02</span>
            <span className="ax-label">Seam Tools</span>
          </div>
          {activeModelName === 'Structural L-Bracket' && (
            <button
              onClick={handleFullRootPass}
              className="ax-btn ax-btn-ghost !h-6 !px-2 !text-[11px] -mr-1.5"
              title="Plan single continuous 120mm root seam for Stage-1 subassembly (before gusset stiffeners are installed)"
            >
              120 mm root
            </button>
          )}
        </div>

        <button
          onClick={() => setMode(mode === 'add_seam' ? 'orbit' : 'add_seam')}
          className={`ax-btn w-full !h-8 ${mode === 'add_seam' ? 'ax-btn-primary' : ''}`}
          title="Pick two points on the part to define a seam"
        >
          <Plus className={`w-3.5 h-3.5 ${mode === 'add_seam' ? '' : 'text-[#e97f01]'}`} />
          <span>{mode === 'add_seam' ? 'Cancel click-to-weld' : 'Manual click-to-weld'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAutoDetect}
            className="ax-btn"
            title="Auto-detects all 7 finished assembly seams with gusset collision clearance"
          >
            <Target className="w-3.5 h-3.5 text-[#e97f01]" />
            <span>Auto-detect</span>
          </button>
          <button
            onClick={handleOptimize}
            disabled={seams.length <= 1}
            className="ax-btn"
            title="Reorders seams in an alternating skip pattern to distribute heat symmetrically and mitigate thermal warpage"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#7D8F7C]" />
            <span>Optimize order</span>
          </button>
        </div>

        {detectionToast && (
          <div className={`ax-notice ${detectionToast.startsWith('Detected') ? 'ax-notice-ok' : 'ax-notice-warn'}`}>
            {detectionToast.startsWith('Detected') ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-px text-[#4ADE80]" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px text-[#F59E0B]" />
            )}
            <span>{detectionToast}</span>
          </div>
        )}

        {showOptimizedToast && (
          <div className="ax-notice ax-notice-ok">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-px text-[#4ADE80]" />
            <span>Alternating heat-sink sequence applied. Thermal warpage minimized.</span>
          </div>
        )}
      </div>

      {/* /03 Weld sequence */}
      <div className="px-4 pt-3 pb-2 border-b border-[#182118] shrink-0" data-tour="sequence">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="ax-index">03</span>
            <span className="ax-label">Weld Sequence</span>
            <span className="ax-num text-[11px] text-[#B4C2B3]">{seams.length}</span>
          </div>
          <div className="flex items-center gap-0.5 -mr-1.5">
            {seamHistory.length > 0 && (
              <button onClick={undo} className="ax-btn ax-btn-ghost !h-6 !px-2 !text-[11px]" title="Undo last action (Ctrl+Z)">
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            {seams.length > 0 && (
              <button onClick={clearSeams} className="ax-btn ax-btn-ghost ax-btn-danger !h-6 !px-2 !text-[11px]" title="Clear all planned seams">
                Clear all
              </button>
            )}
          </div>
        </div>
        {seams.length > 0 && (
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#7D8F7C]">
            <span>
              Total <span className="ax-num text-[#F6F5EE] ml-1">{totalLength} mm</span>
            </span>
            <span>
              Est. arc <span className="ax-num text-[#e97f01] ml-1">{estArc} s</span>
            </span>
          </div>
        )}
      </div>

      {/* Seam list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        {seams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <Target className="w-6 h-6 text-[#e97f01]/50 mb-3" />
            <p style={{ fontFamily: 'Onest, sans-serif' }} className="text-[13px] font-medium text-[#B4C2B3]">No weld seams yet</p>
            <p className="text-[12px] mt-1.5 text-[#7D8F7C] leading-relaxed">
              Auto-detect creases, or use manual click-to-weld to pick two points on the part.
            </p>
          </div>
        ) : (
          seams.map((seam, idx) => {
            const isSelected = seam.id === selectedSeamId;
            const isCompleted = completedSeamIds.includes(seam.id);
            return (
              <div
                key={seam.id}
                onClick={() => selectSeam(isSelected ? null : seam.id)}
                className={`px-2.5 py-2 rounded-[4px] border transition-colors duration-150 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#111711] border-[#e97f01]/40'
                    : 'border-transparent hover:bg-[#0F140F] hover:border-[#182118]'
                }`}
              >
                {/* Index, name, length, process */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`ax-num w-5 h-5 rounded-[3px] flex items-center justify-center text-[10.5px] font-semibold shrink-0 ${
                        isSelected
                          ? 'bg-[#e97f01] text-[#0A0D0A]'
                          : isCompleted
                          ? 'bg-[#4ADE80]/12 text-[#4ADE80] border border-[#4ADE80]/30'
                          : 'text-[#7D8F7C] border border-[#253224]'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {editingSeamId === seam.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleSaveRename(seam.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(seam.id);
                          if (e.key === 'Escape') setEditingSeamId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        placeholder={`Name it ${RENAME_HINTS[hintIndex % RENAME_HINTS.length]}`}
                        className="ax-input !h-6 flex-1 min-w-0 !border-[#e97f01] placeholder:text-[#7D8F7C]"
                      />
                    ) : (
                      <div
                        className="flex items-center gap-1 min-w-0 group/rename"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(seam.id, seam.name || `Seam ${idx + 1}`);
                        }}
                        title="Double-click to rename"
                      >
                        <span style={{ fontFamily: 'Onest, sans-serif' }} className="text-[12.5px] font-medium text-[#F6F5EE] truncate">
                          {seam.name || `Seam ${idx + 1}`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(seam.id, seam.name || `Seam ${idx + 1}`);
                          }}
                          className="opacity-0 group-hover/rename:opacity-100 p-0.5 text-[#7D8F7C] hover:text-[#e97f01] transition-opacity shrink-0"
                          title="Rename seam"
                          aria-label="Rename seam"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {isCompleted && editingSeamId !== seam.id && (
                      <span className="ax-chip ax-chip-ok !h-4 !text-[9px] shrink-0">Welded</span>
                    )}
                  </div>

                  {/* Hidden while renaming so the name field gets the whole row */}
                  {editingSeamId !== seam.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="ax-num text-[11.5px] text-[#B4C2B3]">{seam.length} mm</span>
                      <span className="ax-chip ax-chip-signal !h-4 !text-[9.5px]">{seam.parameters.process}</span>
                    </div>
                  )}
                </div>

                {/* Joint type, tilt, travel speed: only on the selected seam to keep the list compact */}
                {isSelected && (
                <div className="flex items-center justify-between text-[11px] text-[#7D8F7C] mt-1.5 pl-[30px]">
                  <span className="ax-num">
                    {seam.parameters.jointType.charAt(0) + seam.parameters.jointType.slice(1).toLowerCase()} · {seam.parameters.torchTiltAngle}° tilt
                  </span>
                  <span className="ax-num">{seam.parameters.travelSpeed} mm/s</span>
                </div>
                )}

                {/* Air gap warning */}
                {seam.hasAirGap && (
                  <div onClick={(e) => e.stopPropagation()} className="ax-notice ax-notice-warn mt-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-px" />
                    <div>
                      <div className="font-medium text-[#FBBF24]">Air gap — not manufacturable</div>
                      <p className="text-[11px] text-[#FDE68A]/80 mt-0.5">
                        Path bridges {seam.airGapDistanceMm || 0} mm of empty space with no metal underneath.
                      </p>
                    </div>
                  </div>
                )}

                {/* Gusset clash warning with split action */}
                {checkGussetClash(seam) && (
                  <div onClick={(e) => e.stopPropagation()} className="ax-notice ax-notice-warn mt-2.5 flex-col !gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-px" />
                      <div>
                        <div className="font-medium text-[#FBBF24]">Obstacle clash with gusset ribs</div>
                        <p className="text-[11px] text-[#FDE68A]/80 mt-0.5">
                          The torch would pass through the gusset plates at X = ±33 mm. Stop before the rib, retract, and resume on the other side.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSplitAroundGussets(seam.id)}
                      className="ax-btn w-full !h-7 !border-[#F59E0B]/50 !text-[#FBBF24] hover:!bg-[#F59E0B]/10"
                      title="Split continuous line into 3 collision-free passes (Left Outer Root, Center Bay, Right Outer Root) with 4mm setback"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Split around gussets (3 passes)</span>
                    </button>
                  </div>
                )}

                {/* Selected seam toolbar */}
                {isSelected && (
                  <div onClick={(e) => e.stopPropagation()} className="pt-2.5 mt-2.5 border-t border-[#1D271C] flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startSimulation(seam.id)}
                        className="ax-btn !h-7"
                        title="Simulate / test this specific seam path only"
                      >
                        <Play className="w-3 h-3 fill-current text-[#e97f01]" />
                        <span>Simulate</span>
                      </button>
                      <button
                        onClick={() => reverseSeamDirection(seam.id)}
                        className="ax-btn !h-7"
                        title="Flip start & end points (reverse travel direction of the snake torch)"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Reverse path</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="ax-icon-btn"
                          title="Move earlier in welding sequence"
                          aria-label="Move earlier in welding sequence"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === seams.length - 1}
                          className="ax-icon-btn"
                          title="Move later in welding sequence"
                          aria-label="Move later in welding sequence"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="h-4 w-px bg-[#253224] mx-1" />
                        <button
                          onClick={() => flipSeamNormal(seam.id)}
                          className="ax-btn ax-btn-ghost !h-[26px] !px-2 !text-[11px]"
                          title="Invert torch normal vector 180° (flips approach and retract side)"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Flip angle</span>
                        </button>
                      </div>
                      <button
                        onClick={() => removeSeam(seam.id)}
                        className="ax-btn ax-btn-ghost ax-btn-danger !h-[26px] !px-2 !text-[11px]"
                        title="Delete seam (or press Delete key)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
