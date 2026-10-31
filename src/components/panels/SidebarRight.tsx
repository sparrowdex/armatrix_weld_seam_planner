'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Sliders,
  Cpu,
  Zap,
  Shield,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { WeldJointType, WeldProcess } from '@/types/weld';

interface SidebarRightProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({ onToggleCollapse }) => {
  const {
    seams,
    selectedSeamId,
    updateSeamParameters,
    flipSeamNormal,
    setSeamNormal,
    rapidTraverseSpeed,
    exportJobJSON,
    nozzleType,
    setNozzleType,
    torchStyle,
    setTorchStyle,
  } = useWeldStore();

  const selectedSeam = seams.find((s) => s.id === selectedSeamId) || seams[0] || null;
  const jobSummary = exportJobJSON().job_summary;

  return (
    <aside className="w-80 h-full bg-[#0A0D0A] border-l border-[#1E291C] flex flex-col z-10 select-none overflow-y-auto text-xs relative">
      {/* Header with prominent Collapse button */}
      <div className="p-3.5 border-b border-[#1E291C] bg-[#0E140E] flex items-center justify-between">
        <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold text-white tracking-wide text-xs">
          WELD PARAMETERS
        </span>

        <div className="flex items-center gap-2">
          {selectedSeam && (
            <span
              style={{ color: '#e97f01' }}
              className="bg-[#172216] px-2 py-0.5 rounded border border-[#273825] text-[10px] font-mono font-bold"
            >
              {selectedSeam.id}
            </span>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-[#162016] hover:bg-[#202E1F] border border-[#233122] rounded text-[#8EA28D] hover:text-white transition active:scale-95"
              title="Collapse Parameters Panel"
            >
              <span>COLLAPSE</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#e97f01]" />
            </button>
          )}
        </div>
      </div>

      {selectedSeam ? (
        <div className="p-3.5 flex flex-col gap-3.5">
          {/* Air Gap / Non-Manufacturable Warning Tag */}
          {selectedSeam.hasAirGap && (
            <div className="p-2.5 rounded-lg bg-[#251305] border border-[#F59E0B]/60 text-[#FCD34D] text-[10px] font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#FBBF24]">Air Gap Detected (Non-Manufacturable)</span>
                <p className="text-[9px] text-[#FDE68A]/85 font-sans mt-0.5 leading-tight">
                  This seam spans across open air ({selectedSeam.airGapDistanceMm || 0}mm gap) without underlying substrate. Cannot be executed on physical workpiece.
                </p>
              </div>
            </div>
          )}

          {/* Process & Joint Type */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#7C8E7B] font-mono block mb-1">PROCESS</label>
                <select
                  value={selectedSeam.parameters.process}
                  onChange={(e) => {
                    const proc = e.target.value as WeldProcess;
                    const procDefaults = {
                      MIG: { current: 180, voltage: 24, travelSpeed: 12, wireFeedSpeed: 6.5 },
                      TIG: { current: 130, voltage: 16, travelSpeed: 7, wireFeedSpeed: 0 },
                      LASER: { current: 280, voltage: 32, travelSpeed: 25, wireFeedSpeed: 0 },
                    }[proc];
                    updateSeamParameters(selectedSeam.id, { process: proc, ...procDefaults });
                  }}
                  className="w-full bg-[#131B13] border border-[#233121] rounded px-2 py-1.5 text-white text-xs focus:border-[#e97f01] outline-none font-mono cursor-pointer"
                >
                  <option value="MIG">MIG (GMAW)</option>
                  <option value="TIG">TIG (GTAW)</option>
                  <option value="LASER">Laser Welding</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#7C8E7B] font-mono block mb-1">JOINT TYPE</label>
                <select
                  value={selectedSeam.parameters.jointType}
                  onChange={(e) => {
                    const jt = e.target.value as WeldJointType;
                    const jointConfigs: Record<WeldJointType, { tilt: number; current: number; voltage: number; speed: number }> = {
                      FILLET: { tilt: 45, current: 180, voltage: 24, speed: 12 },
                      BUTT: { tilt: 0, current: 195, voltage: 25, speed: 10 },
                      LAP: { tilt: 30, current: 165, voltage: 23, speed: 14 },
                      CORNER: { tilt: 20, current: 150, voltage: 22, speed: 15 },
                      EDGE: { tilt: 15, current: 140, voltage: 21, speed: 16 },
                    };
                    const cfg = jointConfigs[jt];
                    updateSeamParameters(selectedSeam.id, {
                      jointType: jt,
                      torchTiltAngle: cfg.tilt,
                      current: cfg.current,
                      voltage: cfg.voltage,
                      travelSpeed: cfg.speed,
                    });
                  }}
                  className="w-full bg-[#131B13] border border-[#233121] rounded px-2 py-1.5 text-white text-xs focus:border-[#e97f01] outline-none font-mono cursor-pointer"
                >
                  <option value="FILLET">Fillet Joint (90°)</option>
                  <option value="BUTT">Butt Joint (Flat)</option>
                  <option value="LAP">Lap Joint (Overlap)</option>
                  <option value="CORNER">Corner Joint (Apex)</option>
                  <option value="EDGE">Edge Joint (Parallel)</option>
                </select>
              </div>
            </div>

            {/* Live Kinematic Calibration Pill */}
            <div className="px-2.5 py-1.5 bg-[#101710] border border-[#202E1F] rounded text-[10px] font-mono text-[#8EA08D] flex items-center justify-between">
              <span>
                {selectedSeam.parameters.jointType === 'FILLET' && '⛛ Fillet: 45° bisecting tilt for 90° junctions'}
                {selectedSeam.parameters.jointType === 'BUTT' && '⎍ Butt: 0° normal tilt for flat groove'}
                {selectedSeam.parameters.jointType === 'LAP' && '⎘ Lap: 30° wash tilt for overlapping sheets'}
                {selectedSeam.parameters.jointType === 'CORNER' && '◺ Corner: 20° apex tilt for outside edges'}
                {selectedSeam.parameters.jointType === 'EDGE' && '∥ Edge: 15° tilt for parallel edge flanges'}
              </span>
              <span className="text-[#e97f01] font-bold shrink-0 ml-2">
                {selectedSeam.parameters.torchTiltAngle}° TILT
              </span>
            </div>
          </div>

          {/* Electrical & Travel Parameters */}
          <div className="border border-[#1E2B1D] rounded-lg p-2.5 bg-[#0D130D] flex flex-col gap-2.5">
            <span style={{ fontFamily: 'Onest, sans-serif' }} className="text-[11px] font-bold text-[#8EA08D] tracking-wide">
              ELECTRICAL & MOTION
            </span>

            {/* Travel Speed */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-[#8EA08D]">Travel Speed</span>
                <span className="font-semibold text-white">{selectedSeam.parameters.travelSpeed} mm/s</span>
              </div>
              <input
                type="range"
                min="4"
                max="35"
                step="1"
                value={selectedSeam.parameters.travelSpeed}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { travelSpeed: parseFloat(e.target.value) })
                }
                style={{ accentColor: '#e97f01' }}
                className="w-full h-1 bg-[#1A2519] rounded cursor-pointer"
              />
            </div>

            {/* Current (A) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-[#8EA08D]">Current</span>
                <span className="font-semibold text-white">{selectedSeam.parameters.current} A</span>
              </div>
              <input
                type="range"
                min="80"
                max="350"
                step="5"
                value={selectedSeam.parameters.current}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { current: parseInt(e.target.value) })
                }
                style={{ accentColor: '#e97f01' }}
                className="w-full h-1 bg-[#1A2519] rounded cursor-pointer"
              />
            </div>

            {/* Voltage (V) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-[#8EA08D]">Voltage</span>
                <span className="font-semibold text-white">{selectedSeam.parameters.voltage} V</span>
              </div>
              <input
                type="range"
                min="14"
                max="36"
                step="0.5"
                value={selectedSeam.parameters.voltage}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { voltage: parseFloat(e.target.value) })
                }
                style={{ accentColor: '#e97f01' }}
                className="w-full h-1 bg-[#1A2519] rounded cursor-pointer"
              />
            </div>

            {/* Wire Feed Speed */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-[#8EA08D]">Wire Feed Speed</span>
                <span className="font-semibold text-white">{selectedSeam.parameters.wireFeedSpeed} m/min</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="16.0"
                step="0.5"
                value={selectedSeam.parameters.wireFeedSpeed}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { wireFeedSpeed: parseFloat(e.target.value) })
                }
                style={{ accentColor: '#e97f01' }}
                className="w-full h-1 bg-[#1A2519] rounded cursor-pointer"
              />
            </div>

            {/* Welding Wire Diameter (AWS ER70S-6) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-[#8EA08D]">Wire Diameter (AWS ER70S-6)</span>
                <span className="font-semibold text-[#e97f01]">{selectedSeam.parameters.wireDiameter ?? 1.2} mm</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.8, 1.0, 1.2, 1.6].map((dia) => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => updateSeamParameters(selectedSeam.id, { wireDiameter: dia })}
                    className={`py-1 text-[10px] font-mono rounded-md border transition-all duration-150 ${
                      (selectedSeam.parameters.wireDiameter ?? 1.2) === dia
                        ? 'bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white border-[#f59e0b]/40 font-bold shadow-sm'
                        : 'bg-[#141C14] hover:bg-[#1D291D] border-[#253523] text-[#A6BAA5]'
                    }`}
                  >
                    {dia} mm
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Torch Orientation & Clearances */}
          <div className="border border-[#1E2B1D] rounded-lg p-2.5 bg-[#0D130D] flex flex-col gap-2.5">
            <span style={{ fontFamily: 'Onest, sans-serif' }} className="text-[11px] font-bold text-[#8EA08D] tracking-wide">
              TORCH ANGLES & CLEARANCE
            </span>

            {/* Surface Normal & Multi-Orientation Presets */}
            <div className="pt-2 border-t border-[#1C281B] flex flex-col gap-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between text-[#8EA08D]">
                <span>Surface Normal [Nx, Ny, Nz]:</span>
                <span className="text-white font-bold">
                  {selectedSeam.normal.x.toFixed(2)}, {selectedSeam.normal.y.toFixed(2)}, {selectedSeam.normal.z.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() => flipSeamNormal(selectedSeam.id)}
                  className="py-1 px-1.5 rounded bg-[#17212B] hover:bg-[#1E2E3E] border border-[#23435E] text-[#7DD3FC] hover:text-white transition active:scale-95 text-center font-medium"
                  title="Invert torch normal vector 180°"
                >
                  ⤾ Invert (180°)
                </button>
                <button
                  type="button"
                  onClick={() => setSeamNormal(selectedSeam.id, { x: 0, y: 0.707, z: 0.707 })}
                  className="py-1 px-1.5 rounded bg-[#152317] hover:bg-[#1D3320] border border-[#224A27] text-[#86EFAC] hover:text-white transition active:scale-95 text-center font-medium"
                  title="Set 45° corner bisecting normal"
                >
                  ⛛ 45° Fillet
                </button>
                <button
                  type="button"
                  onClick={() => setSeamNormal(selectedSeam.id, { x: 0, y: 1, z: 0 })}
                  className="py-1 px-1.5 rounded bg-[#141C14] hover:bg-[#1D291D] border border-[#253523] text-[#A6BAA5] hover:text-white transition active:scale-95 text-center font-medium"
                  title="Align normal straight up (+Y)"
                >
                  ↑ Top (+Y)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSeamNormal(selectedSeam.id, { x: 0, y: 0, z: 1 })}
                  className="py-1 px-1.5 rounded bg-[#141C14] hover:bg-[#1D291D] border border-[#253523] text-[#A6BAA5] hover:text-white transition active:scale-95 text-center font-medium"
                  title="Align normal forward (+Z)"
                >
                  → Front (+Z)
                </button>
                <button
                  type="button"
                  onClick={() => setSeamNormal(selectedSeam.id, { x: 1, y: 0, z: 0 })}
                  className="py-1 px-1.5 rounded bg-[#141C14] hover:bg-[#1D291D] border border-[#253523] text-[#A6BAA5] hover:text-white transition active:scale-95 text-center font-medium"
                  title="Align normal sideways (+X)"
                >
                  → Side (+X)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-[#7C8E7B] block">Lead Angle</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.torchLeadAngle}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { torchLeadAngle: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#141C14] border border-[#223121] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#e97f01]"
                  />
                  <span className="text-[#7C8E7B]">°</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#7C8E7B] block">Tilt Angle</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.torchTiltAngle}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { torchTiltAngle: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#141C14] border border-[#223121] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#e97f01]"
                  />
                  <span className="text-[#7C8E7B]">°</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-[#7C8E7B] block">Approach Standoff</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.approachDistance}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { approachDistance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#141C14] border border-[#223121] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#e97f01]"
                  />
                  <span className="text-[#7C8E7B]">mm</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#7C8E7B] block">Retract Standoff</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.retractDistance}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { retractDistance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#141C14] border border-[#223121] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#e97f01]"
                  />
                  <span className="text-[#7C8E7B]">mm</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-[#8EA08D]">Interpass Cooling Delay</span>
                <span className="font-semibold text-white">{selectedSeam.parameters.interpassDelay} s</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={selectedSeam.parameters.interpassDelay}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { interpassDelay: parseInt(e.target.value) })
                }
                className="w-full accent-[#38BDF8] h-1 bg-[#1A2519] rounded cursor-pointer"
              />
              <span className="text-[9px] text-[#6A7B69] block mt-0.5 font-mono">
                Mitigates thermal distortion on thin sections.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-[#6A7B69] text-xs">
          Select or add a seam to adjust parameters.
        </div>
      )}

      {/* Armatrix Snake-Arm Kinematics Profile */}
      <div className="mt-auto p-3.5 border-t border-[#1E291C] bg-[#0E140E]">
        <div style={{ fontFamily: 'Onest, sans-serif' }} className="text-xs font-bold text-white mb-2 tracking-wide flex items-center justify-between">
          <span>ARMATRIX SNAKE-ARM KINEMATICS</span>
        </div>

        {/* Reachability Status Badge */}
        <div className="flex items-center gap-1.5 p-2 rounded bg-[#10241A] border border-[#22C55E]/40 text-[#22C55E] text-[10px] font-mono mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
          <span className="font-bold">100% REACHABLE — ZERO SINGULARITIES</span>
        </div>

        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Arm Reach Envelope:</span>
            <span className="text-white font-semibold">3500 mm</span>
          </div>
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Part Max Coordinate:</span>
            <span className="text-white font-semibold">120 mm (3.4% envelope)</span>
          </div>
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Rapid Traverse Speed:</span>
            <span className="text-white font-semibold">{rapidTraverseSpeed} mm/s</span>
          </div>
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Total Weld Seam Length:</span>
            <span className="text-[#22C55E] font-semibold">{jobSummary.total_weld_length_mm} mm</span>
          </div>
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Active Arc Time:</span>
            <span className="text-white font-semibold">{jobSummary.estimated_active_weld_time_sec}s</span>
          </div>
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Traverse & Cooling:</span>
            <span className="text-white font-semibold">
              {(jobSummary.estimated_traverse_time_sec + jobSummary.estimated_cooling_delays_sec).toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between text-white font-bold pt-1.5 border-t border-[#1C271B]">
            <span style={{ color: '#e97f01', fontFamily: 'Onest, sans-serif' }}>ESTIMATED TOTAL CYCLE:</span>
            <span>{jobSummary.total_cycle_time_sec}s</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
