'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/panels/Header';
import { SidebarLeft } from '@/components/panels/SidebarLeft';
import { SidebarRight } from '@/components/panels/SidebarRight';
import { ViewportCanvas } from '@/components/viewport/ViewportCanvas';
import { SimulationHUD } from '@/components/panels/SimulationHUD';
import { ExportModal } from '@/components/panels/ExportModal';
import { ShortcutsPanel } from '@/components/panels/ShortcutsPanel';
import { isTypingTarget } from '@/utils/keyboard';
import { useWeldStore } from '@/store/useWeldStore';
import { ChevronRight, ChevronLeft, Undo2 } from 'lucide-react';

export default function PlannerPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTabActive, setIsTabActive] = useState(true);
  const snakeBufferRef = useRef('');

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

  // First visit only: a quiet hint that the controls reference exists
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem('ax-controls-hint-seen') === '1';
      if (!seen) localStorage.setItem('ax-controls-hint-seen', '1');
    } catch {
      /* storage unavailable: show the hint anyway */
    }
    if (seen) return;
    const t = setTimeout(() => useWeldStore.getState().showFunToast('Press ? for keyboard and mouse controls'), 1500);
    return () => clearTimeout(t);
  }, []);

  // Global CAD Keyboard Shortcuts (Ctrl+Z, Delete/Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Stay out of the way while the user is typing (sliders and buttons do not block hotkeys)
      if (isTypingTarget(document.activeElement)) return;

      // "?" toggles the controls reference; Esc closes it before doing anything else
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        const st = useWeldStore.getState();
        st.setShortcutsOpen(!st.shortcutsOpen);
        return;
      }
      if (e.key === 'Escape' && useWeldStore.getState().shortcutsOpen) {
        e.preventDefault();
        useWeldStore.getState().setShortcutsOpen(false);
        return;
      }

      // Easter egg: typing "snake" wiggles the logo
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        snakeBufferRef.current = (snakeBufferRef.current + e.key.toLowerCase()).slice(-5);
        if (snakeBufferRef.current === 'snake') {
          snakeBufferRef.current = '';
          useWeldStore.getState().wiggleLogo();
        }
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
            onClick={() => {
              setIsLeftCollapsed(false);
              // Narrow screens only fit one panel beside the viewport
              if (window.innerWidth < 768) setIsRightCollapsed(true);
            }}
            className="absolute top-4 left-0 z-40 ax-btn !h-8 !rounded-l-none !border-l-0 !bg-[#0A0D0A]/85 backdrop-blur-md"
            title="Expand seams panel"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#e97f01]" />
            <span className="tracking-[0.08em]">SEAMS</span>
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
            onClick={() => {
              setIsRightCollapsed(false);
              if (window.innerWidth < 768) setIsLeftCollapsed(true);
            }}
            className="absolute top-4 right-0 z-40 ax-btn !h-8 !rounded-r-none !border-r-0 !bg-[#0A0D0A]/85 backdrop-blur-md"
            title="Expand parameters panel"
          >
            <span className="tracking-[0.08em]">PARAMS</span>
            <ChevronLeft className="w-3.5 h-3.5 text-[#e97f01]" />
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
      </div>

      {/* Floating Keyboard Shortcut Notification Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200">
          <div className="bg-[#0A0D0A]/90 border border-[#253224] text-[#B4C2B3] px-3.5 h-8 rounded-[4px] text-[12px] flex items-center gap-2 backdrop-blur">
            <Undo2 className="w-3.5 h-3.5 text-[#e97f01]" />
            <span className="ax-num">{toastMessage}</span>
          </div>
        </div>
      )}

      <ShortcutsPanel />

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </main>
  );
}

