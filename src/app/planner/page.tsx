'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/panels/Header';
import { SidebarLeft } from '@/components/panels/SidebarLeft';
import { SidebarRight } from '@/components/panels/SidebarRight';
import { ViewportCanvas } from '@/components/viewport/ViewportCanvas';
import { SimulationHUD } from '@/components/panels/SimulationHUD';
import { ExportModal } from '@/components/panels/ExportModal';
import { useWeldStore } from '@/store/useWeldStore';
import { Sliders, ListOrdered, ChevronRight, ChevronLeft, Undo2 } from 'lucide-react';

export default function PlannerPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTabActive, setIsTabActive] = useState(true);

  // Smooth Tab Standby Fade when tab is inactive, blooming back to full brilliance on focus
  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden);
    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => setIsTabActive(false);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Global CAD Keyboard Shortcuts (Ctrl+Z, Delete/Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger hotkeys if user is focused inside a text input or select
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      // 1. Ctrl + Z (or Cmd + Z) -> Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const historyLen = useWeldStore.getState().seamHistory.length;
        if (historyLen > 0) {
          useWeldStore.getState().undo();
          setToastMessage('Reverted last seam action (Ctrl+Z)');
          setTimeout(() => setToastMessage(null), 2500);
        }
        return;
      }

      // 2. Delete or Backspace -> Delete Selected Seam
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedId = useWeldStore.getState().selectedSeamId;
        if (selectedId) {
          e.preventDefault();
          useWeldStore.getState().removeSeam(selectedId);
          setToastMessage(`Deleted seam: ${selectedId} (Delete key)`);
          setTimeout(() => setToastMessage(null), 2500);
        }
        return;
      }

      // 3. Escape -> Cancel active point, exit add_seam mode, or deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        const { mode, manualStartPoint, setManualStartPoint, setMode, selectSeam } = useWeldStore.getState();
        if (mode === 'add_seam') {
          if (manualStartPoint) {
            setManualStartPoint(null, null);
            setToastMessage('Canceled anchored start point (Esc)');
            setTimeout(() => setToastMessage(null), 2000);
          } else {
            setMode('orbit');
          }
        } else {
          selectSeam(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main
      className={`flex flex-col h-screen w-screen overflow-hidden bg-[#0A0D0A] select-none text-[#F6F5EE] transition-all duration-700 ease-out ${
        isTabActive ? 'opacity-100 filter-none' : 'opacity-85 brightness-90 saturate-75'
      }`}
    >
      {/* Header */}
      <Header onOpenExport={() => setIsExportOpen(true)} />

      {/* Main CAD Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar (Seams & Ingestion) */}
        <div
          className={`h-full transition-all duration-300 ease-in-out z-30 overflow-hidden shrink-0 ${
            isLeftCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'
          }`}
        >
          <div className="w-80 h-full">
            <SidebarLeft onToggleCollapse={() => setIsLeftCollapsed(true)} isCollapsed={isLeftCollapsed} />
          </div>
        </div>

        {/* Collapsed Left Floating Show Tab */}
        {isLeftCollapsed && (
          <button
            onClick={() => setIsLeftCollapsed(false)}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="absolute top-4 left-0 z-40 bg-[#0C120C]/90 hover:bg-[#162216] border-r-2 border-y border-[#e97f01]/70 hover:border-[#e97f01] pl-3 pr-3.5 py-2 rounded-r-lg text-white font-bold text-xs transition-all duration-200 shadow-2xl flex items-center gap-2 group active:scale-95 backdrop-blur-md"
            title="Expand Seams Panel"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#e97f01] group-hover:translate-x-0.5 transition-transform" />
            <span className="tracking-wide">SEAMS</span>
          </button>
        )}

        {/* 3D Interactive Viewport - Automatically fills 100% of remaining width */}
        <div className="flex-1 h-full min-w-0 relative overflow-hidden">
          <ViewportCanvas
            isRightCollapsed={isRightCollapsed}
            isLeftCollapsed={isLeftCollapsed}
            onExpandRight={() => setIsRightCollapsed(false)}
          />
          <SimulationHUD />
        </div>

        {/* Collapsed Right Floating Show Tab */}
        {isRightCollapsed && (
          <button
            onClick={() => setIsRightCollapsed(false)}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="absolute top-4 right-0 z-40 bg-[#0C120C]/90 hover:bg-[#162216] border-l-2 border-y border-[#e97f01]/70 hover:border-[#e97f01] pr-3 pl-3.5 py-2 rounded-l-lg text-white font-bold text-xs transition-all duration-200 shadow-2xl flex items-center gap-2 group active:scale-95 backdrop-blur-md"
            title="Expand Parameters Panel"
          >
            <span className="tracking-wide">PARAMS</span>
            <ChevronLeft className="w-3.5 h-3.5 text-[#e97f01] group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Right Sidebar (Parameters & Kinematics) */}
        <div
          className={`h-full transition-all duration-300 ease-in-out z-30 overflow-hidden shrink-0 ${
            isRightCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'
          }`}
        >
          <div className="w-80 h-full">
            <SidebarRight onToggleCollapse={() => setIsRightCollapsed(true)} isCollapsed={isRightCollapsed} />
          </div>
        </div>

        {/* Tablet / Mobile Floating Bar */}
        <div className="md:hidden absolute bottom-3 right-4 z-40 flex items-center gap-2 bg-[#101710]/95 backdrop-blur border border-[#233121] p-1.5 rounded-lg shadow-xl">
          <button
            onClick={() => {
              setIsLeftCollapsed(!isLeftCollapsed);
              if (isLeftCollapsed) setIsRightCollapsed(true);
            }}
            style={{ fontFamily: 'Onest, sans-serif' }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
              !isLeftCollapsed
                ? 'bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white shadow-sm'
                : 'text-[#889988] hover:text-white'
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
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
              !isRightCollapsed
                ? 'bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white shadow-sm'
                : 'text-[#889988] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Params</span>
          </button>
        </div>
      </div>

      {/* Floating Keyboard Shortcut Notification Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200">
          <div className="bg-[#121E14]/95 border border-[#22C55E]/40 text-[#22C55E] px-4 py-2 rounded-full font-mono text-xs shadow-2xl flex items-center gap-2 backdrop-blur">
            <Undo2 className="w-3.5 h-3.5 text-[#e97f01]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </main>
  );
}
