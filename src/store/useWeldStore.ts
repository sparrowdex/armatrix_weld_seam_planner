import * as THREE from 'three';
import { REACH_ENVELOPE_MM } from '@/utils/reach';
import { getEffectiveTorchVector } from '@/utils/torchKinematics';
import { create } from 'zustand';
import { PartMetadata, Vector3D, WeldParameters, WeldSeam, ViewportMode, WeldJobExport, WeldSeamExport, TorchNozzleType } from '@/types/weld';

export interface WeldState {
  // Part state
  part: PartMetadata | null;
  partLoading: boolean;
  activeModelName: string;
  customModels: Array<{ name: string; buffer: ArrayBuffer }>;

  // Viewport & Interaction
  mode: ViewportMode;
  showWireframe: boolean;
  showNormals: boolean;
  showBoundingBox: boolean;
  showWaypoints: boolean;
  showPlaten: boolean;
  viewPreset: 'iso' | 'top' | 'front' | 'right' | null;
  /** Camera preset the view currently matches (header highlight); null once the user orbits away. */
  activeView: 'iso' | 'top' | 'front' | 'right' | null;
  setActiveView: (view: 'iso' | 'top' | 'front' | 'right' | null) => void;

  // Seam creation temporary state
  manualStartPoint: Vector3D | null;
  manualStartNormal: Vector3D | null;
  manualCandidatePoint: Vector3D | null;
  manualCandidateNormal: Vector3D | null;

  // Seams
  seams: WeldSeam[];
  seamHistory: WeldSeam[][];
  selectedSeamId: string | null;
  completedSeamIds: string[];

  // Robot / Planner Config
  rapidTraverseSpeed: number; // mm/s
  approachClearance: number; // mm
  retractClearance: number; // mm
  safePlaneZClearance: number; // mm
  nozzleType: TorchNozzleType;

  // Default parameters for new seams
  defaultParameters: WeldParameters;

  // Simulation
  isSimulating: boolean;
  simProgress: number; // 0 to 1
  simCurrentSeamIndex: number;
  simTargetSeamId: string | null;
  simPhase: 'idle' | 'rapid_traverse' | 'approach' | 'welding' | 'retract' | 'cooling' | 'dry_run';
  simNotice: string | null;
  soundEnabled: boolean;
  // Easter eggs
  funToast: string | null;
  funToastTone: 'info' | 'warn';
  funToastKey: number;
  shortcutsOpen: boolean;
  tourOpen: boolean;
  logoWiggleKey: number;
  playbackSpeed: number;

  // Actions
  setPart: (part: PartMetadata | null) => void;
  setPartLoading: (loading: boolean) => void;
  setActiveModelName: (name: string) => void;
  addCustomModel: (name: string, buffer: ArrayBuffer) => void;
  setMode: (mode: ViewportMode) => void;
  toggleWireframe: () => void;
  toggleNormals: () => void;
  toggleBoundingBox: () => void;
  toggleWaypoints: () => void;
  togglePlaten: () => void;
  showXRay: boolean;
  toggleXRay: () => void;
  setViewPreset: (preset: 'iso' | 'top' | 'front' | 'right' | null) => void;
  setNozzleType: (nozzle: TorchNozzleType) => void;

  setManualStartPoint: (point: Vector3D | null, normal: Vector3D | null) => void;
  setManualCandidatePoint: (point: Vector3D | null, normal: Vector3D | null) => void;

  addSeam: (start: Vector3D, end: Vector3D, normal: Vector3D, createdVia?: 'manual' | 'detected', customName?: string, hasAirGap?: boolean, airGapDistanceMm?: number) => WeldSeam;
  removeSeam: (id: string) => void;
  updateSeamParameters: (id: string, params: Partial<WeldParameters>) => void;
  selectSeam: (id: string | null) => void;
  markSeamCompleted: (id: string) => void;
  resetCompletedSeams: () => void;
  optimizeSeamSequence: () => void;
  reorderSeams: (newOrder: WeldSeam[]) => void;
  reverseSeamDirection: (id: string) => void;
  flipSeamNormal: (id: string) => void;
  setSeamNormal: (id: string, normal: Vector3D) => void;
  renameSeam: (id: string, name: string) => void;
  undo: () => void;
  clearSeams: () => void;

