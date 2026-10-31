'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export const SimulationHUD: React.FC = () => {
  const {
    isSimulating,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    simPhase,
    simCurrentSeamIndex,
    setSimCurrentSeamIndex,
    selectedSeamId,
    selectSeam,
    seams,
    playbackSpeed,
    setPlaybackSpeed,
  } = useWeldStore();

  if (seams.length === 0) return null;

  const phaseColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    idle: { bg: 'bg-[#151D14]', text: 'text-[#889988]', border: 'border-[#233121]', dot: 'bg-[#889988]' },
    rapid_traverse: { bg: 'bg-[#EAB308]/10', text: 'text-[#EAB308]', border: 'border-[#EAB308]/30', dot: 'bg-[#EAB308]' },
    approach: { bg: 'bg-[#38BDF8]/10', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30', dot: 'bg-[#38BDF8]' },
    welding: { bg: 'bg-[#e97f01]/15', text: 'text-[#e97f01]', border: 'border-[#e97f01]/40', dot: 'bg-[#e97f01] shadow-[0_0_8px_#e97f01]' },
    retract: { bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30', dot: 'bg-[#A855F7]' },
    cooling: { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30', dot: 'bg-[#3B82F6]' },
  };

  const currentPhaseStyle = phaseColors[simPhase] || phaseColors.idle;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 select-none pointer-events-auto">
      {/* Sleek Aerospace Simulation Control Dock */}
      <div className="bg-[#080C08]/80 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs text-white whitespace-nowrap shrink-0">
        {/* Play/Pause Button - Context-aware (Single Seam vs All) */}
        <button
          onClick={() => (isSimulating ? pauseSimulation() : startSimulation(selectedSeamId))}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg font-bold text-xs transition-all duration-200 active:scale-95 shrink-0 shadow-lg ${
            isSimulating
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border border-amber-300/60 font-black'
              : 'bg-gradient-to-r from-[#e97f01] via-[#d46a00] to-[#b35400] hover:from-[#f38b0e] hover:to-[#c25e00] text-white border border-[#f59e0b]/40'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>
            {isSimulating
              ? 'PAUSE'
              : selectedSeamId
              ? `RUN SEAM ${Math.min(simCurrentSeamIndex + 1, seams.length)}`
              : 'SIMULATE PATH'}
          </span>
        </button>

        {/* Run All link when single seam is selected */}
        {selectedSeamId && !isSimulating && (
          <button
            onClick={() => {
              selectSeam(null);
              startSimulation(null);
            }}
            className="text-[10px] font-mono text-[#7E8F7D] hover:text-[#38BDF8] underline transition px-1"
            title="Deselect and simulate all seams sequentially"
          >
            Run All ({seams.length})
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={resetSimulation}
          className="p-1 hover:bg-white/10 rounded-md text-[#7E8F7D] hover:text-white transition shrink-0"
          title="Reset Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-white/10 shrink-0" />

        {/* Minimalist Phase Badge */}
        <div className="flex items-center gap-1.5 font-mono shrink-0 whitespace-nowrap">
          <span className="text-[10px] text-[#7E8F7D] tracking-wider uppercase">PHASE:</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${currentPhaseStyle.bg} ${currentPhaseStyle.text} ${currentPhaseStyle.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentPhaseStyle.dot}`} />
            <span>{simPhase.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Current Seam indicator with direct step navigation (◀ / ▶) */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#8EA28D] shrink-0 whitespace-nowrap">
          <span className="text-[10px] text-[#7E8F7D] tracking-wider uppercase mr-0.5">SEAM:</span>
          <button
            onClick={() => {
              const prev = Math.max(0, simCurrentSeamIndex - 1);
              setSimCurrentSeamIndex(prev);
              selectSeam(seams[prev]?.id ?? null);
            }}
            disabled={simCurrentSeamIndex === 0}
            className="px-1 text-[10px] hover:text-white disabled:opacity-20 text-[#8EA28D] transition active:scale-95"
            title="Step back to previous seam"
          >
            ◀
          </button>
          <strong className="text-white font-bold px-0.5">
            {Math.min(simCurrentSeamIndex + 1, seams.length)} of {seams.length}
          </strong>
          <button
            onClick={() => {
              const next = Math.min(seams.length - 1, simCurrentSeamIndex + 1);
              setSimCurrentSeamIndex(next);
              selectSeam(seams[next]?.id ?? null);
            }}
            disabled={simCurrentSeamIndex >= seams.length - 1}
            className="px-1 text-[10px] hover:text-white disabled:opacity-20 text-[#8EA28D] transition active:scale-95"
            title="Step forward to next seam"
          >
            ▶
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 shrink-0" />

        {/* Speed Multiplier */}
        <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-lg p-0.5 text-[10px] font-mono shrink-0">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${
                playbackSpeed === spd
                  ? 'bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white shadow-sm'
                  : 'text-[#7E8F7D] hover:text-white'
              }`}
            >
              {spd}X
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
