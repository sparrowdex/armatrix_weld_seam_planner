'use client';

import { useEffect, useState } from 'react';
import { useWeldStore } from '@/store/useWeldStore';

/** localStorage key: set once the tour is finished or skipped, so it never auto-starts again. */
export const TOUR_DONE_KEY = 'ax-tour-done';

interface TourStep {
  /** Matches a `data-tour` attribute in the UI; if missing or hidden the card is centred instead. */
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: 'part',
    title: 'Pick a part',
    body: 'Start with a benchmark part, or upload any STL. Size, mesh integrity and reach are checked as it loads.',
  },
  {
    target: 'seams',
    title: 'Define the seams',
    body: 'Auto-detect finds weld creases on the mesh. Manual click-to-weld lets you pick two points yourself.',
  },
  {
    target: 'params',
    title: 'Tune the weld',
    body: 'Select a seam to set its process, joint type, current, voltage, torch angles and standoffs.',
  },
  {
    target: 'sequence',
    title: 'Order and simulate',
    body: 'Reorder or reverse seams here, then run the simulation from the dock that appears at the bottom of the view.',
  },
  {
    target: 'export',
    title: 'Export the job',
    body: 'Download the weld job JSON: torch axes, waypoints, standoffs and cycle time, ready for the arm controller.',
  },
  {
    target: 'controls',
    title: 'Controls and shortcuts',
    body: 'Mouse and keyboard controls live here, including orbiting while drawing, undo, framing and play or pause.',
  },
];

const markDone = () => {
  try {
    localStorage.setItem(TOUR_DONE_KEY, '1');
  } catch {
    /* storage unavailable: the tour may show again next visit */
  }
};

type Rect = { top: number; left: number; width: number; height: number };

export function OnboardingTour() {
  const open = useWeldStore((s) => s.tourOpen);
  const setOpen = useWeldStore((s) => s.setTourOpen);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  // Restart from the first step whenever the tour is opened
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Track the highlighted element every frame so the outline follows panel animations and resizes
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`) as HTMLElement | null;
      const r = el?.getBoundingClientRect();
      const visible = r && r.width > 4 && r.height > 4;
      setRect((prev) => {
        if (!visible) return prev === null ? prev : null;
        const next = { top: r!.top, left: r!.left, width: r!.width, height: r!.height };
        if (prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.left - next.left) < 0.5 &&
            Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5) return prev;
        return next;
      });
      setViewport((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [open, step]);

  if (!open) return null;

  const close = () => {
    markDone();
    setOpen(false);
  };
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  // Card placement: below the target if there is room, otherwise above; centred when there is no target
  const CARD_W = 320;
  const CARD_H = 190;
  const pad = 12;
  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + pad + CARD_H < viewport.h;
    const top = below ? rect.top + rect.height + pad : Math.max(pad, rect.top - pad - CARD_H);
    const left = Math.min(Math.max(pad, rect.left + rect.width / 2 - CARD_W / 2), viewport.w - CARD_W - pad);
    cardStyle = { top, left, width: CARD_W };
  } else {
    cardStyle = { top: '50%', left: '50%', width: CARD_W, transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* Spotlight: an outline around the target, with everything else gently dimmed */}
      {rect ? (
        <div
          className="absolute rounded-[6px] border-2 border-[#e97f01] transition-all duration-300 ease-out"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/45" />
      )}

      <div
        role="dialog"
        aria-label={`Tour step ${step + 1} of ${STEPS.length}: ${s.title}`}
        className="absolute pointer-events-auto bg-[#0A0D0A]/92 backdrop-blur-xl border border-[#253224] rounded-[6px] p-4 transition-all duration-300 ease-out"
        style={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className="ax-label">
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={close} className="text-[11px] text-[#7D8F7C] hover:text-[#F6F5EE] transition-colors">
            Skip tour
          </button>
        </div>
        <h3 style={{ fontFamily: 'Onest, sans-serif' }} className="mt-3 text-[15px] font-medium text-[#F6F5EE]">
          {s.title}
        </h3>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[#B4C2B3]">{s.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] rounded-full transition-all duration-300 ${i === step ? 'w-5 bg-[#e97f01]' : 'w-2.5 bg-[#2F3D2D]'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="ax-btn ax-btn-ghost !h-7 !px-2.5 !text-[11.5px]">
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? close() : setStep(step + 1))}
              className="ax-btn ax-btn-primary !h-7 !px-3 !text-[11.5px]"
              autoFocus
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
