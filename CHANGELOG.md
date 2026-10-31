# Changelog

All notable changes to the Armatrix Autonomous Weld Seam Planner project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.6.0] - 2026-10-31

### Added
- **Armatrix Commercial Product Homepage (`/`)**: Built a high-converting industrial landing page at `localhost:3000` (`/`) featuring Continuum Robotics overview, 4-stage motion pipeline breakdown, pre-loaded CAD part benchmarks, and instant launch CTAs.
- **Dedicated 3D CAD Planner Route (`/planner`)**: Transferred the full 3D CAD/CAM workstation to `/planner` with seamless bidirectional header navigation between the product homepage, technical documentation, and 3D simulation canvas.
- **Parallel Offset Travel Direction Arrow**: Offset the travel direction arrowhead outward along the workpiece surface normal vector ($r_{\text{bead}} + 2.5\text{ mm}$), aligning it cleanly parallel to the bead rather than intersecting the cylinder axis.
- **Automated Arrow Simulation Fade-Out**: Programmed the direction arrow to automatically fade out / hide completely while the weld path simulation is running (`isSimulating === true`), ensuring the live torch nozzle, electrode wire, arc sparks, and depositing metallic bead are completely unobstructed.

### Changed
- **Global Page Scroll Architecture**: Adjusted body styling in `globals.css` and `layout.tsx` to `overflow-x-hidden min-h-screen`, enabling natural vertical scrolling for the homepage (`/`) and documentation (`/docs`) while maintaining strict `overflow-hidden` fixed containment for the CAD planner (`/planner`).
- **Docs Navigation**: Updated `/docs` top bar with quick-switch links to both `Home` and `Launch 3D Planner →`.

## [1.5.0] - 2026-10-31

### Added
- **True 3D Hyperbolic Pipe Saddle Weld Trajectory**: Replaced the crude flat diamond placeholder on the Pipe T-Joint benchmark with a geometrically precise 8-segment hyperbolic 3D saddle curve ($R_{\text{branch}} = 18\text{ mm}$, $R_{\text{main}} = 25\text{ mm}$, crown $y = 61.0\text{ mm}$, flanks $y = 57.5\text{ mm}$, valleys $y = 53.4\text{ mm}$), wrapping flush around the intersecting cylinders with outward $45^\circ$ bisecting torch vectors.
- **Ground-Clamped Camera Orbit**: Clamped `OrbitControls.maxPolarAngle` to $\sim 87.5^\circ$ when the welding platen table is mounted, physically preventing the camera from plunging underneath the steel fixture into the dark floor void.
- **Welding Platen Table Toggle (`[TABLE]`)**: Added a 1-click toggle in the header allowing engineers to switch between the mounted steel fixture table (ground-clamped) and free floating inspection (360° unobstructed orbit).
- **Tab Inactive / Standby Dimming Animation**: Integrated browser visibility and window focus listeners to smoothly transition the application into an idle standby state ($85\%$ opacity, dimmed saturation) when switching tabs, and instantly bloom back to $100\%$ vibrant brilliance upon return.

### Changed
- **Dynamic Seam Color Priority during Simulation**: Fixed seam color hierarchy so completed/simulated seams always remain shiny metallic steel (`#D4E2D4`), and actively welding seams do not show as static orange sticks. Seams now highlight in Armatrix Orange (`#e97f01`) only when idle and selected for parameter editing.
- **Precision CAD Node Handles**: Scaled down oversized endpoint and waypoint spheres from $3.5\text{ mm}$ ($7\text{ mm}$ ball) to sleek $1.2\text{--}1.5\text{ mm}$ precision CAD pins, and waypoints to $0.8\text{ mm}$, eliminating corner occlusion.
- **Refined Direction Arrow**: Resized the weld travel direction arrowhead (`headLength: 2.4, headWidth: 1.6`) into a subtle directional chevron flush along the seam.
- **Streamlined CAD Header Sections**: Reorganized the top header into 4 clear CAD control zones (*Workpiece*, *Camera View*, *Display Modes*, *Actions*) with clean visual dividers.

### Fixed
- **Lockbox Lid Multi-Edge Crease Detection**: Lowered `minLength` from $12\text{ mm}$ to $5\text{ mm}$ and expanded the detection cap from 8 to 24 seams, successfully capturing all 12 perimeter edges (including short rim lines and back vertical corners) on thin-flanged lids and enclosures.

## [1.4.0] - 2026-10-31

