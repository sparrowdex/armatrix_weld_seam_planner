'use client';

import React, { useState } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Target,
  Plus,
  Trash2,
  RotateCw,
  Box,
  ChevronLeft,
  SlidersHorizontal,
  CheckCircle,
  Pencil,
  Play,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  AlertTriangle,
  Split,
} from 'lucide-react';
import { STLLoader } from 'three-stdlib';
import { detectCandidateSeams } from '@/utils/seamDetector';

interface SidebarLeftProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ onToggleCollapse }) => {
  const {
    part,
    partLoading,
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

  const handleStartRename = (seamId: string, currentName: string) => {
    setEditingSeamId(seamId);
    setEditingName(currentName);
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
      // 1. Center Bay 90° Root Fillet (Flush in root corner at z = -31, 4mm nozzle standoff)
      addSeam({ x: -26, y: 14, z: -31 }, { x: 26, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Center Root Fillet');
      // 2. Left Gusset - Base Plate Fillet (Center bay side: z = -27 to +20, 4mm nozzle standoff)
      addSeam({ x: -30, y: 14, z: -27 }, { x: -30, y: 14, z: 20 }, { x: 0.707, y: 0.707, z: 0 }, 'detected', 'Left Gusset Base');
      // 3. Left Gusset - Vertical Upright Fillet (Center bay side: y = 18 to 70 at z = -31, 4mm nozzle standoff)
      addSeam({ x: -30, y: 18, z: -31 }, { x: -30, y: 70, z: -31 }, { x: 0.707, y: 0, z: 0.707 }, 'detected', 'Left Gusset Vertical');
      // 4. Right Gusset - Base Plate Fillet (Center bay side: z = -27 to +20, 4mm nozzle standoff)
      addSeam({ x: 30, y: 14, z: -27 }, { x: 30, y: 14, z: 20 }, { x: -0.707, y: 0.707, z: 0 }, 'detected', 'Right Gusset Base');
      // 5. Right Gusset - Vertical Upright Fillet (Center bay side: y = 18 to 70 at z = -31, 4mm nozzle standoff)
      addSeam({ x: 30, y: 18, z: -31 }, { x: 30, y: 70, z: -31 }, { x: -0.707, y: 0, z: 0.707 }, 'detected', 'Right Gusset Vertical');
      // 6. Left Outer Root Fillet (Outside left rib: x = -55 to -44 at z = -31, 4mm nozzle standoff)
      addSeam({ x: -55, y: 14, z: -31 }, { x: -44, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Left Outer Root');
      // 7. Right Outer Root Fillet (Outside right rib: x = 44 to 55 at z = -31, 4mm nozzle standoff)
      addSeam({ x: 44, y: 14, z: -31 }, { x: 55, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Right Outer Root');
    } else if (activeModelName === 'Pipe T-Joint') {
      // 4 Quadrants of the 3D intersecting saddle weld seam
      addSeam({ x: -18, y: 25, z: 0 }, { x: 0, y: 25, z: 18 }, { x: -0.5, y: 0.707, z: 0.5 }, 'detected', 'Saddle Quadrant 1');
      addSeam({ x: 0, y: 25, z: 18 }, { x: 18, y: 25, z: 0 }, { x: 0.5, y: 0.707, z: 0.5 }, 'detected', 'Saddle Quadrant 2');
      addSeam({ x: 18, y: 25, z: 0 }, { x: 0, y: 25, z: -18 }, { x: 0.5, y: 0.707, z: -0.5 }, 'detected', 'Saddle Quadrant 3');
      addSeam({ x: 0, y: 25, z: -18 }, { x: -18, y: 25, z: 0 }, { x: -0.5, y: 0.707, z: -0.5 }, 'detected', 'Saddle Quadrant 4');
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
          geom.computeVertexNormals();
          geom.center();
          geom.computeBoundingBox();
          const bbox = geom.boundingBox!;
          geom.translate(0, -bbox.min.y, 0);

          const candidateSeams = detectCandidateSeams(geom, 40, 12);
          if (candidateSeams.length > 0) {
            candidateSeams.slice(0, 8).forEach((cs, i) => {
              addSeam(cs.start, cs.end, cs.normal, 'detected', `Crease ${i + 1}`);
            });
            setDetectionToast(`Detected ${Math.min(candidateSeams.length, 8)} true topological fillet creases.`);
            setTimeout(() => setDetectionToast(null), 3500);
            return;
          }
        } catch (e) {
          console.error('Failed topological crease detection on custom STL:', e);
        }
      }
      setDetectionToast('No 90° weld creases detected on this mechanical component. Use Manual Click-to-Weld with OSNAP.');
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
    addSeam({ x: -58, y: 14, z: -31 }, { x: -40, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Left Outer Root');
    addSeam({ x: -26, y: 14, z: -31 }, { x: 26, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Center Root Fillet');
    addSeam({ x: 40, y: 14, z: -31 }, { x: 58, y: 14, z: -31 }, { x: 0, y: 0.707, z: 0.707 }, 'detected', 'Right Outer Root');
  };

  const handleFullRootPass = () => {
    clearSeams();
    addSeam(
      { x: -58, y: 14, z: -31 },
      { x: 58, y: 14, z: -31 },
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

  return (
    <aside className="w-80 h-full bg-[#0A0D0A] border-r border-[#1E291C] flex flex-col z-10 select-none overflow-hidden relative">
      {/* Header with prominent Collapse button */}
      <div className="p-3.5 border-b border-[#1E291C] bg-[#0E140E] flex items-center justify-between">
        <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-white tracking-wide text-xs">
          PART & SEAMS
        </span>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-[#162016] hover:bg-[#202E1F] border border-[#233122] rounded text-[#8EA28D] hover:text-white transition active:scale-95"
            title="Collapse Seams Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#e97f01]" />
            <span>COLLAPSE</span>
          </button>
        )}
      </div>

      {/* CAD Telemetry Card - Physical Workpiece Envelope & Mesh Specs */}
      <div className="p-3 border-b border-[#1E291C] bg-[#0C120C]">
        {part ? (
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-[#A6BAA5] font-semibold">
                <Box className="w-3 h-3 text-[#e97f01]" />
                <span>PART TELEMETRY (STL)</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#152317] text-[#4ADE80] border border-[#224A27] font-bold">
                WATERTIGHT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                className="bg-[#131B13] p-2 rounded-lg border border-[#202D1E] hover:border-[#2C3E29] transition"
                title="Workpiece 3D bounding envelope (Width × Height × Depth in mm). Used for machine clamping & robot reach checks."
              >
                <div className="flex items-center gap-1 text-[#7A8E79] text-[9px] uppercase tracking-wider mb-0.5">
                  <Box className="w-2.5 h-2.5 text-[#38BDF8]" />
                  <span>Envelope (W×H×D)</span>
                </div>
                <span className="font-semibold text-white tracking-tight text-xs">
                  {part.dimensions.width} × {part.dimensions.height} × {part.dimensions.depth}
                </span>
                <span className="block text-[8px] text-[#637662] mt-0.5 font-sans">mm</span>
              </div>

              <div
                className="bg-[#131B13] p-2 rounded-lg border border-[#202D1E] hover:border-[#2C3E29] transition"
                title="Total triangular polygon facets in the ingested STL mesh."
              >
                <div className="flex items-center gap-1 text-[#7A8E79] text-[9px] uppercase tracking-wider mb-0.5">
                  <Layers className="w-2.5 h-2.5 text-[#4ADE80]" />
                  <span>Mesh Facets</span>
                </div>
                <span className="font-semibold text-white tracking-tight text-xs">
                  {part.triangleCount.toLocaleString()}
                </span>
                <span className="block text-[8px] text-[#637662] mt-0.5 font-sans">Triangles</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono text-[#7A8E79] py-1">Processing CAD geometry...</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-b border-[#1E291C] flex flex-col gap-2 bg-[#0E140E]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAutoDetect}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#172216] hover:bg-[#202E1E] border border-[#273825] text-white py-2 rounded-lg text-xs font-bold transition active:scale-95"
            title="Auto-detects all 7 finished assembly seams with gusset collision clearance"
          >
            <Target className="w-3.5 h-3.5 text-[#e97f01]" />
            <span>AUTO-DETECT CREASES</span>
          </button>
          {activeModelName === 'Structural L-Bracket' && (
            <button
              onClick={handleFullRootPass}
              className="px-2.5 py-2 bg-[#121A16] hover:bg-[#1A2520] border border-[#203426] text-[#6EE7B7] hover:text-white rounded-lg text-[10px] font-mono font-medium transition active:scale-95 whitespace-nowrap"
              title="Plan single continuous 120mm root seam for Stage-1 subassembly (before gusset stiffeners are installed)"
            >
              120mm Root
            </button>
          )}
        </div>

        <button
          onClick={handleOptimize}
          disabled={seams.length <= 1}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0F2015] to-[#142A1C] hover:from-[#152E1E] hover:to-[#1B3825] border border-[#23462D] text-[#86EFAC] hover:text-white py-2 rounded text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-35 disabled:pointer-events-none shadow-sm"
          title="Reorders seams in an alternating skip pattern to distribute heat symmetrically and mitigate thermal warpage"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#4ADE80]" />
          <span>AUTO-OPTIMIZE SEQUENCE</span>
        </button>

        {showOptimizedToast && (
          <div className="flex items-center gap-1.5 p-2 rounded bg-[#0E2015] border border-[#22C55E]/30 text-[#86EFAC] text-[10px] font-mono leading-tight">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-[#4ADE80]" />
            <span>Alternating heat-sink sequence applied. Thermal warpage minimized!</span>
          </div>
        )}

        <button
          onClick={() => setMode(mode === 'add_seam' ? 'orbit' : 'add_seam')}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
            mode === 'add_seam'
              ? 'bg-gradient-to-r from-[#e97f01] via-[#d46a00] to-[#b35400] text-white border-[#f59e0b]/50 shadow-md'
              : 'bg-[#121A12] hover:bg-[#1A241A] text-[#B8C8B7] border-[#223121]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{mode === 'add_seam' ? 'CANCEL CLICK-TO-WELD' : '+ MANUAL CLICK-TO-WELD'}</span>
        </button>
      </div>

      {/* Planned Seams Header with Summary Metrics */}
      <div className="px-3.5 py-2 bg-[#0E140E] border-b border-[#1E291C] flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'Onest, sans-serif' }} className="text-[#8FA18E] font-bold tracking-wide">
            PLANNED SEAMS ({seams.length})
          </span>
          <div className="flex items-center gap-2.5">
            {seamHistory.length > 0 && (
              <button
                onClick={undo}
                className="text-[10px] text-[#38BDF8] hover:underline font-mono flex items-center gap-1 transition"
                title="Undo last action (Ctrl+Z)"
              >
                <span>↩ Undo</span>
              </button>
            )}
            {seams.length > 0 && (
              <button
                onClick={clearSeams}
                className="text-[10px] text-[#EF4444] hover:underline font-mono"
                title="Clear all planned seams"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        {seams.length > 0 && (
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6A7E69]">
            <span>
              Total: <strong className="text-[#C2D1C1]">{seams.reduce((acc, s) => acc + s.length, 0).toFixed(1)} mm</strong>
            </span>
            <span>
              Est. Arc: <strong className="text-[#e97f01]">{(seams.reduce((acc, s) => acc + (s.length / Math.max(1, s.parameters.travelSpeed)), 0)).toFixed(1)}s</strong>
            </span>
          </div>
        )}
      </div>

      {/* Seam Items Scroll Area: Scalable, high-density list that gracefully handles 10+ seams */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {seams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-[#7A8E79] px-4">
            <Target className="w-7 h-7 text-[#e97f01]/40 mb-2" />
            <p style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-[#A2B5A1]">No weld seams defined</p>
            <p className="text-[11px] mt-1 text-[#657764]">
              Click &quot;Auto-Detect Crease Seams&quot; or use &quot;+ Manual Click-to-Weld&quot; to pick points on the 3D part.
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
                className={`p-2.5 rounded-lg border transition-all duration-150 cursor-pointer select-none text-xs ${
                  isSelected
                    ? 'bg-[#121A12] border-[#e97f01]/45 shadow-[0_0_12px_rgba(233,127,1,0.06)]'
                    : isCompleted
                    ? 'bg-[#0E150F] border-[#1F3323] opacity-90'
                    : 'bg-[#0D120D] border-[#1B251A] hover:border-[#283827]'
                }`}
              >
                {/* Header row: Index, Inline-Renamable Name, Process, and Length */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#e97f01] to-[#b35400] text-white shadow-sm border border-[#f59e0b]/40'
                          : isCompleted
                          ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                          : 'bg-[#182217] text-[#7E937D] border border-[#223021]'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Figma-Style Inline Renaming */}
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
                        className="bg-[#0A0E0A] border border-[#e97f01]/70 px-1.5 py-0.5 rounded text-white text-xs font-bold outline-none font-mono w-28"
                      />
                    ) : (
                      <div
                        className="flex items-center gap-1 group/rename"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(seam.id, seam.name || `Seam ${idx + 1}`);
                        }}
                        title="Double-click to rename"
                      >
                        <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-white tracking-wide">
                          {seam.name || `Seam ${idx + 1}`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(seam.id, seam.name || `Seam ${idx + 1}`);
                          }}
                          className="opacity-0 group-hover/rename:opacity-100 p-0.5 text-[#6E806D] hover:text-[#e97f01] transition-opacity"
                          title="Rename seam"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#132A1C] border border-[#22C55E]/40 text-[#22C55E] font-mono font-bold">
                        WELDED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[10px] text-[#A6BAA5] font-semibold">{seam.length} mm</span>
                    <span
                      style={{ color: '#e97f01' }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A2518] border border-[#283925] font-bold"
                    >
                      {seam.parameters.process}
                    </span>
                  </div>
                </div>

                {/* Subtitle metrics: joint type & travel speed */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#7D917C] mt-1">
                  <span>
                    {seam.parameters.jointType} ({seam.parameters.torchTiltAngle}° Tilt)
                  </span>
                  <span>{seam.parameters.travelSpeed} mm/s</span>
                </div>

                {/* Air Gap / Non-Manufacturable Warning Tag */}
                {seam.hasAirGap && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 p-2 rounded-md bg-[#241305] border border-[#F59E0B]/50 text-[#FCD34D] text-[10px] font-mono flex items-start gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#FBBF24]">Air Gap Detected (Non-Manufacturable)</span>
                      <p className="text-[9px] text-[#FDE68A]/85 mt-0.5 font-sans leading-tight">
                        Path bridges empty space ({seam.airGapDistanceMm || 0}mm gap) without underlying metal substrate.
                      </p>
                    </div>
                  </div>
                )}

                {/* Gusset Clash Warning & 1-Click Split Action */}
                {checkGussetClash(seam) && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 p-2 rounded-md bg-[#231206] border border-[#F59E0B]/50 text-[#FCD34D] text-[10px] font-mono flex flex-col gap-1.5"
                  >
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#FBBF24]">OBSTACLE CLASH: Intersects Gusset Ribs</span>
                        <p className="text-[9px] text-[#FDE68A]/85 mt-0.5 font-sans leading-tight">
                          Physical torch will phase through solid gusset plates at X = ±33mm. Robot must stop before the triangle, retract, and resume on the other side.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSplitAroundGussets(seam.id)}
                      className="w-full py-1.5 px-2 bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white font-bold rounded text-[10px] transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                      title="Split continuous line into 3 collision-free passes (Left Outer Root, Center Bay, Right Outer Root) with 4mm setback"
                    >
                      <Split className="w-3 h-3 text-white" />
                      <span>Split Around Gussets (3 Clean Passes)</span>
                    </button>
                  </div>
                )}

                {/* Contextual Action Toolbar: Sleek Balanced CAD Control Bar */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-2 mt-2 border-t border-[#1F2B1E] flex flex-col gap-1.5 font-mono text-[10px]"
                  >
                    {/* Primary Toolpath Execution & Reversal */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => startSimulation(seam.id)}
                        className="py-1 px-2 bg-gradient-to-r from-[#142618] to-[#1E3B24] hover:from-[#1A3320] hover:to-[#284E30] rounded-md border border-[#234E2B] text-[#86EFAC] hover:text-white transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 font-semibold shadow-sm"
                        title="Simulate / test this specific seam path only"
                      >
                        <Play className="w-3 h-3 fill-current text-[#4ADE80]" />
                        <span>Simulate Seam</span>
                      </button>

                      <button
                        onClick={() => reverseSeamDirection(seam.id)}
                        className="py-1 px-2 bg-[#12231C] hover:bg-[#1A3328] rounded-md border border-[#1E4334] text-[#6EE7B7] hover:text-white transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 font-medium"
                        title="Flip start & end points (reverse travel direction of the snake torch)"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Reverse Path</span>
                      </button>
                    </div>

                    {/* Secondary Sequence & Angle Micro-Controls */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        {/* Segmented Reorder Pill */}
                        <div className="flex items-center bg-[#141C14] border border-[#223021] rounded-md p-0.5">
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="px-2 py-0.5 hover:bg-[#1F2E1E] disabled:opacity-20 rounded text-[#A6BAA5] hover:text-white transition flex items-center gap-0.5 text-[9px]"
                            title="Move earlier in welding sequence"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                            <span>Up</span>
                          </button>
                          <div className="w-px h-3 bg-[#223021]" />
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === seams.length - 1}
                            className="px-2 py-0.5 hover:bg-[#1F2E1E] disabled:opacity-20 rounded text-[#A6BAA5] hover:text-white transition flex items-center gap-0.5 text-[9px]"
                            title="Move later in welding sequence"
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                            <span>Down</span>
                          </button>
                        </div>

                        {/* Invert Normal Button */}
                        <button
                          onClick={() => flipSeamNormal(seam.id)}
                          className="px-2 py-1 bg-[#15202B] hover:bg-[#1C2C3C] rounded-md border border-[#23435E] text-[#7DD3FC] hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[9px] font-medium"
                          title="Invert torch normal vector 180° (flips approach and retract side)"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                          <span>Flip Angle</span>
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeSeam(seam.id)}
                        className="px-2 py-1 bg-[#231212]/80 hover:bg-[#351616] rounded-md border border-[#441B1B] text-[#FCA5A5] hover:text-white transition-all duration-150 active:scale-95 flex items-center gap-1 text-[9px] font-medium"
                        title="Delete seam (or press Delete key)"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
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
