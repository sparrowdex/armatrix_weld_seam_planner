'use client';

import React, { useRef } from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import {
  Upload,
  Box,
  Compass,
  Download,
  Play,
  Pause,
  Layers,
} from 'lucide-react';
import { STLLoader } from 'three-stdlib';
import { ArmatrixLogo } from '@/components/ui/ArmatrixLogo';

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
    setViewPreset,
    isSimulating,
    startSimulation,
    pauseSimulation,
    seams,
  } = useWeldStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert('Invalid STL file format. Please upload a valid .stl file.');
      } finally {
        setPartLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <header className="h-14 bg-[#0A0D0A] border-b border-[#1E291C] px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        {/* Exact Armatrix Logo Symbol */}
        <div className="p-1 bg-[#121912] border border-[#253323] rounded flex items-center justify-center shadow-sm">
          <ArmatrixLogo className="w-6 h-6" color="#e97f01" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-bold tracking-wider text-sm text-white">
              ARMATRIX
            </span>
            <span
              style={{ fontFamily: 'Onest, sans-serif', color: '#e97f01' }}
              className="text-[11px] px-1.5 py-0.5 rounded bg-[#e97f01]/15 border border-[#e97f01]/35 font-bold tracking-wide"
            >
              WELD SEAM PLANNER
            </span>
          </div>
          <p className="text-[10px] text-[#7E8F7D] tracking-wide">Autonomous Robotic Welding System</p>
        </div>
      </div>

      {/* Center Controls: Model Selector & View Presets */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={activeModelName}
            onChange={(e) => setActiveModelName(e.target.value)}
            className="bg-[#121912] hover:bg-[#1A231A] text-xs font-mono text-[#DCE6DB] px-3 py-1.5 rounded border border-[#283626] focus:outline-none focus:border-[#e97f01] transition cursor-pointer"
          >
            <option value="Structural L-Bracket">Benchmark: Structural L-Bracket</option>
            <option value="Armatrix Emblem">Benchmark: Armatrix Emblem Plaque</option>
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
          className="flex items-center gap-1.5 bg-[#172016] hover:bg-[#202C1F] text-xs font-mono text-[#C2D1C1] px-3 py-1.5 rounded border border-[#2B3B29] transition active:scale-95"
          title="Upload custom .stl CAD part"
        >
          <Upload className="w-3.5 h-3.5 text-[#e97f01]" />
          <span>Upload .STL</span>
        </button>

        {/* View Camera Presets */}
        <div className="h-5 w-px bg-[#202B1E] mx-1" />
        <div className="flex items-center bg-[#101710] border border-[#202B1E] rounded p-0.5">
          <button
            onClick={() => setViewPreset('iso')}
            className="px-2 py-1 text-[11px] font-mono text-[#8C9E8B] hover:text-white hover:bg-[#1D281C] rounded transition"
          >
            ISO
          </button>
          <button
            onClick={() => setViewPreset('top')}
            className="px-2 py-1 text-[11px] font-mono text-[#8C9E8B] hover:text-white hover:bg-[#1D281C] rounded transition"
          >
            TOP
          </button>
          <button
            onClick={() => setViewPreset('front')}
            className="px-2 py-1 text-[11px] font-mono text-[#8C9E8B] hover:text-white hover:bg-[#1D281C] rounded transition"
          >
            FRONT
          </button>
          <button
            onClick={() => setViewPreset('right')}
            className="px-2 py-1 text-[11px] font-mono text-[#8C9E8B] hover:text-white hover:bg-[#1D281C] rounded transition"
          >
            SIDE
          </button>
        </div>

        {/* Viewport Visualization Toggles */}
        <div className="flex items-center bg-[#101710] border border-[#202B1E] rounded p-0.5">
          <button
            onClick={toggleWireframe}
            className={`p-1.5 rounded transition ${showWireframe ? 'bg-[#e97f01] text-white' : 'text-[#7D8F7C] hover:text-white'}`}
            title="Wireframe View"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleNormals}
            className={`p-1.5 rounded transition ${showNormals ? 'bg-[#38BDF8] text-black font-bold' : 'text-[#7D8F7C] hover:text-white'}`}
            title="Torch Normals & Approach Clearance Vectors"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleBoundingBox}
            className={`p-1.5 rounded transition ${showBoundingBox ? 'bg-[#e97f01] text-black font-bold' : 'text-[#7D8F7C] hover:text-white'}`}
            title="Bounding Dimensions Envelope"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions: Simulation & Export */}
      <div className="flex items-center gap-2">
        {seams.length > 0 && (
          <button
            onClick={() => (isSimulating ? pauseSimulation() : startSimulation())}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition active:scale-95 ${
              isSimulating
                ? 'bg-[#EAB308] text-black'
                : 'bg-[#182317] text-[#22C55E] border border-[#253624] hover:bg-[#202E1F]'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? 'PAUSE' : 'SIMULATE'}</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          style={{ fontFamily: 'Onest, sans-serif', backgroundColor: '#e97f01' }}
          className="flex items-center gap-1.5 hover:brightness-110 text-white px-3.5 py-1.5 rounded text-xs font-bold transition active:scale-95 shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT WELD JOB</span>
        </button>
      </div>
    </header>
  );
};
