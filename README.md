# Armatrix — Autonomous Robotic Weld Seam Planner

An industrial CAD/CAM web platform engineered for **autonomous robotic weld seam planning**, tailored specifically to the operational constraints of **Armatrix's hyper-redundant continuum snake-arm robots**.

![Armatrix Seam Planner Header](public/models/bracket.stl)

---

## 1. Project Overview & Operational Context

Armatrix designs snake-like robotic manipulators (3–5 meter reach, 50–150 mm cross-section, 20+ degrees of freedom) engineered to enter ultra-confined, hazardous industrial environments (ship hull double bottoms, boiler tubes, pipelines, and nuclear heat exchangers) where human welders cannot physically fit.

Before an autonomous snake arm can weld inside a complex cavity, an engineer must:
1. Ingest the structural CAD geometry (`.stl`).
2. Identify seam trajectories and attack angles (surface normals).
3. Specify welding parameters (MIG/TIG/Laser, travel speed, amperage, voltage, wire feed, shielding gas).
4. Sequence seams to minimize thermal heat distortion and prevent internal arm self-collisions.
5. Export a deterministic, machine-readable **Weld Job JSON** consumed by the robot's inverse kinematics (IK) motion controller.

This application provides an end-to-end, browser-based workflow fulfilling these operational requirements.

---

## 2. Core Features Built

### 1. Robust 3D CAD Ingestion (.STL)
* Supports both **Binary and ASCII STL** formats.
* Custom file upload via Drag & Drop or native file picker.
* **Pre-bundled Industrial Benchmark Models** (Structural L-Bracket, Pipe T-Joint, Box Flange) for immediate out-of-the-box evaluation without needing external files.
* Automatic geometric centering, ground-plane alignment, vertex normal re-computation, and bounding box telemetry (`X × Y × Z mm`, triangle count).

### 2. Dual-Mode Seam Planning
* **Autonomous Crease Detection**:
  * Algorithmic dihedral angle crease detection analyzing adjacent triangle face normals across the mesh topology.
  * Identifies 90° fillet and acute weld joints with automatic surface normal bisector calculation.
* **Interactive Point-to-Point Snapping**:
  * Precision raycasting directly on the 3D mesh surface.
  * Click Point 1 (Start) → Click Point 2 (End) to create calibrated weld bead paths.
  * Automatic surface normal derivation at the hit face to establish the torch approach vector.

### 3. Comprehensive Welding Parameter Engineering
* **Process Selection**: MIG (GMAW), TIG (GTAW), and Laser Welding.
* **Joint Geometry**: Fillet, Butt, Lap, Corner, and Edge joints.
* **Electrical & Motion Controls**:
  * Travel Speed (`mm/s`)
  * Welding Current (`Amperes`)
  * Arc Voltage (`Volts`)
  * Wire Feed Speed (`m/min`)
  * Shielding Gas Flow (`L/min`)
* **Torch Attack Angles**: Adjustable Lead Angle and Tilt Angle relative to the local surface normal vector.
* **Standoff Clearance**: Configurable Approach Height and Retract Height in millimeters.

### 4. Thermal Distortion Management & Sequencing
* Reorder seam execution order (Move Up / Move Down) to alternate weld passes across parts and balance thermal expansion.
* **Interpass Cooling Delay**: Configurable cooling duration between seams to prevent thin metal buckling.
* Reverse travel direction (swap Start ⇄ End coordinates) with a single click.

### 5. High-Fidelity 3D Simulation Engine
* Realistic 3D model of **Armatrix's modular welding end-effector** (dark graphite casing with safety red collar and copper nozzle).
* Animated simulation executing:
  1. **Rapid Traverse**: Moves from previous retract point to next approach point at 120 mm/s.
  2. **Safe Approach**: Descends along the surface normal vector to touch off at the seam start point.
  3. **Active Arc Welding**: Travels along the seam with live electric blue/white arc light flicker.
  4. **Retract**: Pulls outward along the surface normal to safe clearance height.
* Simulation timeline HUD with Play/Pause/Reset, speed multipliers (1X, 2X, 5X), and phase status indicators.

