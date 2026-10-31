'use client';

import React from 'react';
import Link from 'next/link';
import { ArmatrixLogo } from '@/components/ui/ArmatrixLogo';
import {
  ArrowRight,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Box,
  Compass,
  FileCode2,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070A07] text-[#DCE6DB] font-sans selection:bg-[#e97f01]/30">
      {/* Top Industrial Navigation Bar */}
      <header className="sticky top-0 z-50 h-16 bg-[#0A0E0A]/90 backdrop-blur-md border-b border-[#1A2619] px-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <ArmatrixLogo className="w-7 h-7 text-[#e97f01] transition-transform group-hover:scale-105" color="#e97f01" />
          <div className="flex flex-col">
            <span style={{ fontFamily: 'Onest, sans-serif' }} className="font-extrabold tracking-wider text-sm text-white">
              ARMATRIX
            </span>
            <span className="text-[10px] font-mono text-[#8EA28D] tracking-widest uppercase">
              Robotics
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-[#8EA28D]">
          <a href="#capabilities" className="hover:text-white transition">CAPABILITIES</a>
          <a href="#pipeline" className="hover:text-white transition">MOTION PIPELINE</a>
          <a href="#workpieces" className="hover:text-white transition">CAD PARTS</a>
          <Link href="/docs" className="hover:text-[#e97f01] transition flex items-center gap-1">
            <span>DOCS</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </nav>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141E14] hover:bg-[#1D2A1C] text-xs font-mono text-[#A4B5A3] hover:text-white border border-[#223121] transition active:scale-95"
          >
            <span>Job Spec</span>
          </Link>
          <Link
            href="/planner"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white text-xs font-bold transition active:scale-95 shadow-lg shadow-[#e97f01]/25 hover:shadow-[#e97f01]/40"
          >
            <span>Launch 3D Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6 sm:px-12 max-w-7xl mx-auto">
        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#e97f01]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-[#22C55E]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121912] border border-[#233522] text-[11px] font-mono text-[#DCE6DB] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[#86EFAC] font-semibold">ARMATRIX v1.2</span>
            <span className="text-[#556953]">|</span>
            <span className="text-[#A4B5A3]">Autonomous Robotic Weld Seam Planning</span>
          </div>

          {/* Headline */}
          <h1
            style={{ fontFamily: 'Onest, sans-serif' }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]"
          >
            Precision Weld Seam Planning for{' '}
            <span className="bg-gradient-to-r from-[#e97f01] via-[#ffa133] to-[#e97f01] bg-clip-text text-transparent">
              Snake-Arm Robotics
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#8EA28D] max-w-3xl leading-relaxed font-normal">
            Autonomous 3D CAD/CAM trajectory orchestration engineered for hyper-redundant continuum manipulators operating inside hazardous, GPS-denied, and ultra-confined industrial geometries.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/planner"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white text-sm font-bold tracking-wide transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-[#e97f01]/25 hover:shadow-[#e97f01]/40"
            >
              <span>Launch 3D Seam Planner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#121A12] hover:bg-[#1A251A] text-sm font-mono text-[#C2D1C1] hover:text-white border border-[#223121] transition active:scale-95"
            >
              <FileCode2 className="w-4 h-4 text-[#e97f01]" />
              <span>Job Schema Documentation</span>
            </Link>
          </div>

          {/* Live Feature Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-10 text-left">
            <div className="bg-[#0C120C]/80 border border-[#192419] p-4 rounded-xl">
              <div className="text-[#e97f01] text-xs font-mono font-bold uppercase mb-1">01 / KINEMATICS</div>
              <div className="text-white font-semibold text-sm">6-DOF Torch Vector</div>
              <div className="text-[#7D8F7C] text-xs mt-1">45° bisecting fillet tilt and push/pull lead angles</div>
            </div>
            <div className="bg-[#0C120C]/80 border border-[#192419] p-4 rounded-xl">
              <div className="text-[#22C55E] text-xs font-mono font-bold uppercase mb-1">02 / CAD ENGINE</div>
              <div className="text-white font-semibold text-sm">Topological Creases</div>
              <div className="text-[#7D8F7C] text-xs mt-1">Automatic dihedral angle boundary extraction</div>
            </div>
            <div className="bg-[#0C120C]/80 border border-[#192419] p-4 rounded-xl">
              <div className="text-[#38BDF8] text-xs font-mono font-bold uppercase mb-1">03 / VALIDATION</div>
              <div className="text-white font-semibold text-sm">Air-Gap & Clash Detection</div>
              <div className="text-[#7D8F7C] text-xs mt-1">Substrate verification and obstacle avoidance</div>
            </div>
            <div className="bg-[#0C120C]/80 border border-[#192419] p-4 rounded-xl">
              <div className="text-[#F59E0B] text-xs font-mono font-bold uppercase mb-1">04 / OUTPUT</div>
              <div className="text-white font-semibold text-sm">Universal Export</div>
              <div className="text-[#7D8F7C] text-xs mt-1">KUKA, ABB, Fanuc, G-code, and Armatrix JSON</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual CAD Environment Banner */}
      <section id="workpieces" className="px-6 sm:px-12 max-w-7xl mx-auto pb-24">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#101710] to-[#0A0E0A] border border-[#202E1F] p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#e97f01]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#e97f01] font-bold uppercase">
                <Box className="w-4 h-4" />
                <span>Multi-Part CAD Workpiece Ingestion</span>
              </div>
              <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-2xl sm:text-3xl font-extrabold text-white">
                Pre-Loaded Industrial Geometries and Custom STL Ingestion
              </h2>
              <p className="text-sm text-[#8EA28D] leading-relaxed">
                Test and calibrate multi-pass weld paths across standardized industrial benchmarks or drag and drop your own proprietary binary/ASCII .STL files directly into the browser.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#080D08] border border-[#1C291B] p-3 rounded-lg">
                  <div className="text-white text-xs font-bold">Structural L-Bracket</div>
                  <div className="text-[11px] text-[#7D8F7C] font-mono mt-0.5">80x80x12 mm</div>
                </div>
                <div className="bg-[#080D08] border border-[#1C291B] p-3 rounded-lg">
                  <div className="text-white text-xs font-bold">Pipe T-Joint Saddle</div>
                  <div className="text-[11px] text-[#7D8F7C] font-mono mt-0.5">True 3D Hyperbolic</div>
                </div>
                <div className="bg-[#080D08] border border-[#1C291B] p-3 rounded-lg">
                  <div className="text-white text-xs font-bold">Confined Box Flange</div>
                  <div className="text-[11px] text-[#7D8F7C] font-mono mt-0.5">Deep Pocket Void</div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/planner"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e97f01] hover:bg-[#d87401] text-white text-xs font-bold transition active:scale-95 shadow-md"
                >
                  <span>Open Interactive 3D Workcell</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Industrial Specs Preview Card */}
            <div className="w-full lg:w-[440px] bg-[#070A07] border border-[#233522] rounded-xl p-6 shadow-2xl font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A2619] pb-3">
                <span className="text-[#8EA28D]">WELD CONTROLLER</span>
                <span className="text-[#22C55E] flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  ONLINE / SYNCED
                </span>
              </div>

              <div className="space-y-2.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#7D8F7C]">Process Mode</span>
                  <span className="text-white font-semibold">MIG (GMAW) Fillet 45°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7D8F7C]">Wire Feed Speed</span>
                  <span className="text-white font-semibold">8.5 m/min (AWS ER70S-6)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7D8F7C]">Current / Voltage</span>
                  <span className="text-white font-semibold">180 A / 22.5 V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7D8F7C]">Traverse Travel Speed</span>
                  <span className="text-white font-semibold">6.5 mm/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7D8F7C]">Standoff Approach Clearance</span>
                  <span className="text-[#38BDF8] font-semibold">15.0 mm (Rapid G00)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7D8F7C]">Substrate Air-Gap Check</span>
                  <span className="text-[#22C55E] font-semibold">0.00 mm (100% Solid)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1A2619]">
                <div className="w-full bg-[#121912] rounded-md h-2 overflow-hidden flex">
                  <div className="bg-[#22C55E] h-full w-full" />
                </div>
                <div className="flex justify-between text-[10px] text-[#7D8F7C] mt-1.5">
                  <span>Trajectory Safety Score</span>
                  <span className="text-[#22C55E] font-bold">100% Collision-Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Motion Pipeline Section */}
      <section id="pipeline" className="px-6 sm:px-12 max-w-7xl mx-auto pb-24">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#e97f01] font-bold uppercase">
            <Compass className="w-4 h-4" />
            <span>Autonomous Trajectory Architecture</span>
          </div>
          <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-3xl font-extrabold text-white">
            Deterministic 4-Stage Waypoint Pipeline
          </h2>
          <p className="text-sm text-[#8EA28D] max-w-2xl mx-auto">
            Every planned seam computes an exact 4-point collision-free spatial envelope guaranteeing safe standoff approach, stable arc initiation, and crater-free weld conclusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Stage 1 */}
          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl relative space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-white font-bold text-base">Approach Waypoint</h3>
            <p className="text-xs text-[#7D8F7C] leading-relaxed">
              Rapid traverse (G00) from home parking pose to safe standoff clearance offset along the surface normal vector.
            </p>
            <div className="font-mono text-[10px] text-[#38BDF8] pt-2">offset: +15mm normal</div>
          </div>

          {/* Stage 2 */}
          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl relative space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-white font-bold text-base">Arc Strike Initiation</h3>
            <p className="text-xs text-[#7D8F7C] leading-relaxed">
              Descend to exact weld start coordinate, activate shielding gas pre-flow, ignite high-frequency arc, and initiate molten puddle.
            </p>
            <div className="font-mono text-[10px] text-[#F59E0B] pt-2">gas pre-flow: 0.5s</div>
          </div>

          {/* Stage 3 */}
          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl relative space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-white font-bold text-base">Controlled Travel</h3>
            <p className="text-xs text-[#7D8F7C] leading-relaxed">
              Interpolated weld motion with constant linear velocity, synchronized wire feed, real-time bead deposition, and weave oscillation.
            </p>
            <div className="font-mono text-[10px] text-[#22C55E] pt-2">speed: 6.5 mm/s</div>
          </div>

          {/* Stage 4 */}
          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl relative space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] font-mono font-bold text-xs">
              04
            </div>
            <h3 className="text-white font-bold text-base">Retract & Crater Fill</h3>
            <p className="text-xs text-[#7D8F7C] leading-relaxed">
              Dwell for crater fill, burn-back wire, extinguish arc, maintain gas post-flow, and execute rapid traverse clearance retract.
            </p>
            <div className="font-mono text-[10px] text-[#EF4444] pt-2">offset: +15mm retract</div>
          </div>
        </div>
      </section>

      {/* Industrial Capabilities Section */}
      <section id="capabilities" className="px-6 sm:px-12 max-w-7xl mx-auto pb-24">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#e97f01] font-bold uppercase">
            <Cpu className="w-4 h-4" />
            <span>Core Capabilities</span>
          </div>
          <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-3xl font-extrabold text-white">
            Engineered for Extreme Industrial Environments
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl space-y-3">
            <Layers className="w-6 h-6 text-[#e97f01]" />
            <h3 className="text-white font-bold text-base">Topological Crease Detection</h3>
            <p className="text-xs text-[#8EA28D] leading-relaxed">
              Extract dihedral boundary angles across triangular STL meshes automatically. Detect and plan multi-perimeter weld seams with zero manual CAD clicking.
            </p>
          </div>

          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#22C55E]" />
            <h3 className="text-white font-bold text-base">Substrate & Obstacle Verification</h3>
            <p className="text-xs text-[#8EA28D] leading-relaxed">
              Spatial raycasting identifies accidental air-gap draws through hollow voids and detects geometric collisions with surrounding bulkheads.
            </p>
          </div>

          <div className="bg-[#0C120C] border border-[#1A2619] p-6 rounded-xl space-y-3">
            <Flame className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="text-white font-bold text-base">Thermal Deposition Simulation</h3>
            <p className="text-xs text-[#8EA28D] leading-relaxed">
              Real-time visualization of glowing weld pool, dynamic molten metal deposition, active arc sparks, and metallic solidification.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="px-6 sm:px-12 max-w-7xl mx-auto pb-24">
        <div className="bg-gradient-to-r from-[#172016] via-[#1F2C1E] to-[#172016] border border-[#2B3C2A] rounded-2xl p-10 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 style={{ fontFamily: 'Onest, sans-serif' }} className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Plan Autonomous Weld Trajectories?
            </h2>
            <p className="text-sm text-[#A4B5A3] leading-relaxed">
              Experience the full 3D interactive workspace with real-time CAD model loading, trajectory simulation, and robotic code export.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/planner"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#e97f01] to-[#b35400] text-white text-sm font-bold tracking-wide transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-2xl shadow-[#e97f01]/40"
              >
                <span>Launch 3D Seam Planner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-2 px-6 py-4 rounded-xl bg-[#101710] hover:bg-[#162216] text-sm font-mono text-white border border-[#253624] transition active:scale-95"
              >
                <FileCode2 className="w-4 h-4 text-[#e97f01]" />
                <span>View Job Spec</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industrial Footer */}
      <footer className="border-t border-[#162216] bg-[#070A07] py-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#7D8F7C] font-mono">
          <div className="flex items-center gap-3">
            <ArmatrixLogo className="w-5 h-5 text-[#e97f01]" color="#e97f01" />
            <span className="text-white font-bold tracking-wider">ARMATRIX ROBOTICS INC.</span>
            <span>|</span>
            <span>Autonomous Continuum Welding Systems</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/planner" className="hover:text-white transition">3D Planner</Link>
            <Link href="/docs" className="hover:text-white transition">Job Spec</Link>
            <a
              href="https://github.com/sparrowdex/armatrix_weld_seam_planner.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#e97f01] transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
