'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Zap,
  Activity,
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
    idle: { bg: 'bg-[#182217]', text: 'text-[#889988]', border: 'border-[#283827]' },
    rapid_traverse: { bg: 'bg-[#EAB308]/20', text: 'text-[#EAB308]', border: 'border-[#EAB308]/40' },
    approach: { bg: 'bg-[#38BDF8]/20', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/40' },
    welding: { bg: 'bg-[#FF5B00]/25', text: 'text-[#FF5B00]', border: 'border-[#FF5B00]/60' },
    retract: { bg: 'bg-[#A855F7]/20', text: 'text-[#A855F7]', border: 'border-[#A855F7]/40' },
    cooling: { bg: 'bg-[#3B82F6]/20', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/40' },
  };

  const currentPhaseStyle = phaseColors[simPhase] || phaseColors.idle;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 select-none">
      <div className="bg-[#111711]/90 backdrop-blur-md border border-[#2D3F2A] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-4 font-mono text-xs text-white">
        {/* Play/Pause Button */}
        <button
          onClick={() => (isSimulating ? pauseSimulation() : startSimulation())}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition active:scale-95 ${
            isSimulating
              ? 'bg-[#EAB308] text-black shadow-md'
              : 'bg-[#FF5B00] hover:bg-[#E04F00] text-white shadow-glow'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'PAUSE' : 'SIMULATE PATH'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSimulation}
          className="p-1.5 hover:bg-[#1E2A1D] rounded text-[#889988] hover:text-white transition"
          title="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#263724]" />

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#889988]">PHASE:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1.5 ${currentPhaseStyle.bg} ${currentPhaseStyle.text} ${currentPhaseStyle.border}`}
          >
            {simPhase === 'welding' && <Zap className="w-3 h-3 text-[#FF5B00] animate-bounce" />}
            {simPhase.replace('_', ' ')}
          </span>
        </div>

        {/* Current Seam indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#9CB099]">
          <span>SEAM:</span>
          <span className="font-bold text-white">
            {Math.min(simCurrentSeamIndex + 1, seams.length)} / {seams.length}
          </span>
        </div>

        <div className="h-4 w-px bg-[#263724]" />

        {/* Speed multiplier */}
        <div className="flex items-center bg-[#172116] border border-[#263725] rounded p-0.5 text-[10px]">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-0.5 rounded font-bold transition ${
                playbackSpeed === spd ? 'bg-[#FF5B00] text-white' : 'text-[#889988] hover:text-white'
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
