'use client';

import React, { useState } from 'react';
import { Header } from '@/components/panels/Header';
import { SidebarLeft } from '@/components/panels/SidebarLeft';
import { SidebarRight } from '@/components/panels/SidebarRight';
import { ViewportCanvas } from '@/components/viewport/ViewportCanvas';
import { SimulationHUD } from '@/components/panels/SimulationHUD';
import { ExportModal } from '@/components/panels/ExportModal';
import { Sliders, ListOrdered, Eye } from 'lucide-react';

export default function Home() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showLeftMobile, setShowLeftMobile] = useState(true);
  const [showRightMobile, setShowRightMobile] = useState(false);

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D100D] select-none">
      {/* Top Technical Header */}
      <Header onOpenExport={() => setIsExportOpen(true)} />

      {/* Main CAD Workspace Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar (Seams & CAD Ingestion) */}
        <div
          className={`h-full transition-all duration-300 md:static absolute inset-y-0 left-0 z-30 ${
            showLeftMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <SidebarLeft />
        </div>

        {/* 3D Interactive Viewport */}
        <div className="flex-1 h-full relative overflow-hidden">
          <ViewportCanvas />
          <SimulationHUD />
        </div>

        {/* Right Sidebar (Weld Parameters & Kinematics) */}
        <div
          className={`h-full transition-all duration-300 md:static absolute inset-y-0 right-0 z-30 ${
            showRightMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <SidebarRight />
        </div>

        {/* Mobile / Tablet Bottom Bar for Toggling Sidebars */}
        <div className="md:hidden absolute bottom-3 right-4 z-40 flex items-center gap-2 bg-[#141B13]/90 backdrop-blur border border-[#273725] p-1 rounded-lg">
          <button
            onClick={() => {
              setShowLeftMobile(!showLeftMobile);
              if (!showLeftMobile) setShowRightMobile(false);
            }}
            className={`px-3 py-1.5 rounded font-mono text-xs flex items-center gap-1.5 ${
              showLeftMobile ? 'bg-[#FF5B00] text-white' : 'text-[#889988]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Seams</span>
          </button>
          <button
            onClick={() => {
              setShowRightMobile(!showRightMobile);
              if (!showRightMobile) setShowLeftMobile(false);
            }}
            className={`px-3 py-1.5 rounded font-mono text-xs flex items-center gap-1.5 ${
              showRightMobile ? 'bg-[#FF5B00] text-white' : 'text-[#889988]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Params</span>
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </main>
  );
}
