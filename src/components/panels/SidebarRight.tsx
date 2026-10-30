'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Sliders,
  Cpu,
  Clock,
  Gauge,
  Flame,
  Shield,
  Zap,
  Wind,
  Check,
} from 'lucide-react';
import { WeldJointType, WeldProcess } from '@/types/weld';

export const SidebarRight: React.FC = () => {
  const {
    seams,
    selectedSeamId,
    updateSeamParameters,
    rapidTraverseSpeed,
    setRobotConfig,
    exportJobJSON,
  } = useWeldStore();

  const selectedSeam = seams.find((s) => s.id === selectedSeamId) || seams[0] || null;

  // Compute live cycle estimate
  const jobSummary = exportJobJSON().job_summary;

  return (
    <aside className="w-84 h-full bg-[#111611]/95 border-l border-[#243022] flex flex-col z-10 select-none overflow-y-auto font-mono text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-[#243022] bg-[#141A14] flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-white">
          <Sliders className="w-3.5 h-3.5 text-[#FF5B00]" />
          WELD PARAMETERS
        </span>
        {selectedSeam && (
          <span className="bg-[#202C1E] text-[#FF5B00] px-2 py-0.5 rounded border border-[#2F3E2B] text-[10px] font-bold">
            {selectedSeam.id}
          </span>
        )}
      </div>

      {selectedSeam ? (
        <div className="p-3.5 flex flex-col gap-4">
          {/* Process & Joint Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#889988] block mb-1">PROCESS</label>
              <select
                value={selectedSeam.parameters.process}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { process: e.target.value as WeldProcess })
                }
                className="w-full bg-[#192218] border border-[#2D3F2A] rounded px-2 py-1.5 text-white text-xs focus:border-[#FF5B00] outline-none"
              >
                <option value="MIG">MIG (GMAW)</option>
                <option value="TIG">TIG (GTAW)</option>
                <option value="LASER">Laser Welding</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#889988] block mb-1">JOINT TYPE</label>
              <select
                value={selectedSeam.parameters.jointType}
                onChange={(e) =>
                  updateSeamParameters(selectedSeam.id, { jointType: e.target.value as WeldJointType })
                }
                className="w-full bg-[#192218] border border-[#2D3F2A] rounded px-2 py-1.5 text-white text-xs focus:border-[#FF5B00] outline-none"
              >
                <option value="FILLET">Fillet Weld</option>
                <option value="BUTT">Butt Joint</option>
                <option value="LAP">Lap Joint</option>
                <option value="CORNER">Corner Joint</option>
              </select>
            </div>
          </div>

          {/* Electrical & Travel Parameters */}
          <div className="border border-[#263524] rounded-lg p-2.5 bg-[#141B13] flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-[#889988] flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#EAB308]" />
              ELECTRICAL & MOTION
            </span>

            {/* Travel Speed */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#A0B0A0]">Travel Speed</span>
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
                className="w-full accent-[#FF5B00] h-1 bg-[#233120] rounded cursor-pointer"
              />
            </div>

            {/* Current (A) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#A0B0A0]">Current</span>
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
                className="w-full accent-[#FF5B00] h-1 bg-[#233120] rounded cursor-pointer"
              />
            </div>

            {/* Voltage (V) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#A0B0A0]">Voltage</span>
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
                className="w-full accent-[#FF5B00] h-1 bg-[#233120] rounded cursor-pointer"
              />
            </div>

            {/* Wire Feed Speed */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#A0B0A0]">Wire Feed Speed</span>
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
                className="w-full accent-[#FF5B00] h-1 bg-[#233120] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Torch Angles & Clearance */}
          <div className="border border-[#263524] rounded-lg p-2.5 bg-[#141B13] flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-[#889988] flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#38BDF8]" />
              TORCH ORIENTATION & CLEARANCE
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-[#889988] block">Lead Angle</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.torchLeadAngle}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { torchLeadAngle: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#1A2218] border border-[#2B3B28] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#FF5B00]"
                  />
                  <span className="text-[#889988]">°</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#889988] block">Tilt Angle</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.torchTiltAngle}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { torchTiltAngle: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#1A2218] border border-[#2B3B28] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#FF5B00]"
                  />
                  <span className="text-[#889988]">°</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-[#889988] block">Approach Height</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.approachDistance}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { approachDistance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#1A2218] border border-[#2B3B28] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#FF5B00]"
                  />
                  <span className="text-[#889988]">mm</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#889988] block">Retract Height</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={selectedSeam.parameters.retractDistance}
                    onChange={(e) =>
                      updateSeamParameters(selectedSeam.id, { retractDistance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#1A2218] border border-[#2B3B28] rounded px-2 py-1 text-white text-xs outline-none focus:border-[#FF5B00]"
                  />
                  <span className="text-[#889988]">mm</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#A0B0A0]">Interpass Cooling Delay</span>
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
                className="w-full accent-[#38BDF8] h-1 bg-[#233120] rounded cursor-pointer"
              />
              <span className="text-[9px] text-[#778877] block mt-0.5">
                Controls thermal heat accumulation to avoid metal warping.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-[#778877] text-xs">
          Select or add a seam to adjust parameters.
        </div>
      )}

      {/* Armatrix Snake-Arm Kinematics & Cycle Estimation */}
      <div className="mt-auto p-3.5 border-t border-[#243022] bg-[#141A14]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-2">
          <Cpu className="w-3.5 h-3.5 text-[#FF5B00]" />
          ARMATRIX SNAKE-ARM KINEMATICS
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-[#889988]">
            <span>Arm Reach Envelope:</span>
            <span className="text-white font-semibold">3500 mm (Hyper-redundant)</span>
          </div>
          <div className="flex justify-between text-[#889988]">
            <span>Rapid Traverse Speed:</span>
            <span className="text-white font-semibold">{rapidTraverseSpeed} mm/s</span>
          </div>
          <div className="flex justify-between text-[#889988]">
            <span>Total Weld Seam Length:</span>
            <span className="text-[#22C55E] font-semibold">{jobSummary.total_weld_length_mm} mm</span>
          </div>
          <div className="flex justify-between text-[#889988]">
            <span>Active Arc Weld Time:</span>
            <span className="text-white font-semibold">{jobSummary.estimated_active_weld_time_sec}s</span>
          </div>
          <div className="flex justify-between text-[#889988]">
            <span>Rapid Move & Cooling:</span>
            <span className="text-white font-semibold">
              {(jobSummary.estimated_traverse_time_sec + jobSummary.estimated_cooling_delays_sec).toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between text-white font-bold pt-1.5 border-t border-[#233020]">
            <span className="text-[#FF5B00]">ESTIMATED TOTAL CYCLE:</span>
            <span>{jobSummary.total_cycle_time_sec}s</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
