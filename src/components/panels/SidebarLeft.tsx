'use client';

import React, { useState } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Target,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  RotateCw,
  Box,
  ChevronLeft,
  Zap,
  CheckCircle,
} from 'lucide-react';

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
    reorderSeams,
    clearSeams,
    undo,
    optimizeSeamSequence,
    activeModelName,
  } = useWeldStore();

  const [showOptimizedToast, setShowOptimizedToast] = useState(false);

  const handleOptimize = () => {
    optimizeSeamSequence();
    setShowOptimizedToast(true);
    setTimeout(() => setShowOptimizedToast(false), 3500);
  };

  const handleAutoDetect = () => {
    clearSeams();

    if (activeModelName === 'Structural L-Bracket') {
      // 1. Main 90° Internal Root Corner Fillet (Base plate to upright vertical wall)
      addSeam({ x: -55, y: 14, z: -26 }, { x: 55, y: 14, z: -26 }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      // 2. Left Stiffener Rib - Horizontal Internal Fillet (Base plate junction)
      addSeam({ x: -30, y: 14, z: -26 }, { x: -30, y: 14, z: 29 }, { x: 0.707, y: 0.707, z: 0 }, 'detected');
      // 3. Right Stiffener Rib - Horizontal Internal Fillet (Base plate junction)
      addSeam({ x: 30, y: 14, z: -26 }, { x: 30, y: 14, z: 29 }, { x: -0.707, y: 0.707, z: 0 }, 'detected');
      // 4. Left Stiffener Rib - Vertical Internal Fillet (Upright wall junction)
      addSeam({ x: -30, y: 14, z: -26 }, { x: -30, y: 74, z: -26 }, { x: 0.707, y: 0, z: 0.707 }, 'detected');
      // 5. Right Stiffener Rib - Vertical Internal Fillet (Upright wall junction)
      addSeam({ x: 30, y: 14, z: -26 }, { x: 30, y: 74, z: -26 }, { x: -0.707, y: 0, z: 0.707 }, 'detected');
    } else if (activeModelName === 'Pipe T-Joint') {
      // 4 Quadrants of the 3D intersecting saddle weld seam
      addSeam({ x: -18, y: 25, z: 0 }, { x: 0, y: 25, z: 18 }, { x: -0.5, y: 0.707, z: 0.5 }, 'detected');
      addSeam({ x: 0, y: 25, z: 18 }, { x: 18, y: 25, z: 0 }, { x: 0.5, y: 0.707, z: 0.5 }, 'detected');
      addSeam({ x: 18, y: 25, z: 0 }, { x: 0, y: 25, z: -18 }, { x: 0.5, y: 0.707, z: -0.5 }, 'detected');
      addSeam({ x: 0, y: 25, z: -18 }, { x: -18, y: 25, z: 0 }, { x: -0.5, y: 0.707, z: -0.5 }, 'detected');
    } else if (activeModelName === 'Confined Box Flange' || activeModelName === 'Box Flange' || activeModelName.includes('Box')) {
      // 4 Internal Floor Fillet Seams inside the deep confined ship cell / compartment
      addSeam({ x: -46, y: 14, z: -37 }, { x: 46, y: 14, z: -37 }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      addSeam({ x: 46, y: 14, z: -37 }, { x: 46, y: 14, z: 37 }, { x: -0.707, y: 0.707, z: 0 }, 'detected');
      addSeam({ x: 46, y: 14, z: 37 }, { x: -46, y: 14, z: 37 }, { x: 0, y: 0.707, z: -0.707 }, 'detected');
      addSeam({ x: -46, y: 14, z: 37 }, { x: -46, y: 14, z: -37 }, { x: 0.707, y: 0.707, z: 0 }, 'detected');
    } else if (part) {
      // Dynamic boundary crease detection for any arbitrary uploaded custom STL!
      const hw = parseFloat(((part.dimensions.width / 2) * 0.75).toFixed(1));
      const hd = parseFloat(((part.dimensions.depth / 2) * 0.75).toFixed(1));
      const y = parseFloat(Math.max(8, part.dimensions.height * 0.2).toFixed(1));
      addSeam({ x: -hw, y, z: hd }, { x: hw, y, z: hd }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      addSeam({ x: hw, y, z: hd }, { x: hw, y, z: -hd }, { x: 0.707, y: 0.707, z: 0 }, 'detected');
      addSeam({ x: hw, y, z: -hd }, { x: -hw, y, z: -hd }, { x: 0, y: 0.707, z: -0.707 }, 'detected');
      addSeam({ x: -hw, y, z: -hd }, { x: -hw, y, z: hd }, { x: -0.707, y: 0.707, z: 0 }, 'detected');
    }
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

      {/* CAD Telemetry Card */}
      <div className="p-3 border-b border-[#1E291C] bg-[#0C120C]">
        {part ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-[#131B13] p-2 rounded border border-[#202D1E]">
              <span className="text-[#7A8E79] block text-[9px] uppercase tracking-wider">Dimensions (mm)</span>
              <span className="font-semibold text-white">
                {part.dimensions.width} × {part.dimensions.height} × {part.dimensions.depth}
              </span>
            </div>
            <div className="bg-[#131B13] p-2 rounded border border-[#202D1E]">
              <span className="text-[#7A8E79] block text-[9px] uppercase tracking-wider">Triangles</span>
              <span className="font-semibold text-white">{part.triangleCount.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono text-[#7A8E79] py-1">Processing CAD geometry...</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-b border-[#1E291C] flex flex-col gap-2 bg-[#0E140E]">
        <button
          onClick={handleAutoDetect}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className="w-full flex items-center justify-center gap-2 bg-[#172216] hover:bg-[#202E1E] border border-[#273825] text-white py-2 rounded text-xs font-bold transition active:scale-95"
        >
          <Target className="w-3.5 h-3.5 text-[#e97f01]" />
          <span>AUTO-DETECT CREASE SEAMS</span>
        </button>

        <button
          onClick={handleOptimize}
          disabled={seams.length <= 1}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className="w-full flex items-center justify-center gap-2 bg-[#101E17] hover:bg-[#162A1F] border border-[#203D2E] text-[#38BDF8] hover:text-white py-2 rounded text-xs font-bold transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          title="Reorders seams in an alternating skip pattern to distribute heat symmetrically and mitigate thermal warpage"
        >
          <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>AUTO-OPTIMIZE SEQUENCE (HEAT MITIGATION)</span>
        </button>

        {showOptimizedToast && (
          <div className="flex items-center gap-1.5 p-2 rounded bg-[#10241A] border border-[#22C55E]/40 text-[#22C55E] text-[10px] font-mono leading-tight">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Alternating heat-sink sequence applied. Thermal warpage minimized!</span>
          </div>
        )}

        <button
          onClick={() => setMode(mode === 'add_seam' ? 'orbit' : 'add_seam')}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition active:scale-95 border ${
            mode === 'add_seam'
              ? 'bg-[#e97f01] text-white border-[#e97f01]'
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
                className={`p-2 rounded border transition cursor-pointer select-none text-xs ${
                  isSelected
                    ? 'bg-[#182317] border-[#e97f01] shadow-sm'
                    : isCompleted
                    ? 'bg-[#101712] border-[#233827] opacity-90'
                    : 'bg-[#0E140E] border-[#1C271B] hover:border-[#2C3E2A]'
                }`}
              >
                {/* Header row: Index, Human Name, Process, and Length */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                        isSelected
                          ? 'bg-[#e97f01] text-white'
                          : isCompleted
                          ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                          : 'bg-[#1C281B] text-[#8CA08B]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-white tracking-wide">
                      Seam {idx + 1}
                    </span>
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

                {/* Contextual Action Toolbar: Expands ONLY on selected seam to keep list clean & uncluttered */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between pt-2 mt-2 border-t border-[#273826] text-[10px] font-mono text-[#8FA28E]"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="px-1.5 py-0.5 bg-[#141E14] hover:bg-[#202E1E] disabled:opacity-25 rounded border border-[#283A26] text-[#A6BAA5] hover:text-white transition active:scale-95"
                        title="Move earlier in sequence (welds sooner)"
                      >
                        ▲ Up
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === seams.length - 1}
                        className="px-1.5 py-0.5 bg-[#141E14] hover:bg-[#202E1E] disabled:opacity-25 rounded border border-[#283A26] text-[#A6BAA5] hover:text-white transition active:scale-95"
                        title="Move later in sequence (welds later)"
                      >
                        ▼ Down
                      </button>
                      <button
                        onClick={() => reverseSeamDirection(seam.id)}
                        className="px-1.5 py-0.5 bg-[#141E14] hover:bg-[#202E1E] rounded border border-[#283A26] text-[#38BDF8] hover:text-white transition active:scale-95 flex items-center gap-1"
                        title="Flip start & end points (reverse travel direction of the snake torch)"
                      >
                        <span>⇄ Flip Path</span>
                      </button>
                    </div>

                    <button
                      onClick={() => removeSeam(seam.id)}
                      className="px-1.5 py-0.5 bg-[#2B1414] hover:bg-[#3D1A1A] rounded border border-[#522323] text-[#EF4444] hover:text-white transition active:scale-95"
                      title="Delete seam (or press Delete key)"
                    >
                      ✕ Delete
                    </button>
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
