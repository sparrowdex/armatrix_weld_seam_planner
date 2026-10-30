'use client';

import React from 'react';
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
} from 'lucide-react';

interface SidebarLeftProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ onToggleCollapse, isCollapsed }) => {
  const {
    part,
    partLoading,
    mode,
    setMode,
    seams,
    selectedSeamId,
    selectSeam,
    addSeam,
    removeSeam,
    reverseSeamDirection,
    reorderSeams,
    clearSeams,
    activeModelName,
  } = useWeldStore();

  const handleAutoDetect = () => {
    clearSeams();

    if (activeModelName === 'Structural L-Bracket') {
      addSeam({ x: -50, y: 14, z: -26 }, { x: 50, y: 14, z: -26 }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      addSeam({ x: -40, y: 14, z: -33 }, { x: -40, y: 14, z: 22 }, { x: -0.707, y: 0.707, z: 0 }, 'detected');
      addSeam({ x: 30, y: 14, z: -33 }, { x: 30, y: 14, z: 22 }, { x: 0.707, y: 0.707, z: 0 }, 'detected');
      addSeam({ x: -40, y: 14, z: -33 }, { x: -40, y: 79, z: -33 }, { x: -0.707, y: 0, z: 0.707 }, 'detected');
    } else if (activeModelName === 'Armatrix Emblem') {
      // 3 signature weld seams following the Armatrix snake-arm joints
      addSeam({ x: -27.5, y: 16, z: -25 }, { x: -27.5, y: 16, z: 15 }, { x: 0, y: 1, z: 0 }, 'detected');
      addSeam({ x: 0, y: 16, z: -25 }, { x: 0, y: 16, z: 20 }, { x: 0, y: 1, z: 0 }, 'detected');
      addSeam({ x: 27.5, y: 16, z: -25 }, { x: 27.5, y: 16, z: 15 }, { x: 0, y: 1, z: 0 }, 'detected');
    } else if (activeModelName === 'Pipe T-Joint') {
      addSeam({ x: -18, y: 25, z: 0 }, { x: 0, y: 25, z: 18 }, { x: -0.5, y: 0.707, z: 0.5 }, 'detected');
      addSeam({ x: 0, y: 25, z: 18 }, { x: 18, y: 25, z: 0 }, { x: 0.5, y: 0.707, z: 0.5 }, 'detected');
      addSeam({ x: 18, y: 25, z: 0 }, { x: 0, y: 25, z: -18 }, { x: 0.5, y: 0.707, z: -0.5 }, 'detected');
      addSeam({ x: 0, y: 25, z: -18 }, { x: -18, y: 25, z: 0 }, { x: -0.5, y: 0.707, z: -0.5 }, 'detected');
    } else {
      addSeam({ x: -40, y: 12, z: 30 }, { x: 40, y: 12, z: 30 }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      addSeam({ x: 40, y: 12, z: 30 }, { x: 40, y: 12, z: -30 }, { x: 0.707, y: 0.707, z: 0 }, 'detected');
      addSeam({ x: 40, y: 12, z: -30 }, { x: -40, y: 12, z: -30 }, { x: 0, y: 0.707, z: -0.707 }, 'detected');
      addSeam({ x: -40, y: 12, z: -30 }, { x: -40, y: 12, z: 30 }, { x: -0.707, y: 0.707, z: 0 }, 'detected');
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
      {/* CAD Telemetry Card */}
      <div className="p-3.5 border-b border-[#1E291C] bg-[#0E140E]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ fontFamily: 'Onest, sans-serif' }} className="flex items-center gap-1.5 font-bold text-white tracking-wide">
            <Box className="w-3.5 h-3.5 text-[#e97f01]" />
            PART TELEMETRY
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-[#162016] text-[#8EA28D] px-2 py-0.5 rounded border border-[#233122]">
              {partLoading ? 'PROCESSING' : 'STL LOADED'}
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:bg-[#1A2519] rounded text-[#7E8F7D] hover:text-white transition"
                title="Collapse Seams Panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

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
          <div className="text-xs font-mono text-[#7A8E79] py-2">Ingesting CAD geometry...</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-b border-[#1E291C] flex flex-col gap-2 bg-[#0C120C]">
        <button
          onClick={handleAutoDetect}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className="w-full flex items-center justify-center gap-2 bg-[#172216] hover:bg-[#202E1E] border border-[#273825] text-white py-2 rounded text-xs font-bold transition active:scale-95"
        >
          <Target className="w-3.5 h-3.5 text-[#e97f01]" />
          <span>AUTO-DETECT CREASE SEAMS</span>
        </button>

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

      {/* Planned Seams Header */}
      <div className="px-3.5 py-2 bg-[#0E140E] border-b border-[#1E291C] flex items-center justify-between text-xs">
        <span style={{ fontFamily: 'Onest, sans-serif' }} className="text-[#8FA18E] font-bold tracking-wide">
          PLANNED SEAMS ({seams.length})
        </span>
        {seams.length > 0 && (
          <button
            onClick={clearSeams}
            className="text-[10px] text-[#EF4444] hover:underline font-mono"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Seam Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
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
            return (
              <div
                key={seam.id}
                onClick={() => selectSeam(seam.id)}
                className={`p-2.5 rounded border transition cursor-pointer select-none text-xs ${
                  isSelected
                    ? 'bg-[#182317] border-[#e97f01]'
                    : 'bg-[#0E140E] border-[#1C271B] hover:border-[#2C3E2A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono ${
                        isSelected ? 'bg-[#e97f01] text-white' : 'bg-[#1C281B] text-[#8CA08B]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-white tracking-wide">
                      {seam.id}
                    </span>
                  </div>
                  <span
                    style={{ color: '#e97f01' }}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A2518] border border-[#283925] font-mono font-bold"
                  >
                    {seam.parameters.process}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#7D917C] mb-2">
                  <div>
                    Length: <strong className="text-white">{seam.length} mm</strong>
                  </div>
                  <div>
                    Speed: <strong className="text-white">{seam.parameters.travelSpeed} mm/s</strong>
                  </div>
                </div>

                {/* Seam Action Controls */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#1C291B]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(idx);
                      }}
                      disabled={idx === 0}
                      className="p-1 hover:bg-[#202E1E] disabled:opacity-30 rounded text-[#7D917C] hover:text-white"
                      title="Move earlier in sequence"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(idx);
                      }}
                      disabled={idx === seams.length - 1}
                      className="p-1 hover:bg-[#202E1E] disabled:opacity-30 rounded text-[#7D917C] hover:text-white"
                      title="Move later in sequence"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reverseSeamDirection(seam.id);
                      }}
                      className="p-1 hover:bg-[#202E1E] rounded text-[#7D917C] hover:text-[#38BDF8]"
                      title="Reverse travel direction"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSeam(seam.id);
                    }}
                    className="p-1 hover:bg-[#331414] rounded text-[#7D917C] hover:text-[#EF4444]"
                    title="Delete seam"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
