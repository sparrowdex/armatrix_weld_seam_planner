'use client';

import React, { useState } from 'react';
import { Header } from '@/components/panels/Header';
import { SidebarLeft } from '@/components/panels/SidebarLeft';
import { SidebarRight } from '@/components/panels/SidebarRight';
import { ViewportCanvas } from '@/components/viewport/ViewportCanvas';
import { SimulationHUD } from '@/components/panels/SimulationHUD';
import { ExportModal } from '@/components/panels/ExportModal';
import { Sliders, ListOrdered, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Home() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#0A0D0A] select-none text-[#F6F5EE]">
      {/* Header */}
      <Header onOpenExport={() => setIsExportOpen(true)} />

      {/* Main CAD Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar (Seams & Ingestion) */}
        <div
          className={`h-full transition-all duration-300 ease-in-out z-30 md:relative absolute inset-y-0 left-0 ${
            isLeftCollapsed
              ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 pointer-events-none'
              : 'translate-x-0 w-80 opacity-100'
          }`}
        >
          <SidebarLeft onToggleCollapse={() => setIsLeftCollapsed(true)} isCollapsed={isLeftCollapsed} />
        </div>

        {/* Collapsed Left Floating Show Tab */}
        {isLeftCollapsed && (
          <button
            onClick={() => setIsLeftCollapsed(false)}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="absolute top-5 left-0 z-40 bg-[#121A12] hover:bg-[#1C271B] border-r-2 border-y border-[#e97f01] pl-3 pr-3.5 py-2 rounded-r-lg text-white font-bold text-xs transition shadow-2xl flex items-center gap-2 group active:scale-95"
            title="Expand Seams Panel"
          >
            <ChevronRight className="w-4 h-4 text-[#e97f01] group-hover:translate-x-0.5 transition-transform" />
            <span>SEAMS PANEL</span>
          </button>
        )}

        {/* 3D Interactive Viewport */}
        <div className="flex-1 h-full relative overflow-hidden">
          <ViewportCanvas />
          <SimulationHUD />
        </div>

        {/* Collapsed Right Floating Show Tab */}
        {isRightCollapsed && (
          <button
            onClick={() => setIsRightCollapsed(false)}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="absolute top-5 right-0 z-40 bg-[#121A12] hover:bg-[#1C271B] border-l-2 border-y border-[#e97f01] pr-3 pl-3.5 py-2 rounded-l-lg text-white font-bold text-xs transition shadow-2xl flex items-center gap-2 group active:scale-95"
            title="Expand Parameters Panel"
          >
            <span>WELD PARAMS</span>
            <ChevronLeft className="w-4 h-4 text-[#e97f01] group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Right Sidebar (Parameters & Kinematics) */}
        <div
          className={`h-full transition-all duration-300 ease-in-out z-30 md:relative absolute inset-y-0 right-0 ${
            isRightCollapsed
              ? 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0 pointer-events-none'
              : 'translate-x-0 w-80 opacity-100'
          }`}
        >
          <SidebarRight onToggleCollapse={() => setIsRightCollapsed(true)} isCollapsed={isRightCollapsed} />
        </div>

        {/* Tablet / Mobile Floating Bar */}
        <div className="md:hidden absolute bottom-3 right-4 z-40 flex items-center gap-2 bg-[#101710]/95 backdrop-blur border border-[#233121] p-1.5 rounded-lg shadow-xl">
          <button
            onClick={() => {
              setIsLeftCollapsed(!isLeftCollapsed);
              if (isLeftCollapsed) setIsRightCollapsed(true);
            }}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${
              !isLeftCollapsed ? 'bg-[#e97f01] text-white' : 'text-[#889988]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Seams</span>
          </button>
          <button
            onClick={() => {
              setIsRightCollapsed(!isRightCollapsed);
              if (isRightCollapsed) setIsLeftCollapsed(true);
            }}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${
              !isRightCollapsed ? 'bg-[#e97f01] text-white' : 'text-[#889988]'
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
