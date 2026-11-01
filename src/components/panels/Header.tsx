'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useWeldStore } from '@/store/useWeldStore';
import { Upload, Download, ChevronDown, Keyboard } from 'lucide-react';
import { STLLoader } from 'three-stdlib';
import { ArmatrixLogo } from '@/components/ui/ArmatrixLogo';

interface HeaderProps {
  onOpenExport: () => void;
}

type ViewKey = 'iso' | 'top' | 'front' | 'right';

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'iso', label: 'ISO' },
  { key: 'top', label: 'TOP' },
  { key: 'front', label: 'FRONT' },
  { key: 'right', label: 'SIDE' },
];

export const Header: React.FC<HeaderProps> = ({ onOpenExport }) => {
  const {
    activeModelName,
    setActiveModelName,
    customModels,
    addCustomModel,
    setPart,
    setPartLoading,
    showWireframe,
    toggleWireframe,
    showNormals,
    toggleNormals,
    showBoundingBox,
    toggleBoundingBox,
    showPlaten,
    togglePlaten,
    showXRay,
    toggleXRay,
    setViewPreset,
    logoWiggleKey,
    setShortcutsOpen,
    activeView,
  } = useWeldStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
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

        addCustomModel(file.name, buffer);
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
        // Handled in-app: a quiet warning instead of a browser alert or a red console error
        console.warn('Could not read uploaded STL:', err);
        useWeldStore
          .getState()
          .showFunToast(
            `${file.name} couldn’t be read as an STL. Check that it is a binary or ASCII STL export, and not empty.`,
            'warn'
          );
      } finally {
        setPartLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const layers = [
    { label: 'Table', active: showPlaten, onClick: togglePlaten, title: 'Fixture platen table (clamps camera orbit to table surface)' },
    { label: 'X-Ray', active: showXRay, onClick: toggleXRay, title: 'Translucent ghost view to inspect internal and cavity seams' },
    { label: 'Vectors', active: showNormals, onClick: toggleNormals, title: 'Approach and retract clearance vectors' },
    { label: 'Wireframe', active: showWireframe, onClick: toggleWireframe, title: 'Wireframe mesh overlay' },
    { label: 'Bounds', active: showBoundingBox, onClick: toggleBoundingBox, title: 'Part bounding dimensions box' },
  ];

  return (
    <header className="h-14 bg-transparent px-5 flex items-center justify-between gap-4 z-20 select-none pointer-events-auto">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 shrink-0 group"
        title="Return to Armatrix homepage"
      >
        {/* key change restarts the wiggle animation */}
        <span key={logoWiggleKey} className={`shrink-0 ${logoWiggleKey > 0 ? 'ax-snake-wiggle' : ''}`}>
          <ArmatrixLogo className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105" color="#e97f01" />
        </span>
        <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-semibold tracking-[0.14em] text-[12px] text-[#F6F5EE]">
          ARMATRIX
        </span>
        <span className="hidden xl:block h-4 w-px bg-[#253224]" />
        <span className="hidden xl:block ax-label">Weld Seam Planner</span>
      </Link>

      {/* Command bar */}
      <div className="flex items-center gap-3 min-w-0 overflow-x-auto">
        {/* Workpiece */}
        <div className="flex items-center gap-1.5 shrink-0" data-tour="part">
          <div className="relative flex items-center">
            <select
              value={activeModelName}
              onChange={(e) => setActiveModelName(e.target.value)}
              className="ax-input !h-7 !text-[12px] max-w-[200px] truncate !bg-[#0A0D0A]/60"
              title="Switch CAD workpiece"
            >
              <optgroup label="Standard parts">
                <option value="Structural L-Bracket">Structural L-Bracket</option>
                <option value="Pipe T-Joint">Pipe T-Joint</option>
                <option value="Confined Box Flange">Confined Box Flange</option>
              </optgroup>
              {customModels.length > 0 && (
                <optgroup label="Uploaded STLs">
                  {customModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7D8F7C] absolute right-2 pointer-events-none" />
          </div>

          <input ref={fileInputRef} type="file" accept=".stl" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ax-btn !h-7 !bg-[#0A0D0A]/60"
            title="Upload custom .stl CAD part"
          >
            <Upload className="w-3.5 h-3.5 text-[#e97f01]" />
            <span>Upload STL</span>
          </button>
        </div>

        <span className="h-4 w-px bg-[#253224] shrink-0" />

        {/* Camera presets */}
        <div className="ax-seg shrink-0" role="group" aria-label="Camera view">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              data-active={activeView === v.key}
              onClick={() => {
                setViewPreset(v.key);
              }}
              title={`Snap camera to ${v.label} view`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <span className="h-4 w-px bg-[#253224] shrink-0" />

        {/* Display layers */}
        <div className="ax-seg shrink-0" role="group" aria-label="Display layers">
          {layers.map((l) => (
            <button key={l.label} data-active={l.active} aria-pressed={l.active} onClick={l.onClick} title={l.title}>
              <span>{l.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls reference and primary action */}
      <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={() => setShortcutsOpen(true)}
        className="ax-icon-btn !w-8 !h-8"
        title="Keyboard and mouse controls"
        data-tour="controls"
        aria-label="Keyboard and mouse controls"
      >
        <Keyboard className="w-4 h-4" />
      </button>
      <button onClick={onOpenExport} className="ax-btn ax-btn-primary shrink-0 !h-8 !px-3.5" data-tour="export">
        <Download className="w-3.5 h-3.5" />
        <span className="tracking-[0.06em]">EXPORT WELD JOB</span>
      </button>
      </div>
    </header>
  );
};
