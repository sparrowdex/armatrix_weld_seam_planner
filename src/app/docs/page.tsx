import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ArmatrixLogo } from '@/components/ui/ArmatrixLogo';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'frame', label: 'Coordinate frame' },
  { id: 'structure', label: 'Job structure' },
  { id: 'fields', label: 'Field reference' },
  { id: 'motion', label: 'Motion per seam' },
  { id: 'ingest', label: 'Controller example' },
  { id: 'controls', label: 'Planner controls' },
];

type Field = { name: string; type: string; desc: string };

const FIELD_GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'Job and part',
    fields: [
      { name: 'schema_version', type: 'string', desc: 'Schema version, currently "1.4.0".' },
      { name: 'generator · created_at', type: 'string', desc: 'App name and version that made the job (e.g. "Armatrix Weld Seam Planner 1.9.0"), and when.' },
      { name: 'job_id', type: 'string', desc: 'Unique job identifier, e.g. "ARMX-WELD-MH82J9X".' },
      { name: 'part.filename · part.units', type: 'string', desc: 'Source part name; units are always "mm".' },
      { name: 'part.bounding_dimensions_mm', type: '{ x, y, z }', desc: 'Workpiece envelope, used for fixturing and reach checks.' },
      { name: 'part.import_rotation_deg', type: '{ x, z }', desc: 'Quarter-turn rotation applied to an uploaded STL to stand it upright. Coordinates are after this rotation.' },
      { name: 'part.coordinate_frame', type: 'object', desc: 'Declares the frame every coordinate in the file uses (see Coordinate frame).' },
      { name: 'part.mesh_integrity', type: 'object | null', desc: 'watertight flag and open_edges count from the STL edge check.' },
    ],
  },
  {
    title: 'Robot profile',
    fields: [
      { name: 'robot_controller_profile.kinematics', type: 'string', desc: '"Armatrix-Snake-Arm".' },
      { name: 'reach_envelope_max_mm', type: 'number', desc: 'Maximum reach of the arm: 3500 mm.' },
      { name: 'rapid_traverse_speed_mm_s', type: 'number', desc: 'Non-welding move speed between seams: 120 mm/s.' },
      { name: 'safe_plane_z_clearance_mm', type: 'number', desc: 'Transit clearance height (40 mm), passed on for the controller. The simulator does not use it.' },
      { name: 'tool_effector', type: 'object', desc: 'Torch model and nozzle configuration the job was planned for.' },
    ],
  },
  {
    title: 'Seam geometry',
    fields: [
      { name: 'seam_id · name', type: 'string', desc: 'Stable identifier (e.g. "SEAM-01") and the user-editable name.' },
      { name: 'sequence_order', type: 'number', desc: 'Execution order, 1-based, as arranged for heat balance.' },
      { name: 'start_coordinate · end_coordinate', type: '[x, y, z]', desc: 'Seam end points in the part frame (mm).' },
      { name: 'length_mm', type: 'number', desc: 'Straight-line seam length.' },
      { name: 'surface_normal', type: '[x, y, z]', desc: 'Direction pointing straight out of the joint, before tilt and lead are applied.' },
      { name: 'torch_axis', type: '[x, y, z]', desc: 'The direction the torch points (from the weld up the torch body) with tilt and lead applied: exactly what the simulator used.' },
      { name: 'travel_direction', type: '[x, y, z]', desc: 'Direction from the seam start to its end. Together with torch_axis it fixes the torch orientation.' },
      { name: 'approach_point', type: '[x, y, z]', desc: 'start_coordinate + torch_axis × approach distance (default 25 mm).' },
      { name: 'retract_point', type: '[x, y, z]', desc: 'end_coordinate + torch_axis × retract distance (default 30 mm).' },
      { name: 'waypoints', type: '[x, y, z][]', desc: 'Points every 5 mm along the seam, for the controller to follow.' },
      { name: 'executable · air_gap_detected', type: 'boolean', desc: 'executable is false when the seam bridges open space. The controller must skip it.' },
    ],
  },
  {
    title: 'Seam process',
    fields: [
      { name: 'process', type: 'enum', desc: 'MIG, TIG or LASER.' },
      { name: 'joint_type', type: 'enum', desc: 'FILLET, BUTT, LAP, CORNER or EDGE.' },
      { name: 'torch_orientation', type: 'object', desc: 'lead_angle_deg (default 0°), tilt_angle_deg (default 45°), nozzle_type.' },
      {
        name: 'weld_parameters',
        type: 'object',
        desc: 'travel_speed_mm_s (12), current_amps (180), voltage_volts (24), wire_feed_m_min (6.5), shielding_gas_l_min (14), interpass_delay_sec (5), wire_diameter_mm (1.2).',
      },
    ],
  },
  {
    title: 'Job summary',
    fields: [
      { name: 'total_seams · executable_seams', type: 'number', desc: 'All seams, and those the controller should run.' },
      { name: 'skipped_seam_ids', type: 'string[]', desc: 'Non-manufacturable seams, excluded from every total below.' },
      { name: 'total_weld_length_mm', type: 'number', desc: 'Sum of executable seam lengths.' },
      { name: 'estimated_active_weld_time_sec', type: 'number', desc: 'Arc-on time: length ÷ travel speed, per seam.' },
      { name: 'estimated_traverse_time_sec', type: 'number', desc: 'Retract to next approach at rapid traverse speed.' },
      { name: 'estimated_cooling_delays_sec', type: 'number', desc: 'Interpass cooling between passes; none after the last.' },
      { name: 'total_cycle_time_sec', type: 'number', desc: 'Arc + traverse + cooling.' },
    ],
  },
];

