'use client';

import React, { useState } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  X,
  Copy,
  Check,
  Download,
  Code,
  BookOpen,
  FileJson,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { exportJobJSON } = useWeldStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'schema'>('json');

  if (!isOpen) return null;

  const jobData = exportJobJSON();
  const jsonString = JSON.stringify(jobData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jobData.job_id.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="bg-[#111711] border border-[#2D3F2A] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#243322] flex items-center justify-between bg-[#151D14]">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-[#FF5B00]" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                EXPORT ROBOTIC WELD JOB JSON
              </h2>
              <p className="text-[11px] text-[#889988]">
                Standard format consumed by Armatrix Snake-Arm Motion Controller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-[#192318] p-1 rounded border border-[#2A3B28]">
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 text-xs rounded transition flex items-center gap-1.5 ${
                  activeTab === 'json' ? 'bg-[#FF5B00] text-white font-bold' : 'text-[#889988] hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON Payload</span>
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1 text-xs rounded transition flex items-center gap-1.5 ${
                  activeTab === 'schema' ? 'bg-[#FF5B00] text-white font-bold' : 'text-[#889988] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Schema Docs</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#223120] rounded text-[#889988] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0B0E0B]">
          {activeTab === 'json' ? (
            <pre className="text-xs text-[#A0E2A0] font-mono leading-relaxed overflow-x-auto p-3 bg-[#080B08] rounded-lg border border-[#1E2C1D]">
              {jsonString}
            </pre>
          ) : (
            <div className="space-y-4 text-xs font-mono text-[#C8D6C5]">
              <div className="p-3 bg-[#131C13] rounded-lg border border-[#233322]">
                <h3 className="font-bold text-[#FF5B00] text-sm mb-1">
                  Armatrix Autonomous Weld Job Schema (v1.2.0)
                </h3>
                <p className="text-[#889988] text-[11px]">
                  Engineered specifically for hyper-redundant snake manipulators reaching inside confined structural geometries (double hulls, heat exchangers, chemical pipelines).
                </p>
              </div>

              <div className="space-y-3">
                <div className="border border-[#223321] rounded p-2.5 bg-[#121912]">
                  <span className="text-[#FF5B00] font-bold block mb-1">metadata & part</span>
                  <p className="text-[#889988] text-[11px]">
                    Identifies job session ID, timestamp, part filename, and 3D bounding dimensions in millimeters.
                  </p>
                </div>

                <div className="border border-[#223321] rounded p-2.5 bg-[#121912]">
                  <span className="text-[#38BDF8] font-bold block mb-1">robot_controller_profile</span>
                  <p className="text-[#889988] text-[11px]">
                    Specifies kinematics limits (e.g. 3500mm snake arm reach), maximum safe rapid traverse speed (120 mm/s), and clearance height above part surface to avoid internal collisions during arm repositioning.
                  </p>
                </div>

                <div className="border border-[#223321] rounded p-2.5 bg-[#121912]">
                  <span className="text-[#22C55E] font-bold block mb-1">approach_point & retract_point</span>
                  <p className="text-[#889988] text-[11px]">
                    Critical for confined spaces: the snake arm approaches normal to the surface at a standoff distance, touches off the start point, travels along the seam, and retracts outward before traversing to the next seam.
                  </p>
                </div>

                <div className="border border-[#223321] rounded p-2.5 bg-[#121912]">
                  <span className="text-[#EAB308] font-bold block mb-1">torch_orientation (lead & tilt angles)</span>
                  <p className="text-[#889988] text-[11px]">
                    Controls torch angle relative to the seam surface normal for proper penetration profile and puddle shielding.
                  </p>
                </div>

                <div className="border border-[#223321] rounded p-2.5 bg-[#121912]">
                  <span className="text-[#F43F5E] font-bold block mb-1">weld_parameters & interpass_delay_sec</span>
                  <p className="text-[#889988] text-[11px]">
                    Process parameters (travel speed, amperage, voltage, wire feed, gas flow) plus interpass cooling delays to prevent thermal distortion when welding adjacent plates.
                  </p>
                </div>

                <div className="border border-[#223321] rounded p-2.5 bg-[#121912]">
                  <span className="text-[#A855F7] font-bold block mb-1">waypoints</span>
                  <p className="text-[#889988] text-[11px]">
                    High-density discretized 3D spline trajectory coordinates (5mm pitch) fed directly into the inverse kinematics (IK) solver of the robot controller.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-[#243322] flex items-center justify-between bg-[#151D14]">
          <span className="text-xs text-[#889988]">
            {jobData.job_summary.total_seams} Seams | {jobData.job_summary.total_weld_length_mm} mm Total Weld Length
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1F2C1E] hover:bg-[#2B3C2A] text-white text-xs border border-[#31462F] transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#FF5B00] hover:bg-[#E04F00] text-white text-xs font-semibold shadow-glow transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD JSON FILE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
