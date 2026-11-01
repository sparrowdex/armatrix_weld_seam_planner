'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Volume2,
  VolumeX,
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
    simNotice,
    soundEnabled,
    toggleSound,
  } = useWeldStore();

  if (seams.length === 0) return null;

  const phaseColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    idle: { bg: 'bg-[#151D14]', text: 'text-[#889988]', border: 'border-[#233121]', dot: 'bg-[#889988]' },
    rapid_traverse: { bg: 'bg-[#EAB308]/10', text: 'text-[#EAB308]', border: 'border-[#EAB308]/30', dot: 'bg-[#EAB308]' },
    approach: { bg: 'bg-[#38BDF8]/10', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30', dot: 'bg-[#38BDF8]' },
    welding: { bg: 'bg-[#e97f01]/15', text: 'text-[#e97f01]', border: 'border-[#e97f01]/40', dot: 'bg-[#e97f01] shadow-[0_0_8px_#e97f01]' },
    retract: { bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30', dot: 'bg-[#A855F7]' },
    cooling: { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30', dot: 'bg-[#3B82F6]' },
    dry_run: { bg: 'bg-[#F59E0B]/10', text: 'text-[#FBBF24]', border: 'border-[#F59E0B]/40', dot: 'bg-[#F59E0B]' },
  };

  const currentPhaseStyle = phaseColors[simPhase] || phaseColors.idle;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 select-none pointer-events-auto flex flex-col items-center gap-2">
      {simNotice && (
        <div className="ax-notice ax-notice-warn !py-1.5 backdrop-blur-md !bg-[#1F1206]/80 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-px" />
          <span>{simNotice}</span>
        </div>
      )}
      <div className="bg-[#0A0D0A]/85 backdrop-blur-xl border border-[#253224] h-11 pl-1.5 pr-2 rounded-[6px] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] flex items-center gap-3 text-xs text-[#F6F5EE] whitespace-nowrap shrink-0">
        {/* Play / pause (single seam vs all) */}
        <button
          onClick={() => (isSimulating ? pauseSimulation() : startSimulation(selectedSeamId))}
          className={`ax-btn !h-8 shrink-0 ${isSimulating ? '!border-[#F59E0B]/60 !text-[#FBBF24]' : 'ax-btn-primary'}`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="tracking-[0.06em]">
            {isSimulating
              ? 'PAUSE'
              : selectedSeamId
              ? `RUN SEAM ${Math.min(simCurrentSeamIndex + 1, seams.length)}`
              : 'SIMULATE PATH'}
          </span>
        </button>

        {selectedSeamId && !isSimulating && (
          <button
            onClick={() => {
              selectSeam(null);
              startSimulation(null);
            }}
            className="ax-btn ax-btn-ghost !h-7 !px-2 !text-[11px] -ml-1.5"
            title="Deselect and simulate all seams sequentially"
          >
            Run all <span className="ax-num text-[#7D8F7C]">{seams.length}</span>
          </button>
        )}

        <button onClick={resetSimulation} className="ax-icon-btn shrink-0" title="Reset simulation" aria-label="Reset simulation">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleSound}
          className={`ax-icon-btn shrink-0 ${soundEnabled ? '!text-[#e97f01]' : ''}`}
          title={soundEnabled ? 'Mute arc sound' : 'Play arc sound'}
          aria-label={soundEnabled ? 'Mute arc sound' : 'Play arc sound'}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <span className="h-5 w-px bg-[#253224] shrink-0" />

        {/* Phase */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="ax-label">Phase</span>
          <span
            className={`h-5 px-2 rounded-[3px] text-[10px] font-medium tracking-[0.08em] uppercase border flex items-center gap-1.5 ${currentPhaseStyle.bg} ${currentPhaseStyle.text} ${currentPhaseStyle.border}`}
            style={{ fontFamily: 'Onest, sans-serif' }}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentPhaseStyle.dot}`} />
            <span>{simPhase === 'dry_run' ? 'dry run, arc off' : simPhase.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Seam stepper */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="ax-label mr-1">Seam</span>
          <button
            onClick={() => {
              const prev = Math.max(0, simCurrentSeamIndex - 1);
              setSimCurrentSeamIndex(prev);
              selectSeam(seams[prev]?.id ?? null);
            }}
            disabled={simCurrentSeamIndex === 0}
            className="ax-icon-btn !w-6 !h-6"
            title="Step back to previous seam"
            aria-label="Previous seam"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="ax-num text-[12px] text-[#F6F5EE] min-w-[44px] text-center">
            {Math.min(simCurrentSeamIndex + 1, seams.length)} <span className="text-[#7D8F7C]">/ {seams.length}</span>
          </span>
          <button
            onClick={() => {
              const next = Math.min(seams.length - 1, simCurrentSeamIndex + 1);
              setSimCurrentSeamIndex(next);
              selectSeam(seams[next]?.id ?? null);
            }}
            disabled={simCurrentSeamIndex >= seams.length - 1}
            className="ax-icon-btn !w-6 !h-6"
            title="Step forward to next seam"
            aria-label="Next seam"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="h-5 w-px bg-[#253224] shrink-0" />

        {/* Playback speed */}
        <div className="ax-seg shrink-0" role="group" aria-label="Playback speed">
          {[1, 2, 5].map((spd) => (
            <button key={spd} data-active={playbackSpeed === spd} onClick={() => setPlaybackSpeed(spd)} className="ax-num !px-2">
              {spd}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