  setRobotConfig: (config: { rapidTraverseSpeed?: number; approachClearance?: number; retractClearance?: number; safePlaneZClearance?: number }) => void;
  setDefaultParameters: (params: Partial<WeldParameters>) => void;

  // Simulation controls
  startSimulation: (targetSeamId?: string | null) => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setSimProgress: (progress: number) => void;
  setSimPhase: (phase: WeldState['simPhase']) => void;
  setSimCurrentSeamIndex: (index: number) => void;
  setSimNotice: (notice: string | null) => void;
  toggleSound: () => void;
  showFunToast: (message: string, tone?: 'info' | 'warn') => void;
  wiggleLogo: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setTourOpen: (open: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Exporters
  exportJobJSON: () => WeldJobExport;
}

const defaultWeldParams: WeldParameters = {
  process: 'MIG',
  jointType: 'FILLET',
  travelSpeed: 12, // mm/s
  current: 180, // Amperes
  voltage: 24, // Volts
  wireFeedSpeed: 6.5, // m/min
  gasFlowRate: 14, // L/min (Argon mix)
  torchLeadAngle: 0, // degrees (0° bisecting clearance for confined bays/gussets)
  torchTiltAngle: 45, // degrees for fillet
  approachDistance: 25, // mm
  retractDistance: 30, // mm
  interpassDelay: 5, // 5s cooling
  wireDiameter: 1.2, // mm (AWS ER70S-6 structural standard)
  nozzleType: 'narrow',
};

export const useWeldStore = create<WeldState>((set, get) => ({
  part: null,
  partLoading: false,
  activeModelName: 'Structural L-Bracket',
  customModels: [],

  mode: 'orbit',
  showWireframe: false,
  showNormals: true,
  showBoundingBox: false,
  showWaypoints: true,
  showPlaten: true,
  showXRay: false,
  viewPreset: null,
  activeView: 'iso',

  manualStartPoint: null,
  manualStartNormal: null,
  manualCandidatePoint: null,
  manualCandidateNormal: null,

  seams: [],
  seamHistory: [],
  selectedSeamId: null,
  completedSeamIds: [],

  rapidTraverseSpeed: 120, // mm/s
  approachClearance: 25,
  retractClearance: 30,
  safePlaneZClearance: 40,
  nozzleType: 'narrow', // Default to deep-access confined space nozzle

  defaultParameters: defaultWeldParams,

  isSimulating: false,
  simProgress: 0,
  simCurrentSeamIndex: 0,
  simTargetSeamId: null,
  simPhase: 'idle',
  simNotice: null,
  soundEnabled: false,
  funToast: null,
  funToastTone: 'info',
  funToastKey: 0,
  shortcutsOpen: false,
  tourOpen: false,
  logoWiggleKey: 0,
  playbackSpeed: 1,

  setPart: (part) => set({ part }),
  setPartLoading: (loading) => set({ partLoading: loading }),
  // When switching models, atomically clear old seams so they never stack up or float in space!
  setActiveModelName: (name) => set({ activeModelName: name, seams: [], seamHistory: [], selectedSeamId: null, completedSeamIds: [] }),
  addCustomModel: (name, buffer) =>
    set((state) => {
      const filtered = state.customModels.filter((m) => m.name !== name);
      return {
        customModels: [...filtered, { name, buffer }],
        activeModelName: name,
        seams: [],
        seamHistory: [],
        selectedSeamId: null,
        completedSeamIds: [],
      };
    }),
  setMode: (mode) => set({ mode, manualStartPoint: null, manualCandidatePoint: null }),
  toggleWireframe: () => set((s) => ({ showWireframe: !s.showWireframe })),
  toggleNormals: () => set((s) => ({ showNormals: !s.showNormals })),
  toggleBoundingBox: () => set((s) => ({ showBoundingBox: !s.showBoundingBox })),
  toggleWaypoints: () => set((s) => ({ showWaypoints: !s.showWaypoints })),
  togglePlaten: () => set((s) => ({ showPlaten: !s.showPlaten })),
  toggleXRay: () => set((s) => ({ showXRay: !s.showXRay })),
  setViewPreset: (preset) => set(preset ? { viewPreset: preset, activeView: preset } : { viewPreset: null }),
  setActiveView: (view) => set({ activeView: view }),
  setNozzleType: (nozzle) => set({ nozzleType: nozzle }),

  setManualStartPoint: (point, normal) => set({ manualStartPoint: point, manualStartNormal: normal }),
  setManualCandidatePoint: (point, normal) => set({ manualCandidatePoint: point, manualCandidateNormal: normal }),

  addSeam: (start, end, normal, createdVia = 'manual', customName, hasAirGap, airGapDistanceMm) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const length = parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2));

    // Reject accidental micro-clicks so they don't spawn near-zero-length seams. The threshold is 2 mm on
    // normal parts and 2% of the part diagonal on small ones, so real seams on tiny parts are kept.
    const dims = get().part?.dimensions;
    const partDiag = dims ? Math.hypot(dims.width, dims.height, dims.depth) : 100;
    const minSeamLength = Math.min(2.0, Math.max(0.01, partDiag * 0.02));
    if (length < minSeamLength) {
      set({ manualStartPoint: null, manualCandidatePoint: null });
      return null as any;
    }

    // Easter egg: a hand-drawn seam of (about) 42 mm
    if (createdVia === 'manual' && Math.abs(length - 42) < 0.25) {
      get().showFunToast('The answer to everything, fused.');
    }

    const seams = get().seams;
    const prevHistory = get().seamHistory;
    const nextOrder = seams.length + 1;
    const id = `SEAM-${String(nextOrder).padStart(2, '0')}`;

    const newSeam: WeldSeam = {
      id,
      name: customName || `Seam ${nextOrder}`,
      sequenceOrder: nextOrder,
      startPoint: start,
      endPoint: end,
      normal,
      length,
      parameters: { ...get().defaultParameters, nozzleType: get().nozzleType },
      createdVia,
      hasAirGap,
      airGapDistanceMm,
    };

    set({
      seams: [...seams, newSeam],
      seamHistory: [...prevHistory, seams].slice(-25),
      selectedSeamId: id,
      manualStartPoint: null,
      manualCandidatePoint: null,
    });

    return newSeam;
  },