const MOTION = [
  { title: 'Rapid traverse', body: 'From the previous retract point to this seam’s approach point at 120 mm/s, arc off.' },
  { title: 'Approach', body: 'Move in along torch_axis from approach_point to start_coordinate.' },
  { title: 'Arc on and weld', body: 'Follow the waypoints at travel speed with the torch held on torch_axis.' },
  { title: 'Arc off', body: 'At end_coordinate the arc stops.' },
  { title: 'Retract', body: 'Back out along torch_axis to retract_point, then pause for interpass_delay_sec before the next seam.' },
];

const PYTHON_EXAMPLE = `import json

def run_weld_job(path: str, arm) -> None:
    with open(path) as f:
        job = json.load(f)

    # All coordinates: right-handed, +Y up, origin at the part centre on the table
    arm.register_part_frame(job["part"]["coordinate_frame"])

    for seam in sorted(job["seams"], key=lambda s: s["sequence_order"]):
        if not seam["executable"]:
            continue  # air gap: never weld across open space

        tool = {"axis": seam["torch_axis"], "travel": seam["travel_direction"]}
        params = seam["weld_parameters"]

        arm.rapid_to(seam["approach_point"], tool)
        arm.linear_to(seam["start_coordinate"], tool)
        arm.arc_on(seam["process"], params)
        arm.follow(seam["waypoints"], tool, speed=params["travel_speed_mm_s"])
        arm.arc_off()
        arm.linear_to(seam["retract_point"], tool)
        arm.dwell(params["interpass_delay_sec"])`;

