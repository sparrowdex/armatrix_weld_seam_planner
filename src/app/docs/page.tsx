import React from 'react';
import Link from 'next/link';
import { ArmatrixLogo } from '@/components/ui/ArmatrixLogo';
import { ArrowLeft, BookOpen, Code, Cpu, Shield, Zap, FileJson, CheckCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#070A07] text-[#DCE6DB] font-sans selection:bg-[#e97f01]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-14 bg-[#0A0E0A]/90 backdrop-blur border-b border-[#1A2619] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArmatrixLogo className="w-6 h-6" color="#e97f01" />
          <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-extrabold tracking-wider text-xs text-white">
            ARMATRIX DOCS
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162516] text-[#22C55E] border border-[#223B21]">
            v1.2.0 Spec
          </span>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141E14] hover:bg-[#1D2A1C] text-xs font-mono text-[#A4B5A3] hover:text-white border border-[#223121] transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#e97f01]" />
          <span>Back to 3D Planner</span>
        </Link>
      </header>

      {/* Main Documentation Container */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Hero Section */}
        <div className="border-b border-[#1A2619] pb-8">
          <div className="flex items-center gap-2 text-[#e97f01] text-xs font-mono font-bold tracking-wider uppercase mb-2">
            <Cpu className="w-4 h-4" />
            <span>Industrial Robotics Specification</span>
          </div>
          <h1 style={{ fontFamily: 'Onest, sans-serif' }} className="text-3xl font-extrabold text-white tracking-tight mb-3">
            Armatrix Autonomous Weld Job Schema
          </h1>
          <p className="text-sm text-[#8EA28D] leading-relaxed">
            Standardized trajectory and process payload engineered specifically for hyper-redundant continuum snake-arm manipulators operating inside hazardous, GPS-denied, and highly confined industrial geometries.
          </p>
        </div>

        {/* Section 1: Architectural Overview */}
        <section className="space-y-4">
          <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e97f01]" />
            1. Continuum Snake-Arm Architecture
          </h2>
          <p className="text-xs text-[#9BB09A] leading-relaxed">
            Traditional industrial robots are rigid 6-axis articulated arms that cannot negotiate internal baffles, rib stiffeners, or tortuous pipe bends. Armatrix continuum manipulators feature 20+ motorized degrees of freedom, enabling whole-body obstacle avoidance and deep reach (up to 3500 mm).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#0C120C] border border-[#1E2B1D]">
              <span className="text-[#38BDF8] font-mono text-xs font-bold block mb-1">Confined Access Standoff</span>
              <p className="text-[11px] text-[#7A8C79] leading-relaxed">
                Normal approach and retract vectors ensure the snake arm never scrapes sidewalls or ribs on entry and exit.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0C120C] border border-[#1E2B1D]">
              <span className="text-[#22C55E] font-mono text-xs font-bold block mb-1">Thermal Heat-Sink Mitigation</span>
              <p className="text-[11px] text-[#7A8C79] leading-relaxed">
                Alternating skip-weld sequence prevents localized thermal accumulation and eliminates angular structural distortion.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0C120C] border border-[#1E2B1D]">
              <span className="text-[#e97f01] font-mono text-xs font-bold block mb-1">Deterministic IK Discretization</span>
              <p className="text-[11px] text-[#7A8C79] leading-relaxed">
                Cartesian waypoints discretized at 5 mm pitch are streamed directly to the continuum inverse kinematics (IK) solver.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Field-by-Field JSON Schema Specification */}
        <section className="space-y-4">
          <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            2. Field-by-Field Schema Specification
          </h2>
          <p className="text-xs text-[#9BB09A]">
            Every exported <code className="text-[#A3E635] bg-[#121A11] px-1.5 py-0.5 rounded">.json</code> file strictly conforms to this deterministic structure:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#1E2B1D] bg-[#0A0F0A]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2B1D] bg-[#0F160F] text-[#8EA28D]">
                  <th className="p-3 font-semibold">JSON Field</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Description & Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151F14] text-[#C2D1C1]">
                <tr>
                  <td className="p-3 text-[#e97f01] font-semibold">schema_version</td>
                  <td className="p-3 text-[#7E8F7D]">string</td>
                  <td className="p-3">Semantic versioning of the schema specification (e.g. &quot;1.2.0&quot;).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#e97f01] font-semibold">job_id</td>
                  <td className="p-3 text-[#7E8F7D]">string</td>
                  <td className="p-3">Unique job session identifier (e.g. &quot;JOB-20261031-1402&quot;).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#38BDF8] font-semibold">part.bounding_dimensions_mm</td>
                  <td className="p-3 text-[#7E8F7D]">object [x, y, z]</td>
                  <td className="p-3">Workpiece bounding box dimensions in true millimeters.</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#38BDF8] font-semibold">robot_controller_profile</td>
                  <td className="p-3 text-[#7E8F7D]">object</td>
                  <td className="p-3">Arm reach envelope (3500 mm), rapid traverse speed (120 mm/s), and safe clearance plane.</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#22C55E] font-semibold">seams[].seam_id</td>
                  <td className="p-3 text-[#7E8F7D]">string</td>
                  <td className="p-3">Unique identifier for the weld seam (e.g. &quot;SEAM-01&quot;).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#22C55E] font-semibold">seams[].sequence_order</td>
                  <td className="p-3 text-[#7E8F7D]">number</td>
                  <td className="p-3">Execution index (1, 2, 3...) optimized for thermal distortion mitigation.</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#22C55E] font-semibold">seams[].approach_point</td>
                  <td className="p-3 text-[#7E8F7D]">[x, y, z]</td>
                  <td className="p-3">Standoff waypoint normal to seam start point (+25 mm standoff).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#22C55E] font-semibold">seams[].retract_point</td>
                  <td className="p-3 text-[#7E8F7D]">[x, y, z]</td>
                  <td className="p-3">Withdrawal waypoint normal to seam end point (+30 mm standoff).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#EAB308] font-semibold">seams[].torch_orientation</td>
                  <td className="p-3 text-[#7E8F7D]">object</td>
                  <td className="p-3">Lead angle (10°), tilt angle (45°), and nozzle profile (narrow deep-access).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#F43F5E] font-semibold">seams[].weld_parameters</td>
                  <td className="p-3 text-[#7E8F7D]">object</td>
                  <td className="p-3">Travel speed (12 mm/s), current (180 A), voltage (24 V), wire feed (6.5 m/min), gas (14 L/min), interpass cooling delay (5 s).</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#A855F7] font-semibold">seams[].waypoints</td>
                  <td className="p-3 text-[#7E8F7D]">Array&lt;[x, y, z]&gt;</td>
                  <td className="p-3">High-resolution 3D spline trajectory sampled at 5 mm pitch for continuum IK solver.</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#A3E635] font-semibold">job_summary</td>
                  <td className="p-3 text-[#7E8F7D]">object</td>
                  <td className="p-3">Total seam count, total weld length (mm), estimated active weld time, traverse time, cooling time, and total cycle time (seconds).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Ingestion Example */}
        <section className="space-y-4">
          <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            3. Armatrix Controller Ingestion Example (Python / ROS2)
          </h2>
          <p className="text-xs text-[#9BB09A]">
            Below is an example showing how the Armatrix robot controller consumes the exported payload in a ROS2 trajectory action client:
          </p>

          <pre className="text-xs text-[#9DE09D] font-mono leading-relaxed p-4 bg-[#050705] rounded-xl border border-[#1A2619] overflow-x-auto">
{`import json
import rclpy
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint

def execute_armatrix_weld_job(job_file_path: str):
    with open(job_file_path, 'r') as f:
        job = json.load(f)

    print(f"Loading Job: {job['job_id']} for Part: {job['part']['filename']}")
    print(f"Kinematics Reach Envelope: {job['robot_controller_profile']['reach_envelope_max_mm']} mm")

    for seam in job['seams']:
        print(f"Executing {seam['seam_id']} ({seam['length_mm']} mm) - Process: {seam['process']}")
        
        # 1. Approach phase: Rapid traverse to standoff
        approach_pt = seam['approach_point']
        
        # 2. Continuous 5mm waypoints passed to Continuum Snake IK solver
        for wp in seam['waypoints']:
            # joint_angles = snake_arm_ik_solver.solve(wp, seam['torch_orientation'])
            pass
            
        # 3. Retract outward before transit
        retract_pt = seam['retract_point']`}
          </pre>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-[#1A2619] flex items-center justify-between text-xs text-[#7A8C79] font-mono">
          <span>Armatrix Autonomous Weld Seam Planner v1.0</span>
          <Link href="/" className="text-[#e97f01] hover:underline font-bold">
            Open 3D Planner Workspace →
          </Link>
        </div>
      </main>
    </div>
  );
}