### Added
- **Dynamic Canvas Gliding While Drawing**: In `ViewportCanvas.tsx`, when actively drawing down or across a tall/long workpiece (such as the lockbox latch or chassis), approaching the viewport margins ($12\text{--}15\%$) smoothly pans and glides the camera target and orientation in real-time without interrupting the seam.
- **Mid-Draw Orbit Navigation**: Enabled OrbitControls Right-Click orbit/pan while in click-to-weld mode, allowing engineers to rotate freely around 3D geometry mid-draw without canceling active anchor points.
- **Translucent Ghost X-Ray View**: Added 1-click `[X-RAY]` viewport toggle rendering workpiece geometry with $35\%$ translucent opacity and glowing cyan contour edges, revealing occluded interior floor seams in deep enclosures (e.g., Box Flange cavities, Lockbox compartments, and Pipe T-joint saddles).
- **True Topological Dihedral Edge Detection for Custom STLs**: Integrated `detectCandidateSeams` directly into the Auto-Detect button for custom uploaded geometries, extracting true $\sim 90^\circ$ dihedral fillet creases from facet normals and discarding non-fillet flat perimeters.

### Changed
- **Aerospace CAD Simulation Dock**: Replaced the bulky `rounded-full` pill bar in `SimulationHUD.tsx` with a low-profile aerospace CAD simulation dock (`rounded-xl bg-[#080C08]/80 backdrop-blur-xl border border-white/10 shadow-2xl`), eliminating viewport obstruction.
- **Glassmorphic In-Focus Seam Specs HUD**: Upgraded the on-focus seam HUD from opaque containers to transparent frosted glass (`bg-[#080D08]/75 backdrop-blur-xl border border-white/10 rounded-2xl`), replacing harsh borders with lightweight telemetry pills.
- **Decluttered Weld Parameters**: Removed redundant "Torch Tooling" hardware callouts from `SidebarRight.tsx` and streamlined parameter sliders into clean, minimalist $3\text{px}$ tracks.

### Fixed
- **Armatrix Logo SVG Clipping**: Resolved logo clipping in `Header.tsx` by correcting the SVG viewBox in `ArmatrixLogo.tsx` from `235 145 352 232` to the true geometry bounds `205 170 385 208`, restoring the truncated left wing and giving clean breathing room.
- **Structural L-Bracket 5mm Centering Offset**: Realigned the benchmark L-Bracket root and upright fillet seams from $Z = -26\text{ mm}$ to $Z = -31\text{ mm}$, eliminating the $5\text{ mm}$ forward hover caused by Three.js `geometry.center()` and making beads sit perfectly flush against the vertical backplate.

## [1.3.0] - 2026-10-31

### Added
- **Real-Time Air Gap Substrate Validation**: Algorithmic substrate detection (`validatePathSubstrate`) sampling candidate seam paths at $25\%$, $50\%$, and $75\%$ intervals to probe inward against the workpiece mesh. Dynamically updates the live targeting HUD with an amber `NO SUBSTRATE: Bridging empty space (${gapDistanceMm} mm air gap) — Non-manufacturable!` banner while drawing, switches preview/deposited beads to high-visibility amber hazard styling, tags non-manufacturable seams with amber alerts across Seam List, In-Game HUD, and Parameters Panel, and includes `"air_gap_detected": true` in the exported Weld Job JSON payload.
- **Obstacle Collision Detection & 1-Click Path Splitter**: Added automatic geometric clash detection for seams intersecting structural gusset ribs ($x = \pm 33\text{ mm}$). If a continuous seam traverses solid steel plates, the planner displays an amber `OBSTACLE CLASH` warning with a 1-click `[Split Around Gussets]` button that instantly segments the line into 3 collision-free passes (`Left Outer Root`, `Center Bay Root`, `Right Outer Root`) with automated retract and rapid traverse.
- **Game-Style Cinematic Camera Focus & Zoom**: Seamless automated camera lerp when mapping or selecting any seam. OrbitControls target smoothly glides to the seam midpoint while the camera positions into a dramatic $3/4$ elevated close-up perspective ($90\text{--}150\text{ mm}$ framing distance) with instant manual break-out upon user interaction.
- **Tactical In-Game Seam Specs HUD Card**: Aerospace-inspired floating telemetry overlay displayed when the right sidebar is collapsed. Shows sequence order, joint type, travel speed, arc power, wire feed, and tilt/lead angles with 1-click micro-actions (`[▶ Simulate]`, `[🎯 Re-Focus]`, and `[Open Parameters Panel]`).

