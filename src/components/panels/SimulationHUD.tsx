'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const SimulationHUD: React.FC = () => {
  const {
    isSimulating,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    simPhase,
    simCurrentSeamIndex,
    seams,
    playbackSpeed,
    setPlaybackSpeed,
  } = useWeldStore();

  if (seams.length === 0) return null;

  const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
    idle: { bg: 'bg-[#151D14]', text: 'text-[#889988]', border: 'border-[#233121]' },
    rapid_traverse: { bg: 'bg-[#EAB308]/15', text: 'text-[#EAB308]', border: 'border-[#EAB308]/40' },
    approach: { bg: 'bg-[#38BDF8]/15', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/40' },
    welding: { bg: 'bg-[#e97f01]/20', text: 'text-[#e97f01]', border: 'border-[#e97f01]/50' },
    retract: { bg: 'bg-[#A855F7]/15', text: 'text-[#A855F7]', border: 'border-[#A855F7]/40' },
    cooling: { bg: 'bg-[#3B82F6]/15', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/40' },
  };

  const currentPhaseStyle = phaseColors[simPhase] || phaseColors.idle;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 select-none">
      <div className="bg-[#0B0F0B]/90 backdrop-blur-md border border-[#202E1E] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-4 text-xs text-white">
        {/* Play/Pause Button */}
        <button
          onClick={() => (isSimulating ? pauseSimulation() : startSimulation())}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-bold transition active:scale-95 ${
            isSimulating
              ? 'bg-[#EAB308] text-black shadow-md'
              : 'bg-[#e97f01] hover:brightness-110 text-white shadow-md'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'PAUSE' : 'SIMULATE PATH'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSimulation}
          className="p-1.5 hover:bg-[#1A2519] rounded text-[#7E8F7D] hover:text-white transition"
          title="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#1F2B1D]" />

        {/* Status Indicator */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] text-[#7E8F7D]">PHASE:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1.5 ${currentPhaseStyle.bg} ${currentPhaseStyle.text} ${currentPhaseStyle.border}`}
          >
            {simPhase === 'welding' && <Zap className="w-3 h-3 text-[#e97f01] animate-pulse" />}
            {simPhase.replace('_', ' ')}
          </span>
        </div>

        {/* Current Seam indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8EA28D]">
          <span>SEAM:</span>
          <span className="font-bold text-white">
            {Math.min(simCurrentSeamIndex + 1, seams.length)} / {seams.length}
          </span>
        </div>

        <div className="h-4 w-px bg-[#1F2B1D]" />

        {/* Speed multiplier */}
        <div className="flex items-center bg-[#121A12] border border-[#202E1E] rounded p-0.5 text-[10px] font-mono">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              style={playbackSpeed === spd ? { backgroundColor: '#e97f01' } : {}}
              className={`px-2 py-0.5 rounded font-bold transition ${
                playbackSpeed === spd ? 'text-white' : 'text-[#7E8F7D] hover:text-white'
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