### 6. Armatrix Brand & Industrial Ergonomics
* High-contrast tactical theme: Armatrix Olive (`#222B1E`), Industrial Charcoal (`#0D100D`), and High-Visibility Safety Orange (`#FF5B00`).
* CAD HUD overlays, coordinate readouts, camera view presets (Isometric, Top, Front, Right), wireframe toggles, and vector pins.
* Responsive design with slide-out drawers for tablet and mobile inspection.

---

## 3. Architecture & Key Design Decisions

```
armatrix-weld-seam-planner/
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind CSS styling & custom CAD scrollbars
│   │   ├── layout.tsx          # App shell, metadata, and dark theme
│   │   └── page.tsx            # Responsive workbench layout & mobile drawers
│   ├── components/
│   │   ├── viewport/
│   │   │   └── ViewportCanvas.tsx # Three.js WebGL scene, OrbitControls, Raycaster, Torch 3D
│   │   └── panels/
│   │       ├── Header.tsx      # Benchmarks, STL upload, Camera presets, View toggles
│   │       ├── SidebarLeft.tsx # Part telemetry, Seam sequence list, Auto-detect
│   │       ├── SidebarRight.tsx# Welding parameters, Torch angles, Armatrix Kinematics
│   │       ├── SimulationHUD.tsx# Playback transport, Phase badges, Speed controls
│   │       └── ExportModal.tsx # Formatted JSON viewer & interactive schema documentation
│   ├── store/
│   │   └── useWeldStore.ts     # Central Zustand reactive state & JSON export generator
│   ├── types/
│   │   └── weld.ts             # Domain models (WeldSeam, Parameters, RobotExport)
│   └── utils/
│       └── seamDetector.ts     # Dihedral angle crease detection algorithm
└── public/
    └── models/                 # Pre-generated binary STL benchmark parts
```

### Why Next.js 16 + TypeScript?
* **Zero-Friction Cloud Deployment**: One-command instant deployment to Vercel or any Node/Docker environment fulfilling the assignment's public live URL requirement.
* **Strict Type Safety**: Welding vectors, normal orientations, and export JSON schemas are strictly validated at compile time, eliminating runtime undefined errors in the 3D loop.

### Why Direct Three.js with React Wrappers?
* Direct Three.js WebGL rendering inside a reactive `ViewportCanvas` container guarantees 60+ FPS performance even when handling complex STL meshes with tens of thousands of triangles.
* Decouples the 60 FPS animation loop from React's component re-render tree, preventing UI stuttering during high-frequency raycasting and torch motion.

### Why Zustand for State Management?
* Ultra-lightweight and operates seamlessly outside the React render cycle. Three.js raycasting handlers can read and write state without causing unnecessary component thrashing.

---

## 4. Exported Weld Job JSON Schema

The exported JSON is formatted specifically for ingestion by robotic motion controllers and inverse kinematics (IK) solvers:

```json
{
  "schema_version": "1.2.0",
  "generator": "Armatrix Autonomous Seam Planner v1.0",
  "job_id": "ARMX-WELD-MH82J9X",
  "created_at": "2026-10-30T14:15:00.000Z",
  "part": {
    "filename": "Structural L-Bracket",
    "units": "mm",
    "bounding_dimensions_mm": {
      "x": 100.0,
      "y": 82.0,
      "z": 60.0
    }
  },
  "robot_controller_profile": {
    "kinematics": "Armatrix-Continuum-Snake-Arm",
    "reach_envelope_max_mm": 3500,
    "rapid_traverse_speed_mm_s": 120,
    "safe_plane_z_clearance_mm": 40
  },
  "job_summary": {
    "total_seams": 3,
    "total_weld_length_mm": 218.4,
    "estimated_active_weld_time_sec": 18.2,
    "estimated_traverse_time_sec": 2.4,
    "estimated_cooling_delays_sec": 15.0,
    "total_cycle_time_sec": 35.6
  },
  "seams": [
    {
      "seam_id": "SEAM-01",
      "name": "Seam 1 (90.0 mm)",
      "sequence_order": 1,
      "process": "MIG",
      "joint_type": "FILLET",
      "length_mm": 90.0,
      "start_coordinate": [-45.0, 12.0, -18.0],
      "end_coordinate": [45.0, 12.0, -18.0],
      "surface_normal": [0.0, 0.707, 0.707],
      "approach_point": [-45.0, 29.675, -0.325],
      "retract_point": [45.0, 33.21, 3.21],
      "torch_orientation": {
        "lead_angle_deg": 10.0,
        "tilt_angle_deg": 45.0
      },
      "weld_parameters": {
        "travel_speed_mm_s": 12.0,
        "current_amps": 180,
        "voltage_volts": 24.0,
        "wire_feed_m_min": 6.5,
        "shielding_gas_l_min": 14.0,
        "interpass_delay_sec": 5.0
      },
      "waypoints": [
        [-45.0, 12.0, -18.0],
        [-40.0, 12.0, -18.0],
        [-35.0, 12.0, -18.0],
        "..."
      ]
    }
  ]
}
```

