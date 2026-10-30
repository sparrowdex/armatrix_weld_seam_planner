# Armatrix Weld Seam Planner — Project Scope & Deliverables

> **Strict Boundary Rule:** Do NOT add unrequested features or build complex extraneous systems. Stick strictly to what Pulkit (`pulkit@armatrix.com`) has asked for in the evaluation rubric. Focus only on refining, polishing, and verifying the required deliverables.

---

## 1. The 4 Required Deliverables (Due: within 7–10 days)

1. **Live Hosted Application URL:**
   - A public, browser-accessible URL (e.g. Vercel deployment) where Pulkit can load the web app and test it immediately without local installation.
2. **GitHub Repository Link:**
   - Public or shared Git repository with clean commits, structured code, and no temporary files.
3. **Comprehensive `README.md`:**
   - Clear instructions to run locally (`pnpm install`, `pnpm run dev`).
   - Architecture & design decisions (Three.js WebGL, Zustand state management, Next.js).
   - Core feature overview.
   - **Detailed field-by-field explanation of the Exported Weld Job JSON schema**.
4. **Short Screen Recording (2–3 Minutes):**
   - Video demonstrating the complete workflow:
     1. Selecting/uploading an STL CAD model.
     2. Crease seam detection & manual seam creation.
     3. Adjusting welding parameters and reordering sequence.
     4. Running the 3D toolpath simulation.
     5. Exporting and inspecting the Weld Job JSON file.

---

## 2. Core Functional Requirements (What is Evaluated)

* **STL CAD Part Ingestion:**
  - Robust loading of benchmark parts (`bracket.stl`, `pipe_joint.stl`, `box_flange.stl`, `armatrix_emblem.stl`).
  - Handling custom `.stl` files uploaded by Pulkit without crashing.
  - Calculation of part dimensions (width, height, depth) and bounding boxes.
* **Weld Seam Definition:**
  - Automated crease / feature seam detection along geometric joint intersections.
  - Interactive manual click-to-weld (picking two points on the 3D model).
* **Toolpath & Process Configuration:**
  - Safe approach & retract clearance standoff vectors (preventing robot collisions with walls).
  - Sequence reordering (move up / down) and weld direction reversal (thermal distortion control).
  - Weld parameters: process (MIG/TIG/Laser), joint type (fillet, butt, lap, corner), travel speed, current, voltage, wire feed speed, lead/tilt angles, and interpass cooling delays.
* **Kinematics & Simulation:**
  - Non-blocking 60 FPS simulation loop showing the robotic torch executing the toolpath.
  - Progressive deposit of metallic weld bead behind the torch tip.
  - Cycle time calculation (active arc time + rapid traverse travel + cooling delays).
  - Integration with Armatrix Snake-Arm parameters (3500 mm reach envelope, 120 mm/s rapid traverse).
* **Weld Job JSON Export:**
  - Downloadable and copyable JSON output containing all toolpaths, vectors, sequences, and parameters formatted for Armatrix's downstream robot kinematics controller.

---

## 3. Scope Boundaries & Anti-Goals (DO NOT BUILD)

* ❌ **DO NOT** attempt a full multi-joint Inverse Kinematics (IK) physics simulation of 20 snake segments (this is a CAM toolpath planner, not a physics engine).
* ❌ **DO NOT** add user authentication, databases, accounts, or cloud logins.
* ❌ **DO NOT** add unnecessary decorative 3D models or unrequested nozzle shops/catalogs.
* ❌ **DO NOT** add unrequested complex pages (e.g., marketing homepage, blog, user settings).
* ❌ **DO NOT** clutter the UI with redundant icons, playful emojis, or sparkle graphics.

---

## 4. Current Status Checklist

- [x] Next.js + React + TypeScript + Three.js + Zustand + Tailwind CSS stack initialized
- [x] Watertight benchmark models generated in `public/models/`
- [x] Custom `.stl` uploader with bounding box telemetry
- [x] Automated crease seam detector & manual point-to-point seam picking
- [x] Toolpath sequence reordering & direction reversal
- [x] Full weld parameters (MIG/TIG/Laser, travel speed, current, voltage, wire feed, lead/tilt angles, cooling delays)
- [x] Armatrix Snake-Arm kinematics cycle time breakdown
- [x] Progressive metallic weld bead simulation with electric arc lighting
- [x] Seamless, transparent UI matching Armatrix brand guidelines (`#e97f01`, Onest font, clean layout)
- [x] Zero-gap full-width viewport on sidebar collapse with `ResizeObserver`
- [x] Production-grade Weld Job JSON generator with schema documentation tab
- [x] Comprehensive `README.md`
- [ ] Deploy to Vercel (deliverable #1)
- [ ] Push to GitHub (deliverable #2)
- [ ] Record 2–3 minute video demo (deliverable #4)
