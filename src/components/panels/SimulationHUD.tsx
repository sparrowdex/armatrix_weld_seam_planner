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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 select-none pointer-events-auto">
      {/* Sleek Floating Glass Pill Container */}
      <div className="bg-[#0B0F0B]/92 backdrop-blur-md border border-[#223121] px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-3.5 text-xs text-white whitespace-nowrap shrink-0">
        {/* Play/Pause Button */}
        <button
          onClick={() => (isSimulating ? pauseSimulation() : startSimulation())}
          style={{ fontFamily: 'Onest, sans-serif' }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition active:scale-95 shrink-0 shadow-md ${
            isSimulating
              ? 'bg-[#EAB308] text-black hover:brightness-105'
              : 'bg-[#e97f01] hover:brightness-110 text-white'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'PAUSE' : 'SIMULATE PATH'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSimulation}
          className="p-1.5 hover:bg-[#1A2519] rounded-full text-[#7E8F7D] hover:text-white transition shrink-0"
          title="Reset Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#1F2B1D] shrink-0" />

        {/* Polished Minimalist Phase Badge (No emojis, sleek glowing status dot) */}
        <div className="flex items-center gap-1.5 font-mono shrink-0 whitespace-nowrap">
          <span className="text-[10px] text-[#7E8F7D] tracking-wider uppercase">PHASE:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${currentPhaseStyle.bg} ${currentPhaseStyle.text} ${currentPhaseStyle.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentPhaseStyle.dot}`} />
            <span>{simPhase.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Current Seam indicator - strictly locked in 1 line, never stacks */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8EA28D] shrink-0 whitespace-nowrap">
          <span className="text-[10px] text-[#7E8F7D] tracking-wider uppercase">SEAM:</span>
          <strong className="text-white font-bold">
            {Math.min(simCurrentSeamIndex + 1, seams.length)} / {seams.length}
          </strong>
        </div>

        <div className="h-4 w-px bg-[#1F2B1D] shrink-0" />

        {/* Speed Multiplier Pill */}
        <div className="flex items-center bg-[#121A12] border border-[#202E1E] rounded-full p-0.5 text-[10px] font-mono shrink-0">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              style={playbackSpeed === spd ? { backgroundColor: '#e97f01' } : {}}
              className={`px-2 py-0.5 rounded-full font-bold transition ${
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
