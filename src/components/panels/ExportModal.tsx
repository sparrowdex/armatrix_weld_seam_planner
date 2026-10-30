'use client';

import React, { useState } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileJson,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { exportJobJSON } = useWeldStore();
  const [copied, setCopied] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0C120C] border border-[#233121] rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1E291C] flex items-center justify-between bg-[#101710]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#182517] border border-[#283C26] flex items-center justify-center">
              <FileJson className="w-5 h-5 text-[#e97f01]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-sm font-bold text-white tracking-wide">
                  EXPORT ROBOTIC WELD JOB JSON
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#172616] text-[#22C55E] border border-[#233D22]">
                  v1.2.0 Schema
                </span>
              </div>
              <p className="text-[11px] text-[#7E8F7D] mt-0.5">
                Standardized trajectory payload consumed by Armatrix snake-arm kinematics solvers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#141E14] hover:bg-[#1D2C1C] text-[#8EA28D] hover:text-white border border-[#223321] transition"
              title="Open full schema specification in new tab"
            >
              <span>Schema Documentation</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#e97f01]" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#1C271B] rounded-lg text-[#7E8F7D] hover:text-white transition"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Pure Clean JSON Code Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#070A07]">
          <pre className="text-xs text-[#A3E635] font-mono leading-relaxed overflow-x-auto p-4 bg-[#050705] rounded-xl border border-[#182317] selection:bg-[#e97f01]/30">
            {jsonString}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-[#1E291C] flex items-center justify-between bg-[#101710]">
          <div className="flex items-center gap-3 text-xs font-mono text-[#7E8F7D]">
            <span>
              Seams: <strong className="text-white">{jobData.job_summary.total_seams}</strong>
            </span>
            <span>•</span>
            <span>
              Total Weld: <strong className="text-[#22C55E]">{jobData.job_summary.total_weld_length_mm} mm</strong>
            </span>
            <span>•</span>
            <span>
              Est. Cycle: <strong className="text-[#e97f01]">{jobData.job_summary.total_cycle_time_sec}s</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#172216] hover:bg-[#202D1E] text-white text-xs border border-[#273825] transition active:scale-95 font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              style={{ fontFamily: 'Onest, sans-serif', backgroundColor: '#e97f01' }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg hover:brightness-110 text-white text-xs font-bold shadow-md transition active:scale-95"
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