### Fixed
- **Eliminated Structure Phasing with Coaxial Tooling & $4\text{ mm}$ Nozzle Setback**: Re-engineered the robotic torch model to be strictly coaxial along the tool centerline axis ($4.2\text{ mm}$ maximum outer radius), completely eliminating asymmetric radial handle offsets that penetrated gussets. Applied standard $4\text{ mm}$ robotic weld crater setback to auto-detected crease endpoints, guaranteeing that the $3.2\text{ mm}$ outer gas cup maintains safe clearance from all transverse gusset walls.
- **Active Simulation Bead & Torch Wire Sizing Synchronization**: Fixed hardcoded $2.5\text{ mm}$ active depositing bead radius and $3.0\text{ mm}$ puddle sphere during simulation. Both the depositing cylinder, the molten puddle, and the physical protruding wire on the robotic torch model now scale dynamically with the selected wire diameter ($0.8\text{ mm}$, $1.0\text{ mm}$, $1.2\text{ mm}$, $1.6\text{ mm}$), ensuring an ultra-thin bead remains thin while depositing and transitions seamlessly into the completed seam.
- **6-DOF Orthonormal Torch Pose Frame**: Replaced unconstrained setFromUnitVectors geodesic rotation with a robust orthonormal basis [X_world, Y_world, Z_world] via orientTorch. Guarantees the curved gooseneck handle curves UP and OUT into open clearance above the part, completely eliminating upside-down handle flips into the floor plate and horizontal skewing into gusset ribs.
- **Transverse Wall Gusset Clearance**: Standardized default seam lead angle to 0° in confined stiffener bays, ensuring approach and retract vectors stay strictly in the open bisector plane rather than pitching backward through solid steel gusset plates.
- **Joint Type Nominal Tilt Baseline**: Parameterized getEffectiveTorchVector to calculate work tilt deltas from joint-specific baselines (45° for FILLET/CORNER/LAP bisectors, 0° for flat BUTT/GROOVE joints).
## [1.2.0] - 2026-10-31

### Added
- **Dynamic 3D Torch Orientation & Angle Resolution**: Real-time calculation of work tilt angles (around seam line) and travel lead angles (push angle) via `getEffectiveTorchVector`.
- **CAD Magnetic Object Snapping (OSNAP)**: 3-mode magnetic snapping (Seam Endpoint, Mesh Triangle Corner/Vertex, Orthogonal Axis Lock).
- **Multi-Orientation Seam Controls**: 1-click 180Â° Invert Normal, 45Â° Fillet bisector preset, and Cartesian plane alignment (+Y, +Z, +X).
- **Welding Wire Diameter Selection**: Support for AWS ER70S-6 wire sizes (0.8 mm, 1.0 mm, 1.2 mm, 1.6 mm) with dynamic 3D bead radius scaling.
- **Machined Steel Fixture Platen**: 360 Ã— 8 Ã— 360 mm platen table with chamfered frame and leveling clamping lugs.
- **Figma-Style Inline Seam Renaming**: Double-click or click edit pencil to rename seams directly in the list.
- **Targeted Single-Seam Preview**: Ability to preview/simulate individual seams via `â–¶ Simulate Seam` button and HUD step scrubber.

### Changed
- **Revamped Seam Action Toolbar**: Replaced cluttered single-row buttons with an ergonomic two-tier CAD toolbar (Primary Simulate & Reverse row + Secondary Reorder, Angle Invert & Delete row).
- **Enhanced CAD Workpiece Specs Card**: Upgraded raw dimensions and triangle count into an informative telemetry HUD with bounding envelope and mesh density tooltips.
- **Targeting Banner Polish**: Redesigned from pill shape to sleek `rounded-lg` white card with smooth fade-in/fade-out animations; eliminated all pulse dots and slashes.
- **Standardized Torch Tooling**: Consolidated to the authentic curved industrial Binzel gooseneck torch; removed redundant pencil toggle.
- **Button Styling**: Upgraded flat orange buttons to multi-stop metallic industrial gradients (`from-[#e97f01] via-[#d46a00] to-[#b35400]`).

### Fixed
- **Torch Simulation Angle Disconnect**: Fixed issue where the 3D torch model stood straight up and plunged vertically regardless of the selected joint tilt angle; torch now physically angles to avoid wall collision.
- **Reticle Rotation Lock**: Fixed bug where the cursor reticle's arrow was stuck pointing +Y `(0, 1, 0)`; reticle now dynamically rotates flush to any 3D face normal.
- **Gusset Piercing**: Partitioned L-bracket crease seams around the 8 mm vertical steel stiffeners to prevent seams from cutting through solid ribs.
- **UI Tab Collision**: Centered the targeting HUD banner to prevent overlapping with collapsed edge tabs.

## [1.0.0] - 2026-10-30

### Initial Release
- STL CAD ingestion with client-side Three.js raycasting and telemetry.
- Automated crease seam detection and manual click-to-weld.
- Armatrix continuum snake-arm cycle time estimation and reach envelope validation.
- Progressive metallic weld bead deposition simulation with electric arc flare.
- Exportable Weld Job JSON conforming to Armatrix downstream robot controller schema.


