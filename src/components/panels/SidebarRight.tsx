'use client';

import React from 'react';
import { useWeldStore } from '@/store/useWeldStore';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { WeldJointType, WeldProcess } from '@/types/weld';
import { getReachSummary, REACH_ENVELOPE_MM } from '@/utils/reach';

interface SidebarRightProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

const fillPct = (v: number, min: number, max: number) =>
  `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`;

const SectionTitle: React.FC<{ index: string; title: string; right?: React.ReactNode }> = ({ index, title, right }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="ax-index">{index}</span>
      <span className="ax-label">{title}</span>
    </div>
    {right}
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: string) => void;
}> = ({ label, value, unit, min, max, step, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <span className="text-[12px] text-[#B4C2B3]">{label}</span>
      <span className="ax-num text-[12.5px] font-medium text-[#F6F5EE]">
        {value}
        <span className="text-[11px] text-[#7D8F7C] ml-1">{unit}</span>
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ '--fill': fillPct(value, min, max) } as React.CSSProperties}
      className="ax-range"
      aria-label={label}
    />
  </div>
);

const NumberField: React.FC<{ label: string; value: number; unit: string; onChange: (v: string) => void }> = ({
  label,
  value,
  unit,
  onChange,
}) => (
  <label className="block">
    <span className="text-[11px] text-[#7D8F7C] block mb-1.5">{label}</span>
    <span className="relative block">
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="ax-input pr-9" />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7D8F7C] pointer-events-none">{unit}</span>
    </span>
  </label>
);

