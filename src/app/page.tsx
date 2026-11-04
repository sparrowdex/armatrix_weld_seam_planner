import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ArmatrixLogo } from '@/components/ui/ArmatrixLogo';

const STATS = [
  { value: '3500', unit: 'mm', label: 'Snake-arm reach envelope' },
  { value: '120', unit: 'mm/s', label: 'Rapid traverse between seams' },
  { value: '3', unit: '', label: 'Processes: MIG, TIG, laser' },
  { value: '5', unit: '', label: 'Joint types, from fillet to edge' },
];

const STEPS = [
  {
    title: 'Load the part',
    body: 'Pick a benchmark part or upload any STL. Size, mesh integrity and reach are checked the moment it loads.',
  },
  {
    title: 'Find the seams',
    body: 'Auto-detect finds inside corners and lines where parts meet, or click two points to place a seam by hand. Paths over open air are flagged.',
  },
  {
    title: 'Set the process',
    body: 'Process and joint type, travel speed, current, voltage, wire feed, torch tilt and lead, approach and retract standoffs.',
  },
  {
    title: 'Sequence and simulate',
    body: 'Reorder for heat balance, reverse direction, then watch the torch approach, lay each bead and retract.',
  },
  {
    title: 'Export the job',
    body: 'Download a JSON job with tool axes, waypoints, standoffs and cycle time, ready for the arm controller.',
  },
];

const EXPORT_POINTS = [
  'The torch direction and travel direction for every seam, exactly as simulated',
  'Approach and retract points, so the torch moves straight in and out',
  'Seams that cannot be welded are flagged and left out of the run',
  'Cycle time split into welding, travel between seams and cooling',
];

const JSON_SAMPLE = `{
  "seam_id": "SEAM-01",
  "process": "MIG",
  "joint_type": "FILLET",
  "start_coordinate": [-26, 14, -31],
  "end_coordinate": [26, 14, -31],
  "torch_axis": [0, 0.7071, 0.7071],
  "approach_point": [-26, 31.68, -13.32],
  "executable": true,
  "weld_parameters": {
    "travel_speed_mm_s": 12,
    "current_amps": 180,
    "voltage_volts": 24
  }
}`;

