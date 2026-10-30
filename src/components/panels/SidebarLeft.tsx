'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Sparkles,
  Plus,
  ArrowUpDown,
  Trash2,
  CheckCircle,
  MoveUp,
  MoveDown,
  RotateCw,
  Box,
  Flame,
} from 'lucide-react';

export const SidebarLeft: React.FC = () => {
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

  // Auto-detect seams handler
  const handleAutoDetect = () => {
    // Generate intelligent default seams depending on benchmark model
    clearSeams();

    if (activeModelName === 'Structural L-Bracket') {
      // Key fillet weld joint: along the 90 degree corner between upright and base plate
      addSeam({ x: -45, y: 12, z: -18 }, { x: 45, y: 12, z: -18 }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      // Gusset weld seam left
      addSeam({ x: -6, y: 12, z: 20 }, { x: -6, y: 70, z: -18 }, { x: -0.707, y: 0.5, z: 0.5 }, 'detected');
      // Gusset weld seam right
      addSeam({ x: 6, y: 12, z: 20 }, { x: 6, y: 70, z: -18 }, { x: 0.707, y: 0.5, z: 0.5 }, 'detected');
    } else if (activeModelName === 'Pipe T-Joint') {
      // 4 quadrant fillet saddle welds around the branch intersection
      addSeam({ x: -16, y: 25, z: 0 }, { x: 0, y: 25, z: 16 }, { x: -0.5, y: 0.707, z: 0.5 }, 'detected');
      addSeam({ x: 0, y: 25, z: 16 }, { x: 16, y: 25, z: 0 }, { x: 0.5, y: 0.707, z: 0.5 }, 'detected');
      addSeam({ x: 16, y: 25, z: 0 }, { x: 0, y: 25, z: -16 }, { x: 0.5, y: 0.707, z: -0.5 }, 'detected');
      addSeam({ x: 0, y: 25, z: -16 }, { x: -16, y: 25, z: 0 }, { x: -0.5, y: 0.707, z: -0.5 }, 'detected');
    } else {
      // Box Flange perimeter fillet welds
      addSeam({ x: -40, y: 10, z: 25 }, { x: 40, y: 10, z: 25 }, { x: 0, y: 0.707, z: 0.707 }, 'detected');
      addSeam({ x: 40, y: 10, z: 25 }, { x: 40, y: 10, z: -25 }, { x: 0.707, y: 0.707, z: 0 }, 'detected');
      addSeam({ x: 40, y: 10, z: -25 }, { x: -40, y: 10, z: -25 }, { x: 0, y: 0.707, z: -0.707 }, 'detected');
      addSeam({ x: -40, y: 10, z: -25 }, { x: -40, y: 10, z: 25 }, { x: -0.707, y: 0.707, z: 0 }, 'detected');
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
    <aside className="w-80 h-full bg-[#111611]/95 border-r border-[#243022] flex flex-col z-10 select-none overflow-hidden">
      {/* CAD Telemetry Card */}
      <div className="p-3.5 border-b border-[#243022] bg-[#141A14]">
        <div className="flex items-center justify-between text-xs font-mono text-[#889988] mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Box className="w-3.5 h-3.5 text-[#FF5B00]" />
            PART TELEMETRY
          </span>
          <span className="text-[10px] bg-[#1F281E] text-[#9CB099] px-2 py-0.5 rounded border border-[#2D3C2B]">
            {partLoading ? 'PARSING...' : 'STL READY'}
          </span>
        </div>

        {part ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-[#192218] p-2 rounded border border-[#263524]">
              <span className="text-[#889988] block text-[9px]">DIMENSIONS (MM)</span>
              <span className="font-semibold text-white">
                {part.dimensions.width} × {part.dimensions.height} × {part.dimensions.depth}
              </span>
            </div>
            <div className="bg-[#192218] p-2 rounded border border-[#263524]">
              <span className="text-[#889988] block text-[9px]">TRIANGLES</span>
              <span className="font-semibold text-white">{part.triangleCount.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono text-[#889988] py-2">Loading CAD geometry...</div>
        )}
      </div>

      {/* Action Buttons: Auto-Detect & Add Seam */}
      <div className="p-3 border-b border-[#243022] flex flex-col gap-2 bg-[#121812]">
        <button
          onClick={handleAutoDetect}
          className="w-full flex items-center justify-center gap-2 bg-[#1E291C] hover:bg-[#283925] border border-[#33462E] text-white py-2 rounded text-xs font-mono font-semibold transition active:scale-95 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF5B00]" />
          <span>AUTO-DETECT CREASE SEAMS</span>
        </button>

        <button
          onClick={() => setMode(mode === 'add_seam' ? 'orbit' : 'add_seam')}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-mono font-semibold transition active:scale-95 border ${
            mode === 'add_seam'
              ? 'bg-[#FF5B00] text-white border-[#FF5B00] shadow-glow'
              : 'bg-[#182017] hover:bg-[#202C1F] text-[#C2D4BF] border-[#2D3C2A]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{mode === 'add_seam' ? 'CANCEL CLICK-TO-WELD' : '+ MANUAL CLICK-TO-WELD'}</span>
        </button>
      </div>

      {/* Seam Planning List Header */}
      <div className="px-3 py-2 bg-[#151D14] border-b border-[#243022] flex items-center justify-between text-xs font-mono">
        <span className="text-[#889988] font-semibold">
          PLANNED SEAMS ({seams.length})
        </span>
        {seams.length > 0 && (
          <button
            onClick={clearSeams}
            className="text-[10px] text-[#EF4444] hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Seam Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {seams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs font-mono text-[#778877] px-4">
            <Flame className="w-8 h-8 text-[#FF5B00]/40 mb-2" />
            <p className="font-semibold text-[#A0B0A0]">No weld seams defined</p>
            <p className="text-[11px] mt-1 text-[#667766]">
              Click &quot;Auto-Detect Crease Seams&quot; or use &quot;+ Manual Click-to-Weld&quot; to pick seam points on the 3D part.
            </p>
          </div>
        ) : (
          seams.map((seam, idx) => {
            const isSelected = seam.id === selectedSeamId;
            return (
              <div
                key={seam.id}
                onClick={() => selectSeam(seam.id)}
                className={`p-2.5 rounded border transition cursor-pointer select-none font-mono text-xs ${
                  isSelected
                    ? 'bg-[#202C1E] border-[#FF5B00] shadow-glow'
                    : 'bg-[#151D14] border-[#253323] hover:border-[#384C34]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-[#FF5B00] text-white' : 'bg-[#243322] text-[#90A48E]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white">{seam.id}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B2519] border border-[#2D3F2A] text-[#FF5B00]">
                    {seam.parameters.process}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] text-[#889988] mb-2">
                  <div>
                    Length: <strong className="text-white">{seam.length} mm</strong>
                  </div>
                  <div>
                    Speed: <strong className="text-white">{seam.parameters.travelSpeed} mm/s</strong>
                  </div>
                </div>

                {/* Seam Action Bar */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#233121]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(idx);
                      }}
                      disabled={idx === 0}
                      className="p-1 hover:bg-[#2B3B28] disabled:opacity-30 rounded text-[#889988] hover:text-white"
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
                      className="p-1 hover:bg-[#2B3B28] disabled:opacity-30 rounded text-[#889988] hover:text-white"
                      title="Move later in sequence"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reverseSeamDirection(seam.id);
                      }}
                      className="p-1 hover:bg-[#2B3B28] rounded text-[#889988] hover:text-[#38BDF8]"
                      title="Reverse travel direction (swap Start & End)"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSeam(seam.id);
                    }}
                    className="p-1 hover:bg-[#3D1A1A] rounded text-[#889988] hover:text-[#EF4444]"
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