export const SidebarRight: React.FC<SidebarRightProps> = ({ onToggleCollapse }) => {
  const {
    seams,
    selectedSeamId,
    updateSeamParameters,
    flipSeamNormal,
    setSeamNormal,
    rapidTraverseSpeed,
    exportJobJSON,
    part,
  } = useWeldStore();

  const selectedSeam = seams.find((s) => s.id === selectedSeamId) || seams[0] || null;
  const jobSummary = exportJobJSON().job_summary;
  const reach = getReachSummary(part);

  const handleProcessChange = (proc: WeldProcess) => {
    if (!selectedSeam) return;
    const procDefaults = {
      MIG: { current: 180, voltage: 24, travelSpeed: 12, wireFeedSpeed: 6.5 },
      TIG: { current: 130, voltage: 16, travelSpeed: 7, wireFeedSpeed: 0 },
      LASER: { current: 280, voltage: 32, travelSpeed: 25, wireFeedSpeed: 0 },
    }[proc];
    updateSeamParameters(selectedSeam.id, { process: proc, ...procDefaults });
  };

  const handleJointChange = (jt: WeldJointType) => {
    if (!selectedSeam) return;
    const jointConfigs: Record<WeldJointType, { tilt: number; current: number; voltage: number; speed: number }> = {
      FILLET: { tilt: 45, current: 180, voltage: 24, speed: 12 },
      BUTT: { tilt: 0, current: 195, voltage: 25, speed: 10 },
      LAP: { tilt: 30, current: 165, voltage: 23, speed: 14 },
      CORNER: { tilt: 20, current: 150, voltage: 22, speed: 15 },
      EDGE: { tilt: 15, current: 140, voltage: 21, speed: 16 },
    };
    const cfg = jointConfigs[jt];
    updateSeamParameters(selectedSeam.id, {
      jointType: jt,
      torchTiltAngle: cfg.tilt,
      current: cfg.current,
      voltage: cfg.voltage,
      travelSpeed: cfg.speed,
    });
  };

  const jointHint: Record<WeldJointType, string> = {
    FILLET: '45° bisecting tilt for 90° junctions',
    BUTT: '0° normal tilt for flat groove',
    LAP: '30° wash tilt for overlapping sheets',
    CORNER: '20° apex tilt for outside edges',
    EDGE: '15° tilt for parallel edge flanges',
  };

  return (
    <aside className="w-80 h-full bg-[#0A0D0A] border-l border-[#182118] flex flex-col z-10 select-none overflow-y-auto text-xs relative">
      {/* Panel header */}
      <div className="h-11 px-4 border-b border-[#182118] flex items-center justify-between shrink-0 sticky top-0 bg-[#0A0D0A] z-10">
        <span className="ax-label !text-[#F6F5EE]">Weld Parameters</span>
        <div className="flex items-center gap-2">
          {selectedSeam && <span className="ax-chip ax-chip-signal ax-num">{selectedSeam.id}</span>}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="ax-icon-btn"
              title="Collapse parameters panel"
              aria-label="Collapse parameters panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {selectedSeam ? (
        <>
          {selectedSeam.hasAirGap && (
            <div className="px-4 pt-3.5">
              <div className="ax-notice ax-notice-warn">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-px" />
                <div>
                  <div className="font-medium text-[#FBBF24]">Air gap — not manufacturable</div>
                  <p className="text-[11px] text-[#FDE68A]/80 mt-0.5">
                    This seam spans {selectedSeam.airGapDistanceMm || 0} mm of open air with no substrate underneath and cannot be executed on the physical part.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* /01 Process */}
          <div className="ax-section">
            <SectionTitle index="01" title="Process" />

            <div className="ax-seg w-full mb-2.5" role="group" aria-label="Weld process">
              {(['MIG', 'TIG', 'LASER'] as WeldProcess[]).map((p) => (
                <button
                  key={p}
                  data-active={selectedSeam.parameters.process === p}
                  onClick={() => handleProcessChange(p)}
                  className="flex-1"
                  title={{ MIG: 'MIG (GMAW)', TIG: 'TIG (GTAW)', LASER: 'Laser welding' }[p]}
                >
                  {p}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-[11px] text-[#7D8F7C] block mb-1.5">Joint type</span>
              <span className="relative flex items-center">
                <select
                  value={selectedSeam.parameters.jointType}
                  onChange={(e) => handleJointChange(e.target.value as WeldJointType)}
                  className="ax-input"
                >
                  <option value="FILLET">Fillet joint (90°)</option>
                  <option value="BUTT">Butt joint (flat)</option>
                  <option value="LAP">Lap joint (overlap)</option>
                  <option value="CORNER">Corner joint (apex)</option>
                  <option value="EDGE">Edge joint (parallel)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D8F7C] absolute right-2 pointer-events-none" />
              </span>
            </label>

            <div className="flex items-center justify-between mt-2 text-[11px] text-[#7D8F7C]">
              <span>{jointHint[selectedSeam.parameters.jointType]}</span>
              <span className="ax-num text-[#e97f01] shrink-0 ml-2">{selectedSeam.parameters.torchTiltAngle}° tilt</span>
            </div>
          </div>

          {/* /02 Electrical & motion */}
          <div className="ax-section flex flex-col gap-3.5">
            <SectionTitle index="02" title="Electrical & Motion" />
            <div className="-mt-3.5 flex flex-col gap-3.5">
              <SliderRow
                label="Travel speed"
                value={selectedSeam.parameters.travelSpeed}
                unit="mm/s"
                min={4}
                max={35}
                step={1}
                onChange={(v) => updateSeamParameters(selectedSeam.id, { travelSpeed: parseFloat(v) })}
              />
              <SliderRow
                label="Current"
                value={selectedSeam.parameters.current}
                unit="A"
                min={80}
                max={350}
                step={5}
                onChange={(v) => {
                  const amps = parseInt(v);
                  if (amps >= 350 && selectedSeam.parameters.current < 350) {
                    useWeldStore.getState().showFunToast('Easy there. The neighbours’ lights just dimmed.');
                  }
                  updateSeamParameters(selectedSeam.id, { current: amps });
                }}
              />
              <SliderRow
                label="Voltage"
                value={selectedSeam.parameters.voltage}
                unit="V"
                min={14}
                max={36}
                step={0.5}
                onChange={(v) => {
                  const volts = parseFloat(v);
                  if (volts >= 36 && selectedSeam.parameters.voltage < 36) {
                    useWeldStore.getState().showFunToast('Easy there. The neighbours’ lights just dimmed.');
                  }
                  updateSeamParameters(selectedSeam.id, { voltage: volts });
                }}
              />
              <SliderRow
                label="Wire feed speed"
                value={selectedSeam.parameters.wireFeedSpeed}
                unit="m/min"
                min={2.0}
                max={16.0}
                step={0.5}
                onChange={(v) => updateSeamParameters(selectedSeam.id, { wireFeedSpeed: parseFloat(v) })}
              />

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[12px] text-[#B4C2B3]">Wire diameter</span>
                  <span className="text-[11px] text-[#7D8F7C]">AWS ER70S-6</span>
                </div>
                <div className="ax-seg w-full" role="group" aria-label="Wire diameter">
                  {[0.8, 1.0, 1.2, 1.6].map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      data-active={(selectedSeam.parameters.wireDiameter ?? 1.2) === dia}
                      onClick={() => updateSeamParameters(selectedSeam.id, { wireDiameter: dia })}
                      className="flex-1 ax-num"
                    >
                      {dia.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* /03 Torch orientation */}
          <div className="ax-section">
            <SectionTitle index="03" title="Torch Orientation" />

            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-[#7D8F7C]">Surface normal</span>
              <span className="ax-num text-[#F6F5EE]">
                [{selectedSeam.normal.x.toFixed(2)}, {selectedSeam.normal.y.toFixed(2)}, {selectedSeam.normal.z.toFixed(2)}]
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3.5">
              <button
                type="button"
                onClick={() => flipSeamNormal(selectedSeam.id)}
                className="ax-btn !h-7 !px-1 !text-[11px]"
                title="Invert torch normal vector 180°"
              >
                Invert 180°
              </button>
              <button
                type="button"
                onClick={() => setSeamNormal(selectedSeam.id, { x: 0, y: 0.707, z: 0.707 })}
                className="ax-btn !h-7 !px-1 !text-[11px]"
                title="Set 45° corner bisecting normal"
              >
                45° fillet
              </button>
              <button
                type="button"
                onClick={() => setSeamNormal(selectedSeam.id, { x: 0, y: 1, z: 0 })}
                className="ax-btn !h-7 !px-1 !text-[11px]"
                title="Align normal straight up (+Y)"
              >
                Top +Y
              </button>
              <button
                type="button"
                onClick={() => setSeamNormal(selectedSeam.id, { x: 0, y: 0, z: 1 })}
                className="ax-btn !h-7 !px-1 !text-[11px]"
                title="Align normal forward (+Z)"
              >
                Front +Z
              </button>
              <button
                type="button"
                onClick={() => setSeamNormal(selectedSeam.id, { x: 1, y: 0, z: 0 })}
                className="ax-btn !h-7 !px-1 !text-[11px]"
                title="Align normal sideways (+X)"
              >
                Side +X
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                label="Lead angle"
                value={selectedSeam.parameters.torchLeadAngle}
                unit="°"
                onChange={(v) => updateSeamParameters(selectedSeam.id, { torchLeadAngle: parseFloat(v) || 0 })}
              />
              <NumberField
                label="Tilt angle"
                value={selectedSeam.parameters.torchTiltAngle}
                unit="°"
                onChange={(v) => updateSeamParameters(selectedSeam.id, { torchTiltAngle: parseFloat(v) || 0 })}
              />
            </div>
          </div>

          {/* /04 Clearance & cooling */}
          <div className="ax-section">
            <SectionTitle index="04" title="Clearance & Cooling" />

            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <NumberField
                label="Approach standoff"
                value={selectedSeam.parameters.approachDistance}
                unit="mm"
                onChange={(v) => updateSeamParameters(selectedSeam.id, { approachDistance: parseFloat(v) || 0 })}
              />
              <NumberField
                label="Retract standoff"
                value={selectedSeam.parameters.retractDistance}
                unit="mm"
                onChange={(v) => updateSeamParameters(selectedSeam.id, { retractDistance: parseFloat(v) || 0 })}
              />
            </div>

            <SliderRow
              label="Interpass cooling delay"
              value={selectedSeam.parameters.interpassDelay}
              unit="s"
              min={0}
              max={30}
              step={1}
              onChange={(v) => updateSeamParameters(selectedSeam.id, { interpassDelay: parseInt(v) })}
            />
            <p className="text-[11px] text-[#7D8F7C] mt-1.5">Mitigates thermal distortion on thin sections.</p>
          </div>
        </>
      ) : (
        <div className="px-6 py-10 text-center text-[12px] text-[#7D8F7C]">Select or add a seam to adjust parameters.</div>
      )}

      {/* /05 Snake-arm kinematics */}
      <div className="mt-auto px-4 py-4 border-t border-[#182118] bg-[#0C100C]">
        <SectionTitle index="05" title="Snake-Arm Kinematics" right={
            reach &&
            (reach.withinReach ? (
              <span className="ax-chip ax-chip-ok">Within reach</span>
            ) : (
              <span className="ax-chip !border-[#F59E0B]/50 !text-[#FBBF24]">Exceeds reach</span>
            ))
          } />

        <div className="flex items-end justify-between mb-3.5">
          <div>
            <div className="text-[11px] text-[#7D8F7C] mb-1">Estimated total cycle</div>
            <div className="ax-num text-[26px] leading-none font-medium text-[#F6F5EE]">
              {jobSummary.total_cycle_time_sec}
              <span className="text-[13px] text-[#7D8F7C] ml-1">s</span>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#7D8F7C] leading-relaxed">
            <div>Reach envelope</div>
            <div className="ax-num text-[#B4C2B3]">{REACH_ENVELOPE_MM} mm</div>
          </div>
        </div>

        <dl className="text-[11.5px] divide-y divide-[#161E16] border-t border-[#161E16]">
          {[
            { k: 'Active arc time', v: `${jobSummary.estimated_active_weld_time_sec} s`, accent: true },
            {
              k: 'Traverse & cooling',
              v: `${(jobSummary.estimated_traverse_time_sec + jobSummary.estimated_cooling_delays_sec).toFixed(1)} s`,
            },
            { k: 'Total weld length', v: `${jobSummary.total_weld_length_mm} mm` },
            { k: 'Rapid traverse', v: `${rapidTraverseSpeed} mm/s` },
            { k: 'Part diagonal', v: reach ? `${reach.partDiagonalMm} mm · ${reach.envelopePct}% of reach` : '—' },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between py-1.5">
              <dt className="text-[#7D8F7C]">{row.k}</dt>
              <dd className={`ax-num ${row.accent ? 'text-[#e97f01]' : 'text-[#F6F5EE]'}`}>{row.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
};
