'use client';

import { Play, X, Sliders, Target, AlertTriangle } from 'lucide-react';
import { useWeldStore } from '@/store/useWeldStore';
import { Vector3D, WeldSeam } from '@/types/weld';
import { getReachSummary, REACH_ENVELOPE_MM } from '@/utils/reach';

/**
 * HTML overlays drawn on top of the WebGL viewport: part label and cursor coordinates, the
 * seam-in-focus card, the kinematics readout, the click-to-weld banner and easter-egg messages.
 * Purely presentational: the viewport passes in its live pointer state and camera focus action.
 */
interface ViewportOverlaysProps {
  isRightCollapsed: boolean;
  onExpandRight?: () => void;
  focusOnSeam: (seam: WeldSeam) => void;
  isCoordsVisible: boolean;
  displayCoords: Vector3D | null;
  displayDist: number | null;
  liveAirGap: { isAirGap: boolean; gapDistanceMm: number } | null;
  measuredDist: number | null;
  activeSnapType: string | null;
}

export function ViewportOverlays({
  isRightCollapsed,
  onExpandRight,
  focusOnSeam,
  isCoordsVisible,
  displayCoords,
  displayDist,
  liveAirGap,
  measuredDist,
  activeSnapType,
}: ViewportOverlaysProps) {
  const activeModelName = useWeldStore((st) => st.activeModelName);
  const seams = useWeldStore((st) => st.seams);
  const selectedSeamId = useWeldStore((st) => st.selectedSeamId);
  const isSimulating = useWeldStore((st) => st.isSimulating);
  const selectSeam = useWeldStore((st) => st.selectSeam);
  const startSimulation = useWeldStore((st) => st.startSimulation);
  const mode = useWeldStore((st) => st.mode);
  const manualStartPoint = useWeldStore((st) => st.manualStartPoint);
  const rapidTraverseSpeed = useWeldStore((st) => st.rapidTraverseSpeed);
  const exportJobJSON = useWeldStore((st) => st.exportJobJSON);
  const part = useWeldStore((st) => st.part);
  const funToast = useWeldStore((st) => st.funToast);
  const funToastKey = useWeldStore((st) => st.funToastKey);

  const selectedSeam = seams.find((sm) => sm.id === selectedSeamId) || null;
  const jobSummary = exportJobJSON().job_summary;
  const partReach = getReachSummary(part);

  return (
    <>
      {/* Easter egg message: plain white text in the middle of the canvas, no container */}
      {funToast && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none px-6 pb-20">
          <p
            key={funToastKey}
            style={{ fontFamily: 'Onest, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 18px rgba(0,0,0,0.6)' }}
            className="ax-fun-float text-center text-[17px] font-medium text-white"
          >
            {funToast}
          </p>
        </div>
      )}

      {/* Part name and live cursor coordinates (bottom-left) */}
      <div className="absolute bottom-5 left-5 z-10 pointer-events-none flex flex-col gap-1.5 select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
        <div className="flex items-baseline gap-2.5">
          <span className="ax-label">Part</span>
          <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-medium text-[#F6F5EE] text-[13px]">{activeModelName}</span>
        </div>

        <div
          className={`ax-num flex items-center gap-3 text-[12px] transition-all duration-700 ease-out ${
            isCoordsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
          }`}
        >
          <span className="text-[#7D8F7C]">
            X <span className="text-[#F6F5EE]">{displayCoords ? displayCoords.x.toFixed(2) : '0.00'}</span>
          </span>
          <span className="text-[#7D8F7C]">
            Y <span className="text-[#F6F5EE]">{displayCoords ? displayCoords.y.toFixed(2) : '0.00'}</span>
          </span>
          <span className="text-[#7D8F7C]">
            Z <span className="text-[#F6F5EE]">{displayCoords ? displayCoords.z.toFixed(2) : '0.00'}</span>
          </span>
          {displayDist !== null && (
            <span className="text-[#e97f01] ml-1">
              Length <span className="text-[#F6F5EE]">{displayDist} mm</span>
            </span>
          )}
        </div>
      </div>

      {/* Seam in focus (shown when the parameters panel is collapsed) */}
      {isRightCollapsed && selectedSeam && !isSimulating && (
        <div className="absolute top-16 right-4 z-30 w-72 max-w-[calc(100vw-2.5rem)] bg-[#0A0D0A]/45 backdrop-blur-md border border-[#253224]/80 rounded-[6px] text-[#F6F5EE] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between px-4 h-10 border-b border-[#253224]/70">
            <div className="flex items-center gap-2">
              <span className="ax-label">Seam in focus</span>
              <span className="ax-chip ax-chip-signal ax-num !h-[18px]">{String(selectedSeam.sequenceOrder).padStart(2, '0')}</span>
            </div>
            <button onClick={() => selectSeam(null)} className="ax-icon-btn -mr-1.5" title="Deselect seam" aria-label="Deselect seam">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pt-3 pb-4">
            <h3 style={{ fontFamily: 'Onest, sans-serif' }} className="text-[14px] font-medium text-[#F6F5EE] truncate">
              {selectedSeam.name}
            </h3>
            <div className="ax-num flex items-center gap-1.5 mt-1 text-[11.5px] text-[#B4C2B3]">
              <span className="text-[#e97f01]">
                {selectedSeam.parameters.jointType.charAt(0) + selectedSeam.parameters.jointType.slice(1).toLowerCase()}
              </span>
              <span className="text-[#7D8F7C]">·</span>
              <span>{selectedSeam.parameters.process}</span>
              <span className="text-[#7D8F7C]">·</span>
              <span>{selectedSeam.length} mm</span>
            </div>

            {selectedSeam.hasAirGap && (
              <div className="ax-notice ax-notice-warn mt-3">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-px" />
                <div>
                  <div className="font-medium text-[#FBBF24]">Air gap — not manufacturable</div>
                  <p className="text-[11px] text-[#FDE68A]/80 mt-0.5">
                    Path bridges {selectedSeam.airGapDistanceMm || 0} mm of empty space with no substrate underneath.
                  </p>
                </div>
              </div>
            )}

            <dl className="grid grid-cols-2 mt-3 border-t border-[#253224]/70">
              {[
                { k: 'Speed', v: `${selectedSeam.parameters.travelSpeed} mm/s` },
                { k: 'Arc power', v: `${selectedSeam.parameters.current} A · ${selectedSeam.parameters.voltage} V` },
                { k: 'Wire feed', v: `${selectedSeam.parameters.wireFeedSpeed} m/min` },
                { k: 'Wire Ø', v: `${selectedSeam.parameters.wireDiameter || 1.2} mm` },
                { k: 'Tilt', v: `${selectedSeam.parameters.torchTiltAngle}°` },
                { k: 'Lead', v: `${selectedSeam.parameters.torchLeadAngle}°` },
              ].map((row, i) => (
                <div key={row.k} className={`py-2 border-b border-[#253224]/70 ${i % 2 === 0 ? 'pr-3 border-r' : 'pl-3'}`}>
                  <dt className="text-[10.5px] text-[#7D8F7C] mb-0.5">{row.k}</dt>
                  <dd className="ax-num text-[12.5px] text-[#F6F5EE]">{row.v}</dd>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <button onClick={() => startSimulation(selectedSeam.id)} className="ax-btn ax-btn-primary !h-8" title="Simulate this specific seam path">
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate</span>
              </button>
              <button onClick={() => focusOnSeam(selectedSeam)} className="ax-btn !h-8 !bg-transparent" title="Re-focus camera on this seam">
                <Target className="w-3.5 h-3.5 text-[#e97f01]" />
                <span>Re-focus</span>
              </button>
            </div>

            {onExpandRight && (
              <button onClick={onExpandRight} className="ax-btn ax-btn-ghost w-full !h-8 mt-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Open parameters panel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Kinematics readout when the parameters panel is collapsed (bottom-right) */}
      <div
        className={`absolute bottom-5 right-5 z-10 pointer-events-none flex flex-col items-end gap-1.5 select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-all duration-700 ease-out ${
          isRightCollapsed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <span className="ax-label">Snake-arm kinematics</span>
        <div className="ax-num flex flex-col items-end gap-0.5 text-[11.5px] text-[#7D8F7C]">
          {partReach && (
            <div className={partReach.withinReach ? '' : 'text-[#FBBF24]'}>
              {partReach.withinReach ? 'Part within reach' : 'Part exceeds reach'}{' '}
              <span className="text-[#F6F5EE]">{partReach.envelopePct}%</span>
            </div>
          )}
          <div>
            Envelope <span className="text-[#F6F5EE]">{REACH_ENVELOPE_MM} mm</span>
          </div>
          <div>
            Traverse <span className="text-[#F6F5EE]">{rapidTraverseSpeed} mm/s</span>
          </div>
          <div>
            Weld length <span className="text-[#F6F5EE]">{jobSummary.total_weld_length_mm} mm</span>
          </div>
          <div>
            Total cycle <span className="text-[#e97f01]">{jobSummary.total_cycle_time_sec} s</span>
          </div>
        </div>
      </div>

      {/* Click-to-weld banner */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 whitespace-nowrap pointer-events-none transition-all duration-300 ease-out ${
          mode === 'add_seam'
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div
          className={`h-9 px-3.5 rounded-[6px] backdrop-blur-md flex items-center gap-3 text-[12px] border transition-colors ${
            liveAirGap?.isAirGap
              ? 'bg-[#1F1206]/85 border-[#F59E0B]/60 text-[#FDE68A]'
              : 'bg-[#0A0D0A]/70 border-[#253224] text-[#F6F5EE]'
          }`}
        >
          {liveAirGap?.isAirGap ? (
            <>
              <span className="flex items-center gap-1.5 text-[#FBBF24] font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>No substrate</span>
              </span>
              <span className="ax-num text-[#FDE68A]/90">
                Bridging {liveAirGap.gapDistanceMm} mm of empty space, not manufacturable
              </span>
            </>
          ) : (
            <>
              <span className="ax-label !text-[#e97f01]">{manualStartPoint ? 'Step 2' : 'Click-to-weld'}</span>
              <span className="ax-num text-[#B4C2B3]">
                {manualStartPoint
                  ? `Click the second point to finish the seam (${measuredDist || 0} mm)`
                  : 'Click the part to anchor the start point'}
              </span>
              <span className="text-[11px] text-[#7D8F7C]">Right-drag or arrow keys to turn the view, Esc to cancel</span>
            </>
          )}
          {activeSnapType && (
            <span className="ax-chip ax-chip-ok !normal-case !tracking-normal !text-[11px] !h-5">
              Snapped to {activeSnapType.toLowerCase().replace('axis lock (', 'axis lock ').replace(')', '')}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