function SectionHead({ index, title, intro }: { index: string; title: string; intro?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <span className="ax-index">{index}</span>
        <span className="ax-label">{title}</span>
      </div>
      {intro && <p className="mt-4 max-w-[640px] text-[15px] leading-[1.65] text-[#B4C2B3]">{intro}</p>}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#070A07] text-[#F6F5EE] select-text">
      {/* Navigation */}
      <header className="sticky top-0 z-30 bg-[#070A07]/85 backdrop-blur-md border-b border-[#141C14]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArmatrixLogo className="w-6 h-6" color="#e97f01" />
            <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-semibold tracking-[0.14em] text-[12px]">
              ARMATRIX
            </span>
            <span className="hidden sm:block h-4 w-px bg-[#253224]" />
            <span className="hidden sm:block ax-label">Docs</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="hidden sm:block ax-label hover:!text-[#F6F5EE] transition-colors">
              Home
            </Link>
            <Link href="/planner" className="ax-btn ax-btn-primary !h-9 !px-4">
              Open planner
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-5 sm:px-10 lg:grid lg:grid-cols-[200px_1fr] lg:gap-16">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <nav className="sticky top-16 pt-14" aria-label="On this page">
            <span className="ax-label">On this page</span>
            <ol className="mt-5 border-l border-[#1D271C]">
              {TOC.map((t, i) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="flex items-baseline gap-3 -ml-px pl-4 py-2 border-l border-transparent hover:border-[#e97f01] text-[13px] text-[#7D8F7C] hover:text-[#F6F5EE] transition-colors"
                  >
                    <span className="ax-num text-[11px] text-[#4F5F4E]">{String(i + 1).padStart(2, '0')}</span>
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className="min-w-0 pt-14 pb-24">
          {/* Title */}
          <div className="pb-14 border-b border-[#1D271C]">
            <span className="ax-label">Weld job specification · Schema 1.4.0</span>
            <h1
              style={{ fontFamily: 'Onest, sans-serif' }}
              className="mt-5 text-[38px] sm:text-[56px] leading-[0.98] tracking-[-0.02em] font-normal max-w-[760px]"
            >
              The weld job file, field by field.
            </h1>
            <p className="mt-6 max-w-[620px] text-[16px] leading-[1.65] text-[#B4C2B3]">
              What the planner exports, how every coordinate is framed, and how an Armatrix snake-arm controller should
              read it.
            </p>
          </div>

          {/* 01 Overview */}
          <section id="overview" className="scroll-mt-24 pt-16">
            <SectionHead
              index="01"
              title="Overview"
              intro="Rigid six-axis arms cannot thread past internal ribs, baffles or pipe bends. Armatrix snake arms can, entering through manholes and access ports to reach deep into confined structures. This file gives them everything needed to weld once inside."
            />
            <dl className="grid md:grid-cols-3 border-t border-[#1D271C]">
              {[
                {
                  k: 'Safe entry and exit',
                  v: 'Approach and retract points sit back along the torch direction, so the torch moves straight in and out instead of sliding along the part.',
                },
                {
                  k: 'Heat-balanced order',
                  v: 'Seams carry an execution order that can alternate sides to limit distortion, with interpass cooling.',
                },
                {
                  k: 'Ready for IK',
                  v: 'Each seam carries the exact torch direction and a point every 5 mm, so the controller does not have to work them out.',
                },
              ].map((item, i) => (
                <div key={item.k} className={`py-6 md:pr-6 ${i > 0 ? 'md:pl-6 md:border-l border-t md:border-t-0 border-[#1D271C]' : ''}`}>
                  <dt style={{ fontFamily: 'Onest, sans-serif' }} className="text-[16px] font-medium">
                    {item.k}
                  </dt>
                  <dd className="mt-2 text-[14px] leading-[1.6] text-[#7D8F7C]">{item.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 02 Coordinate frame */}
          <section id="frame" className="scroll-mt-24 pt-20">
            <SectionHead
              index="02"
              title="Coordinate frame"
              intro="Every point and vector in the file uses one part frame, declared in part.coordinate_frame so the controller can register the part without guessing."
            />
            <dl className="border-t border-[#1D271C]">
              {[
                { k: 'Handedness', v: 'Right-handed' },
                { k: 'Up axis', v: '+Y' },
                { k: 'Origin', v: 'Part bounding-box centre in X and Z, at the part’s lowest point in Y (the table surface)' },
                { k: 'Units', v: 'Millimetres, seconds, degrees, amperes, volts' },
              ].map((row) => (
                <div key={row.k} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-4 border-b border-[#1D271C]">
                  <dt className="text-[13px] text-[#7D8F7C]">{row.k}</dt>
                  <dd className="text-[14px]">{row.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 03 Structure */}
          <section id="structure" className="scroll-mt-24 pt-20">
            <SectionHead index="03" title="Job structure" intro="Four blocks at the top level. Seams are listed in execution order." />
            <div className="rounded-[6px] border border-[#1D271C] bg-[#0A0E0A] overflow-hidden">
              <div className="h-10 px-4 flex items-center border-b border-[#1D271C]">
                <span className="ax-label">weld_job.json</span>
              </div>
              <pre style={{ fontFamily: MONO }} className="p-5 text-[12.5px] leading-[1.8] overflow-x-auto text-[#B4C2B3]">
{`{
  "schema_version": "1.4.0",
  "job_id": "ARMX-WELD-…",
  `}<span className="text-[#F6F5EE]">&quot;part&quot;</span>{`: { filename, units, bounding_dimensions_mm, coordinate_frame, mesh_integrity },
  `}<span className="text-[#F6F5EE]">&quot;robot_controller_profile&quot;</span>{`: { kinematics, reach_envelope_max_mm, rapid_traverse_speed_mm_s, … },
  `}<span className="text-[#F6F5EE]">&quot;job_summary&quot;</span>{`: { total_seams, executable_seams, skipped_seam_ids, …, total_cycle_time_sec },
  `}<span className="text-[#e97f01]">&quot;seams&quot;</span>{`: [ { seam_id, torch_axis, approach_point, waypoints, weld_parameters, … } ]
}`}
              </pre>
            </div>
          </section>

          {/* 04 Fields */}
          <section id="fields" className="scroll-mt-24 pt-20">
            <SectionHead index="04" title="Field reference" intro="Defaults in brackets are what a new seam starts with." />
            <div className="flex flex-col gap-12">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 style={{ fontFamily: 'Onest, sans-serif' }} className="text-[20px] font-medium mb-4">
                    {group.title}
                  </h3>
                  <dl className="border-t border-[#1D271C]">
                    {group.fields.map((f) => (
                      <div
                        key={f.name}
                        className="grid md:grid-cols-[minmax(0,280px)_120px_1fr] gap-1 md:gap-6 py-4 border-b border-[#1D271C]"
                      >
                        <dt style={{ fontFamily: MONO }} className="text-[12.5px] text-[#F6F5EE] break-words">
                          {f.name}
                        </dt>
                        <dd style={{ fontFamily: MONO }} className="text-[12px] text-[#e97f01]/85">
                          {f.type}
                        </dd>
                        <dd className="text-[14px] leading-[1.6] text-[#B4C2B3]">{f.desc}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>

          {/* 05 Motion */}
          <section id="motion" className="scroll-mt-24 pt-20">
            <SectionHead
              index="05"
              title="Motion per seam"
              intro="The controller runs the same five moves the simulator animates, for every executable seam in order."
            />
            <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-x-6">
              {MOTION.map((m, i) => (
                <li key={m.title} className="border-t border-[#1D271C] pt-5 pb-8">
                  <span className="ax-index">{String(i + 1).padStart(2, '0')}</span>
                  <h3 style={{ fontFamily: 'Onest, sans-serif' }} className="mt-3 text-[16px] font-medium">
                    {m.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-[1.6] text-[#7D8F7C]">{m.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* 06 Ingest */}
          <section id="ingest" className="scroll-mt-24 pt-16">
            <SectionHead
              index="06"
              title="Controller example"
              intro="How a controller might consume the file. The arm interface is illustrative; the field usage is exact."
            />
            <div className="rounded-[6px] border border-[#1D271C] bg-[#0A0E0A] overflow-hidden">
              <div className="h-10 px-4 flex items-center justify-between border-b border-[#1D271C]">
                <span className="ax-label">run_weld_job.py</span>
                <span className="ax-label">Python</span>
              </div>
              <pre style={{ fontFamily: MONO }} className="p-5 text-[12.5px] leading-[1.75] overflow-x-auto text-[#B4C2B3]">
                {PYTHON_EXAMPLE}
              </pre>
            </div>
          </section>

          {/* 07 Controls */}
          <section id="controls" className="scroll-mt-24 pt-20">
            <SectionHead
              index="07"
              title="Planner controls"
              intro="Also available inside the planner from the keyboard button next to Export, where the guided tour can be replayed."
            />
            <dl className="border-t border-[#1D271C]">
              {[
                { k: 'Left or right drag', v: 'Orbit the camera. Right drag also works while drawing and keeps the anchored start point.' },
                { k: 'Scroll', v: 'Zoom.' },
                { k: 'Click a seam', v: 'Select it and focus the camera on it. Double-click its name in the list to rename it.' },
                { k: 'Ctrl + Z', v: 'Undo the last seam change.' },
                { k: 'Delete', v: 'Delete the selected seam.' },
                { k: 'Esc', v: 'Drop the anchored point, leave click-to-weld, or deselect.' },
                { k: 'Arrow keys', v: 'Orbit the view in 15° steps, including while drawing a seam.' },
                { k: '+ / −', v: 'Zoom in and out.' },
                { k: 'F', v: 'Frame the selected seam.' },
                { k: 'Home', v: 'Reset to the ISO view.' },
                { k: 'Space', v: 'Play or pause the simulation.' },
              ].map((row) => (
                <div key={row.k} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 py-4 border-b border-[#1D271C]">
                  <dt className="text-[13px] text-[#F6F5EE]">{row.k}</dt>
                  <dd className="text-[14px] leading-[1.6] text-[#B4C2B3]">{row.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Next */}
          <div className="mt-20 pt-10 border-t border-[#1D271C] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p style={{ fontFamily: 'Onest, sans-serif' }} className="text-[22px] sm:text-[26px] leading-[1.15] tracking-[-0.01em] max-w-[520px]">
              Generate a real job file from a benchmark part.
            </p>
            <Link href="/planner" className="ax-btn ax-btn-primary !h-11 !px-5 !text-[13px] group self-start sm:self-auto">
              Open the planner
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-[1200px] mx-auto px-5 sm:px-10 py-10 border-t border-[#1D271C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArmatrixLogo className="w-5 h-5" color="#e97f01" />
          <span className="text-[13px] text-[#7D8F7C]">Armatrix Weld Seam Planner</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-[13px] text-[#7D8F7C] hover:text-[#F6F5EE] transition-colors">
            Home
          </Link>
          <Link href="/planner" className="text-[13px] text-[#7D8F7C] hover:text-[#F6F5EE] transition-colors">
            Planner
          </Link>
        </div>
      </footer>
    </div>
  );
}