/** Isometric line drawing of the benchmark L-bracket; its three weld seams draw themselves in sequence. */
function BracketDrawing() {
  const line = 'rgba(246,246,238,0.32)';
  return (
    <svg
      viewBox="160 60 520 560"
      className="w-full h-auto"
      role="img"
      aria-label="Line drawing of an L-bracket with a gusset, its weld seams tracing in orange"
    >
      {/* Base plate */}
      <polygon points="632.8,474.5 632.8,492.5 451,597.5 451,579.5" fill="#0C110C" stroke={line} />
      <polygon points="451,579.5 451,597.5 191.2,447.5 191.2,429.5" fill="#0E140E" stroke={line} />
      <polygon points="373,324.5 632.8,474.5 451,579.5 191.2,429.5" fill="#111811" stroke={line} />
      {/* Upright plate */}
      <polygon points="632.8,234.5 617.2,243.5 617.2,483.5 632.8,474.5" fill="#0C110C" stroke={line} />
      <polygon points="357.4,339.5 617.2,483.5 617.2,243.5 357.4,93.5" fill="#0F150F" stroke={line} />
      <polygon points="373,84.5 632.8,234.5 617.2,243.5 357.4,93.5" fill="#131B13" stroke={line} />
      {/* Gusset */}
      <polygon points="487.3,408.5 487.3,261.5 399,459.5" fill="#141C14" stroke={line} />

      {/* Weld seams */}
      <g className="ax-home-seams">
        <line className="ax-home-seam ax-home-seam-1" x1="357.4" y1="339.5" x2="617.2" y2="483.5" pathLength={1} />
        <line className="ax-home-seam ax-home-seam-2" x1="487.3" y1="408.5" x2="399" y2="459.5" pathLength={1} />
        <line className="ax-home-seam ax-home-seam-3" x1="487.3" y1="408.5" x2="487.3" y2="261.5" pathLength={1} />
      </g>

      {/* Callouts */}
      <g stroke="rgba(246,246,238,0.28)" strokeWidth="1" fill="none">
        <polyline points="560,451 600,420 668,420" />
        <polyline points="487.3,330 530,300 668,300" />
      </g>
      <g fill="rgba(246,246,238,0.55)" fontFamily="Onest, sans-serif" fontSize="11" letterSpacing="1.4">
        <text x="668" y="414" textAnchor="end">ROOT FILLET</text>
        <text x="668" y="294" textAnchor="end">GUSSET UPRIGHT</text>
      </g>
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070A07] text-[#F6F5EE] select-text">
      {/* Navigation */}
      <header className="max-w-[1200px] mx-auto px-5 sm:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ArmatrixLogo className="w-7 h-7" color="#e97f01" />
          <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-semibold tracking-[0.14em] text-[13px]">
            ARMATRIX
          </span>
        </Link>
        <nav className="flex items-center gap-7">
          <a href="#workflow" className="hidden md:block ax-label hover:!text-[#F6F5EE] transition-colors">
            Workflow
          </a>
          <a href="#export" className="hidden md:block ax-label hover:!text-[#F6F5EE] transition-colors">
            Export
          </a>
          <Link href="/docs" className="hidden sm:block ax-label hover:!text-[#F6F5EE] transition-colors">
            Docs
          </Link>
          <Link href="/planner" className="ax-btn ax-btn-primary !h-9 !px-4">
            Open planner
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(246,246,238,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(246,246,238,0.035) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 70% 45%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 70% 45%, black 20%, transparent 75%)',
          }}
        />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-10 pt-10 sm:pt-16 pb-20 sm:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
          <div className="ax-home-rise">
            <span className="ax-label">Weld seam planner for snake-arm robots</span>
            <h1
              style={{ fontFamily: 'Onest, sans-serif' }}
              className="mt-6 text-[44px] sm:text-[64px] lg:text-[76px] leading-[0.95] tracking-[-0.02em] font-normal"
            >
              Plan every weld before the arm moves.
            </h1>
            <p className="mt-7 max-w-[480px] text-[16px] sm:text-[17px] leading-[1.6] text-[#B4C2B3]">
              Load a CAD part, find its seams, tune the process and simulate the toolpath. Then hand the cell a job file
              the controller can run.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/planner" className="ax-btn ax-btn-primary !h-11 !px-5 !text-[13px] group">
                Open the planner
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/docs" className="ax-btn !h-11 !px-5 !text-[13px] !bg-transparent">
                Read the docs
              </Link>
            </div>
          </div>

          <div className="ax-home-rise ax-home-delay max-w-[560px] w-full mx-auto lg:mx-0 lg:justify-self-end">
            <BracketDrawing />
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-10">
        <dl className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#1D271C]">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`py-8 sm:py-10 pr-4 ${i % 2 === 1 ? 'pl-5 sm:pl-8 border-l border-[#1D271C]' : ''} ${
                i >= 2 ? 'border-t border-[#1D271C] lg:border-t-0' : ''
              } ${i === 2 ? 'lg:pl-8 lg:border-l' : ''}`}
            >
              <dd
                style={{ fontFamily: 'Onest, sans-serif' }}
                className="ax-num text-[40px] sm:text-[52px] leading-none tracking-[-0.02em]"
              >
                {s.value}
                {s.unit && <span className="text-[16px] sm:text-[18px] text-[#7D8F7C] ml-1.5">{s.unit}</span>}
              </dd>
              <dt className="mt-3 text-[13px] text-[#7D8F7C]">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Workflow */}
      <section id="workflow" className="max-w-[1200px] mx-auto px-5 sm:px-10 pt-24 sm:pt-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span className="ax-label">Workflow</span>
            <h2
              style={{ fontFamily: 'Onest, sans-serif' }}
              className="mt-4 text-[32px] sm:text-[44px] leading-[1] tracking-[-0.02em] font-normal max-w-[560px]"
            >
              From mesh to motion in five steps.
            </h2>
          </div>
          <p className="max-w-[340px] text-[15px] leading-[1.6] text-[#7D8F7C]">
            Everything runs in the browser. No install, no account, nothing leaves your machine until you export.
          </p>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-x-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="group border-t border-[#1D271C] pt-6 pb-10">
              <span className="ax-index transition-colors">{String(i + 1).padStart(2, '0')}</span>
              <h3 style={{ fontFamily: 'Onest, sans-serif' }} className="mt-4 text-[18px] font-medium">
                {step.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6] text-[#7D8F7C]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Export */}
      <section id="export" className="max-w-[1200px] mx-auto px-5 sm:px-10 pt-16 sm:pt-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <span className="ax-label">Weld job export</span>
            <h2
              style={{ fontFamily: 'Onest, sans-serif' }}
              className="mt-4 text-[32px] sm:text-[44px] leading-[1] tracking-[-0.02em] font-normal"
            >
              A job file the controller can trust.
            </h2>
            <p className="mt-6 max-w-[460px] text-[15px] leading-[1.6] text-[#B4C2B3]">
              Every coordinate is in one declared part frame, and every seam carries the torch pose the simulator used.
            </p>
            <ul className="mt-8 border-t border-[#1D271C]">
              {EXPORT_POINTS.map((point) => (
                <li key={point} className="py-4 border-b border-[#1D271C] text-[14px] text-[#F6F5EE]">
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/docs"
              className="mt-8 inline-flex items-center gap-2 text-[13px] text-[#e97f01] hover:text-[#f38b0e] transition-colors"
            >
              Field-by-field schema
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-[6px] border border-[#1D271C] bg-[#0A0E0A] overflow-hidden">
            <div className="h-10 px-4 flex items-center justify-between border-b border-[#1D271C]">
              <span className="ax-label">weld_job.json</span>
              <span className="ax-label">Schema 1.4.0</span>
            </div>
            <pre className="p-5 text-[12.5px] leading-[1.7] overflow-x-auto text-[#B4C2B3] font-[ui-monospace,SFMono-Regular,Menlo,monospace]">
              {JSON_SAMPLE}
            </pre>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-10 pt-24 sm:pt-32 pb-16">
        <div
          className="rounded-[10px] px-6 sm:px-12 py-14 sm:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8 border border-[#2B381F]"
          style={{ background: 'linear-gradient(135deg, #030500 0%, #2B381F 60%, #455B32 100%)' }}
        >
          <h2
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="text-[30px] sm:text-[40px] leading-[1.05] tracking-[-0.02em] font-normal max-w-[560px]"
          >
            Open a benchmark part and run your first weld.
          </h2>
          <Link href="/planner" className="ax-btn ax-btn-primary !h-11 !px-5 !text-[13px] shrink-0 group self-start md:self-auto">
            Open the planner
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1200px] mx-auto px-5 sm:px-10 py-10 border-t border-[#1D271C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArmatrixLogo className="w-5 h-5" color="#e97f01" />
          <span className="text-[13px] text-[#7D8F7C]">Armatrix Weld Seam Planner</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/planner" className="text-[13px] text-[#7D8F7C] hover:text-[#F6F5EE] transition-colors">
            Planner
          </Link>
          <Link href="/docs" className="text-[13px] text-[#7D8F7C] hover:text-[#F6F5EE] transition-colors">
            Docs
          </Link>
        </div>
      </footer>
    </div>
  );
}
