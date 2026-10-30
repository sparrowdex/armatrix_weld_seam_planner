'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Sliders,
  Cpu,
  Zap,
  Shield,
  ChevronRight,
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
    rapidTraverseSpeed,
    exportJobJSON,
    nozzleType,
    setNozzleType,
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
          {/* Process & Joint Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#7C8E7B] font-mono block mb-1">PROCESS</label>
              <select
                value={selectedSeam.parameters.process}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { process: e.target.value as WeldProcess })
                }
                className="w-full bg-[#131B13] border border-[#233121] rounded px-2 py-1.5 text-white text-xs focus:border-[#e97f01] outline-none font-mono"
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
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { jointType: e.target.value as WeldJointType })
                }
                className="w-full bg-[#131B13] border border-[#233121] rounded px-2 py-1.5 text-white text-xs focus:border-[#e97f01] outline-none font-mono"
              >
                <option value="FILLET">Fillet Joint</option>
                <option value="BUTT">Butt Joint</option>
                <option value="LAP">Lap Joint</option>
                <option value="CORNER">Corner Joint</option>
              </select>
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
          </div>

          {/* Torch Orientation & Clearances */}
          <div className="border border-[#1E2B1D] rounded-lg p-2.5 bg-[#0D130D] flex flex-col gap-2.5">
            <span style={{ fontFamily: 'Onest, sans-serif' }} className="text-[11px] font-bold text-[#8EA08D] tracking-wide">
              TORCH ANGLES & CLEARANCE
            </span>

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
        <div style={{ fontFamily: 'Onest, sans-serif' }} className="text-xs font-bold text-white mb-2 tracking-wide">
          ARMATRIX SNAKE-ARM KINEMATICS
        </div>

        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between text-[#7E8F7D]">
            <span>Arm Reach Envelope:</span>
            <span className="text-white font-semibold">3500 mm</span>
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