  removeSeam: (id) =>
    set((state) => {
      const prevSeams = state.seams;
      const filtered = state.seams.filter((s) => s.id !== id);
      const reindexed = filtered.map((s, idx) => ({
        ...s,
        sequenceOrder: idx + 1,
      }));
      return {
        seams: reindexed,
        seamHistory: [...state.seamHistory, prevSeams].slice(-25),
        selectedSeamId: state.selectedSeamId === id ? (reindexed[0]?.id ?? null) : state.selectedSeamId,
        completedSeamIds: state.completedSeamIds.filter((cid) => cid !== id),
      };
    }),

  updateSeamParameters: (id, params) =>
    set((state) => ({
      seams: state.seams.map((s) => (s.id === id ? { ...s, parameters: { ...s.parameters, ...params } } : s)),
    })),

  renameSeam: (id, name) =>
    set((state) => ({
      seams: state.seams.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)),
    })),

  selectSeam: (id) => set({ selectedSeamId: id }),

  markSeamCompleted: (id) =>
    set((state) => ({
      completedSeamIds: state.completedSeamIds.includes(id)
        ? state.completedSeamIds
        : [...state.completedSeamIds, id],
    })),

  resetCompletedSeams: () => set({ completedSeamIds: [] }),

  undo: () =>
    set((state) => {
      if (state.seamHistory.length === 0) return state;
      const history = [...state.seamHistory];
      const previousSeams = history.pop()!;
      return {
        seams: previousSeams,
        seamHistory: history,
        selectedSeamId: previousSeams[previousSeams.length - 1]?.id ?? null,
        completedSeamIds: state.completedSeamIds.filter((cid) => previousSeams.some((s) => s.id === cid)),
      };
    }),

  optimizeSeamSequence: () =>
    set((state) => {
      if (state.seams.length <= 1) return state;

      // Professional Thermal Mitigation: Alternate weld seams across workpiece geometry
      // to distribute heat input symmetrically and prevent angular thermal warpage/distortion.
      const sorted = [...state.seams].sort((a, b) => {
        const midA = (a.startPoint.x + a.endPoint.x) / 2;
        const midB = (b.startPoint.x + b.endPoint.x) / 2;
        return midA - midB;
      });

      // Interleave left and right halves (skip-welding pattern)
      const half = Math.ceil(sorted.length / 2);
      const left = sorted.slice(0, half);
      const right = sorted.slice(half).reverse();
      const interleaved: WeldSeam[] = [];

      for (let i = 0; i < half; i++) {
        if (left[i]) interleaved.push(left[i]);
        if (right[i]) interleaved.push(right[i]);
      }

      return {
        seams: interleaved.map((s, idx) => ({
          ...s,
          sequenceOrder: idx + 1,
        })),
        completedSeamIds: [],
      };
    }),

  reorderSeams: (newOrder) =>
    set({
      seams: newOrder.map((s, idx) => ({ ...s, sequenceOrder: idx + 1 })),
    }),

  reverseSeamDirection: (id) =>
    set((state) => ({
      seams: state.seams.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          startPoint: s.endPoint,
          endPoint: s.startPoint,
        };
      }),
    })),

  flipSeamNormal: (id) =>
    set((state) => ({
      seams: state.seams.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          normal: {
            x: parseFloat((-s.normal.x).toFixed(3)),
            y: parseFloat((-s.normal.y).toFixed(3)),
            z: parseFloat((-s.normal.z).toFixed(3)),
          },
        };
      }),
    })),

  setSeamNormal: (id, normal) =>
    set((state) => ({
      seams: state.seams.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          normal,
        };
      }),
    })),

  clearSeams: () =>
    set((state) => ({
      seamHistory: state.seams.length > 0 ? [...state.seamHistory, state.seams].slice(-25) : state.seamHistory,
      seams: [],
      selectedSeamId: null,
      completedSeamIds: [],
    })),

  setRobotConfig: (config) =>
    set((state) => ({
      rapidTraverseSpeed: config.rapidTraverseSpeed ?? state.rapidTraverseSpeed,
      approachClearance: config.approachClearance ?? state.approachClearance,
      retractClearance: config.retractClearance ?? state.retractClearance,
      safePlaneZClearance: config.safePlaneZClearance ?? state.safePlaneZClearance,
    })),

  setDefaultParameters: (params) =>
    set((state) => ({
      defaultParameters: { ...state.defaultParameters, ...params },
    })),

  startSimulation: (targetSeamId = null) =>
    set((state) => {
      let startIndex = 0;
      if (targetSeamId) {
        const found = state.seams.findIndex((s) => s.id === targetSeamId);
        if (found !== -1) startIndex = found;
      } else if (state.selectedSeamId) {
        const found = state.seams.findIndex((s) => s.id === state.selectedSeamId);
        if (found !== -1) startIndex = found;
      } else {
        // Non-manufacturable (air-gap) seams are never welded, so they never count as pending work
        const uncompletedIdx = state.seams.findIndex((s) => !s.hasAirGap && !state.completedSeamIds.includes(s.id));
        if (uncompletedIdx !== -1 && uncompletedIdx < state.seams.length) {
          startIndex = uncompletedIdx;
        }
      }

      const weldable = state.seams.filter((s) => !s.hasAirGap);
      const allWelded = weldable.length > 0 && weldable.every((s) => state.completedSeamIds.includes(s.id));

      return {
        isSimulating: true,
        simNotice: null,
        mode: 'simulate',
        simTargetSeamId: targetSeamId,
        simCurrentSeamIndex: startIndex,
        selectedSeamId: targetSeamId ? targetSeamId : null,
        completedSeamIds:
          allWelded && !targetSeamId
            ? []
            : state.completedSeamIds,
      };
    }),
  pauseSimulation: () => set({ isSimulating: false, simTargetSeamId: null }),
  resetSimulation: () =>
    set({
      isSimulating: false,
      simProgress: 0,
      simCurrentSeamIndex: 0,
      simTargetSeamId: null,
      simPhase: 'idle',
      simNotice: null,
      completedSeamIds: [],
    }),
  setSimProgress: (progress) => set({ simProgress: progress }),
  setSimPhase: (phase) => set({ simPhase: phase }),
  setSimCurrentSeamIndex: (index) => set({ simCurrentSeamIndex: index }),
  setSimNotice: (notice) => set({ simNotice: notice }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  showFunToast: (message, tone = 'info') => {
    set((state) => ({ funToast: message, funToastTone: tone, funToastKey: state.funToastKey + 1 }));
    setTimeout(() => {
      if (get().funToast === message) set({ funToast: null });
    }, tone === 'warn' ? 5200 : 3200);
  },
  wiggleLogo: () => set((state) => ({ logoWiggleKey: state.logoWiggleKey + 1 })),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setTourOpen: (open) => set({ tourOpen: open }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  exportJobJSON: () => {
    const s = get();
    const seams = s.seams;

    let totalLength = 0;
    let totalWeldTime = 0;
    let totalCooling = 0;
    const executableSeams = seams.filter((seam) => !seam.hasAirGap);
    const lastExecutableId = executableSeams.length ? executableSeams[executableSeams.length - 1].id : null;

    const exportedSeams: WeldSeamExport[] = seams.map((seam) => {
      // Totals cover executable seams only, matching the simulation (air-gap seams are never welded).
      if (!seam.hasAirGap) {
        totalLength += seam.length;
        totalWeldTime += seam.length / seam.parameters.travelSpeed;
        // Interpass cooling happens between passes, so the final pass adds none.
        if (seam.id !== lastExecutableId) totalCooling += seam.parameters.interpassDelay;
      }

      const steps = Math.max(2, Math.ceil(seam.length / 5));
      const waypoints: Array<[number, number, number]> = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = seam.startPoint.x + (seam.endPoint.x - seam.startPoint.x) * t;
        const py = seam.startPoint.y + (seam.endPoint.y - seam.startPoint.y) * t;
        const pz = seam.startPoint.z + (seam.endPoint.z - seam.startPoint.z) * t;
        waypoints.push([parseFloat(px.toFixed(3)), parseFloat(py.toFixed(3)), parseFloat(pz.toFixed(3))]);
      }

      const appDist = seam.parameters.approachDistance;
      const retDist = seam.parameters.retractDistance;
      // Approach/retract follow the same effective torch axis the simulation uses
      // (surface normal rotated by the joint work-angle offset and the travel lead angle).
      const torchAxis = getEffectiveTorchVector(
        new THREE.Vector3(seam.startPoint.x, seam.startPoint.y, seam.startPoint.z),
        new THREE.Vector3(seam.endPoint.x, seam.endPoint.y, seam.endPoint.z),
        new THREE.Vector3(seam.normal.x, seam.normal.y, seam.normal.z),
        seam.parameters.torchTiltAngle,
        seam.parameters.torchLeadAngle,
        seam.parameters.jointType
      );
      const approachPoint: [number, number, number] = [
        parseFloat((seam.startPoint.x + torchAxis.x * appDist).toFixed(3)),
        parseFloat((seam.startPoint.y + torchAxis.y * appDist).toFixed(3)),
        parseFloat((seam.startPoint.z + torchAxis.z * appDist).toFixed(3)),
      ];
      const retractPoint: [number, number, number] = [
        parseFloat((seam.endPoint.x + torchAxis.x * retDist).toFixed(3)),
        parseFloat((seam.endPoint.y + torchAxis.y * retDist).toFixed(3)),
        parseFloat((seam.endPoint.z + torchAxis.z * retDist).toFixed(3)),
      ];

      return {
        seam_id: seam.id,
        name: seam.name,
        sequence_order: seam.sequenceOrder,
        process: seam.parameters.process,
        joint_type: seam.parameters.jointType,
        length_mm: seam.length,
        start_coordinate: [seam.startPoint.x, seam.startPoint.y, seam.startPoint.z],
        end_coordinate: [seam.endPoint.x, seam.endPoint.y, seam.endPoint.z],
        surface_normal: [seam.normal.x, seam.normal.y, seam.normal.z],
        approach_point: approachPoint,
        retract_point: retractPoint,
        torch_axis: [+torchAxis.x.toFixed(4), +torchAxis.y.toFixed(4), +torchAxis.z.toFixed(4)],
        travel_direction: (() => {
          const dx = seam.endPoint.x - seam.startPoint.x;
          const dy = seam.endPoint.y - seam.startPoint.y;
          const dz = seam.endPoint.z - seam.startPoint.z;
          const len = Math.hypot(dx, dy, dz) || 1;
          return [+(dx / len).toFixed(4), +(dy / len).toFixed(4), +(dz / len).toFixed(4)] as [number, number, number];
        })(),
        executable: !seam.hasAirGap,
        torch_orientation: {
          lead_angle_deg: seam.parameters.torchLeadAngle,
          tilt_angle_deg: seam.parameters.torchTiltAngle,
          nozzle_type: seam.parameters.nozzleType || s.nozzleType,
        },
        weld_parameters: {
          travel_speed_mm_s: seam.parameters.travelSpeed,
          current_amps: seam.parameters.current,
          voltage_volts: seam.parameters.voltage,
          wire_feed_m_min: seam.parameters.wireFeedSpeed,
          shielding_gas_l_min: seam.parameters.gasFlowRate,
          interpass_delay_sec: seam.parameters.interpassDelay,
          wire_diameter_mm: seam.parameters.wireDiameter ?? 1.2,
        },
        air_gap_detected: seam.hasAirGap || false,
        waypoints,
      };
    });

    // Rapid traverse runs retract -> next approach between consecutive executable seams
    const runSeams = exportedSeams.filter((es) => es.executable);
    let totalTraverseDist = 0;
    for (let i = 0; i < runSeams.length - 1; i++) {
      const p1 = runSeams[i].retract_point;
      const p2 = runSeams[i + 1].approach_point;
      const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2) + Math.pow(p2[2] - p1[2], 2));
      totalTraverseDist += dist;
    }
    const totalTraverseTime = s.rapidTraverseSpeed > 0 ? totalTraverseDist / s.rapidTraverseSpeed : 0;
    const totalCycleTime = totalWeldTime + totalTraverseTime + totalCooling;

    const jobExport: WeldJobExport = {
      schema_version: '1.3.0',
      generator: 'Armatrix Autonomous Seam Planner v1.0',
      job_id: `ARMX-WELD-${Date.now().toString(36).toUpperCase()}`,
      created_at: new Date().toISOString(),
      part: {
        filename: s.part?.name ?? 'custom_part.stl',
        units: 'mm',
        bounding_dimensions_mm: {
          x: s.part?.dimensions.width ?? 0,
          y: s.part?.dimensions.height ?? 0,
          z: s.part?.dimensions.depth ?? 0,
        },
        coordinate_frame: {
          handedness: 'right-handed',
          up_axis: '+Y',
          origin: 'Part bounding-box centre in X and Z, at the part\'s lowest point in Y (the fixture table surface)',
        },
        mesh_integrity: s.part?.integrity
          ? { watertight: s.part.integrity.isWatertight, open_edges: s.part.integrity.openEdges }
          : null,
      },
      robot_controller_profile: {
        kinematics: 'Armatrix-Continuum-Snake-Arm',
        reach_envelope_max_mm: REACH_ENVELOPE_MM,
        rapid_traverse_speed_mm_s: s.rapidTraverseSpeed,
        safe_plane_z_clearance_mm: s.safePlaneZClearance,
        tool_effector: {
          model: 'Armatrix-Modular-Torch-MK3',
          nozzle_configuration: s.nozzleType === 'narrow' ? 'Narrow-Bottleneck-Deep-Access' : s.nozzleType === 'laser' ? 'Laser-Optic-Coaxial' : 'Standard-Conical-MIG',
        },
      },
      job_summary: {
        total_seams: seams.length,
        executable_seams: executableSeams.length,
        skipped_seam_ids: seams.filter((seam) => seam.hasAirGap).map((seam) => seam.id),
        total_weld_length_mm: parseFloat(totalLength.toFixed(2)),
        estimated_active_weld_time_sec: parseFloat(totalWeldTime.toFixed(2)),
        estimated_traverse_time_sec: parseFloat(totalTraverseTime.toFixed(2)),
        estimated_cooling_delays_sec: parseFloat(totalCooling.toFixed(2)),
        total_cycle_time_sec: parseFloat(totalCycleTime.toFixed(2)),
      },
      seams: exportedSeams,
    };

    return jobExport;
  },
}));
