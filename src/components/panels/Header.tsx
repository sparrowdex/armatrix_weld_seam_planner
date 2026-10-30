'use client';

import React, { useRef } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Upload,
  Box,
  Compass,
  Eye,
  Download,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { STLLoader } from 'three-stdlib';

interface HeaderProps {
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExport }) => {
  const {
    activeModelName,
    setActiveModelName,
    setPart,
    setPartLoading,
    showWireframe,
    toggleWireframe,
    showNormals,
    toggleNormals,
    showBoundingBox,
    toggleBoundingBox,
    showWaypoints,
    toggleWaypoints,
    setViewPreset,
    isSimulating,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    seams,
  } = useWeldStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle custom STL file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPartLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);

        geometry.computeVertexNormals();
        geometry.center();
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const minY = bbox.min.y;
        geometry.translate(0, -minY, 0);

        geometry.computeBoundingBox();
        const finalBox = geometry.boundingBox!;
        const width = parseFloat((finalBox.max.x - finalBox.min.x).toFixed(1));
        const height = parseFloat((finalBox.max.y - finalBox.min.y).toFixed(1));
        const depth = parseFloat((finalBox.max.z - finalBox.min.z).toFixed(1));

        setActiveModelName(file.name);
        setPart({
          name: file.name,
          triangleCount: geometry.attributes.position.count / 3,
          vertexCount: geometry.attributes.position.count,
          dimensions: { width, height, depth },
          boundingBox: {
            min: { x: finalBox.min.x, y: finalBox.min.y, z: finalBox.min.z },
            max: { x: finalBox.max.x, y: finalBox.max.y, z: finalBox.max.z },
          },
        });
      } catch (err) {
        console.error('Failed to parse uploaded STL:', err);
        alert('Invalid STL file format. Please upload a binary or ASCII .stl file.');
      } finally {
        setPartLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <header className="h-14 bg-[#111611] border-b border-[#243022] px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        {/* Armatrix Logo mark (snake segments symbol) */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1A2218] border border-[#2D3C28] rounded">
          <div className="w-2.5 h-6 bg-[#FF5B00] rounded-sm" />
          <div className="w-2.5 h-4 bg-[#FF5B00]/80 rounded-sm" />
          <div className="w-2.5 h-5 bg-[#FF5B00]/60 rounded-sm" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-widest text-sm text-white">ARMATRIX</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF5B00]/20 text-[#FF5B00] border border-[#FF5B00]/40 font-semibold">
              SEAM PLANNER
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#889988]">Autonomous Robotic Welding CAD/CAM</p>
        </div>
      </div>

      {/* Center Controls: Model Selector & View Presets */}
      <div className="flex items-center gap-2">
        {/* Model Presets Dropdown */}
        <div className="relative group">
          <select
            value={activeModelName}
            onChange={(e) => setActiveModelName(e.target.value)}
            className="bg-[#182117] hover:bg-[#202B1F] text-xs font-mono text-[#E2E8F0] px-3 py-1.5 rounded border border-[#2F3E2B] focus:outline-none focus:border-[#FF5B00] transition cursor-pointer"
          >
            <option value="Structural L-Bracket">Benchmark: Structural L-Bracket</option>
            <option value="Pipe T-Joint">Benchmark: Pipe T-Joint</option>
            <option value="Box Flange">Benchmark: Hazardous Box Flange</option>
          </select>
        </div>

        {/* Upload Custom STL Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 bg-[#1F2A1E] hover:bg-[#2A3928] text-xs font-mono text-[#C8D6C5] px-3 py-1.5 rounded border border-[#334630] transition active:scale-95"
          title="Upload your own .stl file"
        >
          <Upload className="w-3.5 h-3.5 text-[#FF5B00]" />
          <span>Upload .STL</span>
        </button>

        {/* View Camera Presets */}
        <div className="h-5 w-px bg-[#2C3B2A] mx-1" />
        <div className="flex items-center bg-[#151D14] border border-[#273524] rounded p-0.5">
          <button
            onClick={() => setViewPreset('iso')}
            className="px-2 py-1 text-[11px] font-mono text-[#99AA99] hover:text-white hover:bg-[#223020] rounded transition"
            title="Isometric View"
          >
            ISO
          </button>
          <button
            onClick={() => setViewPreset('top')}
            className="px-2 py-1 text-[11px] font-mono text-[#99AA99] hover:text-white hover:bg-[#223020] rounded transition"
            title="Top View"
          >
            TOP
          </button>
          <button
            onClick={() => setViewPreset('front')}
            className="px-2 py-1 text-[11px] font-mono text-[#99AA99] hover:text-white hover:bg-[#223020] rounded transition"
            title="Front View"
          >
            FRONT
          </button>
          <button
            onClick={() => setViewPreset('right')}
            className="px-2 py-1 text-[11px] font-mono text-[#99AA99] hover:text-white hover:bg-[#223020] rounded transition"
            title="Right Side View"
          >
            SIDE
          </button>
        </div>

        {/* Viewport Visualization Toggles */}
        <div className="flex items-center bg-[#151D14] border border-[#273524] rounded p-0.5">
          <button
            onClick={toggleWireframe}
            className={`p-1.5 rounded transition ${showWireframe ? 'bg-[#FF5B00] text-white' : 'text-[#889988] hover:text-white'}`}
            title="Toggle Wireframe Mesh"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleNormals}
            className={`p-1.5 rounded transition ${showNormals ? 'bg-[#38BDF8] text-black font-bold' : 'text-[#889988] hover:text-white'}`}
            title="Toggle Torch Vectors & Approach Paths"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleBoundingBox}
            className={`p-1.5 rounded transition ${showBoundingBox ? 'bg-[#EAB308] text-black font-bold' : 'text-[#889988] hover:text-white'}`}
            title="Toggle Bounding Dimensions Box"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions: Simulation Playback & Export JSON */}
      <div className="flex items-center gap-2">
        {seams.length > 0 && (
          <button
            onClick={() => (isSimulating ? pauseSimulation() : startSimulation())}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-semibold transition active:scale-95 ${
              isSimulating
                ? 'bg-[#EAB308] text-black'
                : 'bg-[#1E2E1C] text-[#22C55E] border border-[#2B4028] hover:bg-[#283C25]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : ''}`} />
            <span>{isSimulating ? 'PAUSE SIM' : 'SIMULATE'}</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 bg-[#FF5B00] hover:bg-[#E04F00] text-white px-3.5 py-1.5 rounded font-mono text-xs font-semibold shadow-glow transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT WELD JOB</span>
        </button>
      </div>
    </header>
  );
};