### Field Definitions:

| Field | Type | Description |
| :--- | :--- | :--- |
| `schema_version` | String | Version identifier for backward compatibility with robot firmware. |
| `job_id` | String | Unique tracking ID generated for the manufacturing session. |
| `part.bounding_dimensions_mm` | Object | Overall `X, Y, Z` envelope to verify part fits inside the fixture. |
| `robot_controller_profile` | Object | Continuum snake-arm parameters (3500mm reach, rapid speed, safe clearance plane). |
| `job_summary` | Object | Total weld length, arc-on time, non-welding traverse time, cooling delays, and total cycle duration. |
| `seam_id` & `sequence_order` | String / Int | Unique identifier and execution order index for thermal distortion management. |
| `process` | Enum | `MIG`, `TIG`, or `LASER`. Directs the power source mode and wire feeder. |
| `joint_type` | Enum | Joint classification (`FILLET`, `BUTT`, `LAP`, etc.) for adaptive weaving. |
| `start_coordinate` / `end_coordinate` | Float[3] | 3D Cartesian coordinates in the part coordinate frame (`[X, Y, Z]` mm). |
| `surface_normal` | Float[3] | Unit vector pointing outward from the joint; dictates the torch bisector angle. |
| `approach_point` | Float[3] | Safe 3D coordinate calculated at `start_coordinate + normal * approach_distance`. The snake arm positions here prior to striking the arc to prevent collisions. |
| `retract_point` | Float[3] | Safe 3D coordinate calculated at `end_coordinate + normal * retract_distance`. The torch pulls out here after extinguishing the arc before traversing. |
| `torch_orientation` | Object | Lead (push/drag) and tilt angles in degrees relative to the seam vector. |
| `weld_parameters` | Object | Electrical parameters (amperage, voltage, wire feed speed, gas flow) and interpass cooling time. |
| `waypoints` | Float[][3] | Discretized 5mm trajectory spline coordinates for direct input to the inverse kinematics solver. |

---

## 5. Local Setup & Execution Guide

### Prerequisites
* **Node.js**: v18.0 or higher (Tested on Node v22)
* **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`

### Steps
```bash
# 1. Clone repository
git clone https://github.com/your-username/armatrix-weld-seam-planner.git
cd armatrix-weld-seam-planner

# 2. Install dependencies
pnpm install

# 3. Generate benchmark 3D STL models (if needed)
node scripts/generate_sample_stls.js

# 4. Start local development server
pnpm run dev

# 5. Open in browser
# Navigate to http://localhost:3000
```

### Production Build
```bash
# Build optimized production bundle
pnpm run build

# Start production server
pnpm run start
```

---

## 6. How We Evaluated Operational Edge Cases

1. **Confined Space Approach/Retract**: Traditional open-gantry Cartesian robots can approach a part from any arbitrary direction. Inside a pipe or narrow compartment, Armatrix's snake arm cannot do this. Every seam in our planner generates **explicit normal approach and retract vectors** ensuring the robot enters and leaves safely without scraping adjacent walls.
2. **Thermal Distortion Optimization**: Thin structural plates warp if adjacent welds are performed continuously. Our planner provides instant sequence reordering and configurable interpass cooling delays.
3. **Deterministic Waypoint Discretization**: Industrial robot controllers often experience kinematic singularities if given only sparse endpoints. We compute interpolated 5mm waypoint splines so the trajectory planner maintains constant travel speed along the seam.

