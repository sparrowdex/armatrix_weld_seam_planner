'use client';

import { X } from 'lucide-react';
import { useWeldStore } from '@/store/useWeldStore';

const MOUSE = [
  { keys: ['Left drag'], what: 'Orbit the camera' },
  { keys: ['Right drag'], what: 'Orbit, also while drawing a seam (keeps the start point)' },
  { keys: ['Scroll'], what: 'Zoom' },
  { keys: ['Click seam'], what: 'Select it and focus the camera on it' },
  { keys: ['Double-click name'], what: 'Rename a seam in the list' },
];

const KEYS = [
  { keys: ['Ctrl', 'Z'], what: 'Undo the last seam change' },
  { keys: ['Delete'], what: 'Delete the selected seam' },
  { keys: ['Esc'], what: 'Drop the anchored point, leave click-to-weld, or deselect' },
  { keys: ['←', '→', '↑', '↓'], what: 'Orbit the view in 15° steps (works while drawing too)' },
  { keys: ['+', '−'], what: 'Zoom in and out' },
  { keys: ['F'], what: 'Frame the selected seam' },
  { keys: ['Home'], what: 'Reset to the ISO view' },
  { keys: ['Space'], what: 'Play or pause the simulation' },
];

function Key({ label }: { label: string }) {
  return (
    <kbd
      style={{ fontFamily: 'Onest, sans-serif' }}
      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-[3px] border border-[#2F3D2D] bg-[#111711] text-[11px] text-[#F6F5EE]"
    >
      {label}
    </kbd>
  );
}

function Rows({ title, rows, asText = false }: { title: string; rows: { keys: string[]; what: string }[]; asText?: boolean }) {
  return (
    <div>
      <span className="ax-label">{title}</span>
      <dl className="mt-3 border-t border-[#1D271C]">
        {rows.map((r) => (
          <div key={r.what} className="grid grid-cols-[112px_1fr] gap-3 items-center py-2 border-b border-[#1D271C]">
            <dt className="flex flex-wrap items-center gap-1">
              {r.keys.map((k) =>
                asText || k.includes(' ') ? (
                  <span key={k} className="text-[12px] text-[#F6F5EE]">
                    {k}
                  </span>
                ) : (
                  <Key key={k} label={k} />
                )
              )}
            </dt>
            <dd className="text-[12px] leading-[1.45] text-[#B4C2B3]">{r.what}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Keyboard and mouse reference, opened from the keyboard button in the header. */
export function ShortcutsPanel() {
  const open = useWeldStore((s) => s.shortcutsOpen);
  const setOpen = useWeldStore((s) => s.setShortcutsOpen);
  const setTourOpen = useWeldStore((s) => s.setTourOpen);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard and mouse shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[880px] max-h-[calc(100vh-32px)] overflow-y-auto bg-[#0A0D0A]/90 backdrop-blur-xl border border-[#253224] rounded-[6px]"
      >
        <div className="flex items-center justify-between h-11 px-5 border-b border-[#1D271C]">
          <span className="ax-label !text-[#F6F5EE]">Controls</span>
          <button onClick={() => setOpen(false)} className="ax-icon-btn -mr-2" aria-label="Close controls">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          <Rows title="Mouse" rows={MOUSE} asText />
          <Rows title="Keyboard" rows={KEYS} />
        </div>
        <div className="px-5 pb-5 -mt-1 flex justify-end">
          <button
            onClick={() => {
              setOpen(false);
              setTourOpen(true);
            }}
            className="ax-btn ax-btn-ghost !h-8 !px-3 !text-[12px]"
          >
            Replay the tour
          </button>
        </div>
      </div>
    </div>
  );
}
