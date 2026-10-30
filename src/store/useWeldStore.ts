import { create } from 'zustand';
import { PartMetadata, Vector3D, WeldParameters, WeldSeam, ViewportMode, WeldJobExport, WeldSeamExport, TorchNozzleType } from '@/types/weld';

export interface WeldState {
  // Part state
  part: PartMetadata | null;
  partLoading: boolean;
  activeModelName: string;

  // Viewport & Interaction
  mode: ViewportMode;
  showWireframe: boolean;
  showNormals: boolean;
  showBoundingBox: boolean;
  showWaypoints: boolean;
  viewPreset: 'iso' | 'top' | 'front' | 'right' | null;

  // Seam creation temporary state
  manualStartPoint: Vector3D | null;
  manualStartNormal: Vector3D | null;
  manualCandidatePoint: Vector3D | null;
  manualCandidateNormal: Vector3D | null;

  // Seams
  seams: WeldSeam[];
  selectedSeamId: string | null;

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
  simPhase: 'idle' | 'rapid_traverse' | 'approach' | 'welding' | 'retract' | 'cooling';
  playbackSpeed: number;

  // Actions
  setPart: (part: PartMetadata | null) => void;
  setPartLoading: (loading: boolean) => void;
  setActiveModelName: (name: string) => void;
  setMode: (mode: ViewportMode) => void;
  toggleWireframe: () => void;
  toggleNormals: () => void;
  toggleBoundingBox: () => void;
  toggleWaypoints: () => void;
  setViewPreset: (preset: 'iso' | 'top' | 'front' | 'right' | null) => void;
  setNozzleType: (nozzle: TorchNozzleType) => void;

  setManualStartPoint: (point: Vector3D | null, normal: Vector3D | null) => void;
  setManualCandidatePoint: (point: Vector3D | null, normal: Vector3D | null) => void;

  addSeam: (start: Vector3D, end: Vector3D, normal: Vector3D, createdVia?: 'manual' | 'detected') => WeldSeam;
  removeSeam: (id: string) => void;
  updateSeamParameters: (id: string, params: Partial<WeldParameters>) => void;
  selectSeam: (id: string | null) => void;
  reorderSeams: (newOrder: WeldSeam[]) => void;
  reverseSeamDirection: (id: string) => void;
  clearSeams: () => void;

  setRobotConfig: (config: { rapidTraverseSpeed?: number; approachClearance?: number; retractClearance?: number; safePlaneZClearance?: number }) => void;
  setDefaultParameters: (params: Partial<WeldParameters>) => void;

  // Simulation controls
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setSimProgress: (progress: number) => void;
  setSimPhase: (phase: WeldState['simPhase']) => void;
  setSimCurrentSeamIndex: (index: number) => void;
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
  torchLeadAngle: 10, // degrees
  torchTiltAngle: 45, // degrees for fillet
  approachDistance: 25, // mm
  retractDistance: 30, // mm
  interpassDelay: 5, // 5s cooling
  nozzleType: 'narrow',
};

export const useWeldStore = create<WeldState>((set, get) => ({
  part: null,
  partLoading: false,
  activeModelName: 'Structural L-Bracket',

  mode: 'orbit',
  showWireframe: false,
  showNormals: true,
  showBoundingBox: false,
  showWaypoints: true,
  viewPreset: null,

  manualStartPoint: null,
  manualStartNormal: null,
  manualCandidatePoint: null,
  manualCandidateNormal: null,

  seams: [],
  selectedSeamId: null,

  rapidTraverseSpeed: 120, // mm/s
  approachClearance: 25,
  retractClearance: 30,
  safePlaneZClearance: 40,
  nozzleType: 'narrow', // Default to deep-access confined space nozzle

  defaultParameters: defaultWeldParams,

  isSimulating: false,
  simProgress: 0,
  simCurrentSeamIndex: 0,
  simPhase: 'idle',
  playbackSpeed: 1,

  setPart: (part) => set({ part }),
  setPartLoading: (loading) => set({ partLoading: loading }),
  // When switching models, atomically clear old seams so they never stack up or float in space!
  setActiveModelName: (name) => set({ activeModelName: name, seams: [], selectedSeamId: null }),
  setMode: (mode) => set({ mode, manualStartPoint: null, manualCandidatePoint: null }),
  toggleWireframe: () => set((s) => ({ showWireframe: !s.showWireframe })),
  toggleNormals: () => set((s) => ({ showNormals: !s.showNormals })),
  toggleBoundingBox: () => set((s) => ({ showBoundingBox: !s.showBoundingBox })),
  toggleWaypoints: () => set((s) => ({ showWaypoints: !s.showWaypoints })),
  setViewPreset: (preset) => set({ viewPreset: preset }),
  setNozzleType: (nozzle) => set({ nozzleType: nozzle }),

  setManualStartPoint: (point, normal) => set({ manualStartPoint: point, manualStartNormal: normal }),
  setManualCandidatePoint: (point, normal) => set({ manualCandidatePoint: point, manualCandidateNormal: normal }),

  addSeam: (start, end, normal, createdVia = 'manual') => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const length = parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2));

    const seams = get().seams;
    const nextOrder = seams.length + 1;
    const id = `SEAM-${String(nextOrder).padStart(2, '0')}`;

    const newSeam: WeldSeam = {
      id,
      name: `Seam ${nextOrder} (${length} mm)`,
      sequenceOrder: nextOrder,
      startPoint: start,
      endPoint: end,
      normal,
      length,
      parameters: { ...get().defaultParameters, nozzleType: get().nozzleType },
      createdVia,
    };

    set({
      seams: [...seams, newSeam],
      selectedSeamId: id,
      manualStartPoint: null,
      manualCandidatePoint: null,
    });

    return newSeam;
  },

  removeSeam: (id) =>
    set((state) => {
      const filtered = state.seams.filter((s) => s.id !== id);
      const reindexed = filtered.map((s, idx) => ({
        ...s,
        sequenceOrder: idx + 1,
      }));
      return {
        seams: reindexed,
        selectedSeamId: state.selectedSeamId === id ? (reindexed[0]?.id ?? null) : state.selectedSeamId,
      };
    }),

  updateSeamParameters: (id, params) =>
    set((state) => ({
      seams: state.seams.map((s) => (s.id === id ? { ...s, parameters: { ...s.parameters, ...params } } : s)),
    })),

  selectSeam: (id) => set({ selectedSeamId: id }),

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

  clearSeams: () => set({ seams: [], selectedSeamId: null }),

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

  startSimulation: () => set({ isSimulating: true, mode: 'simulate' }),
  pauseSimulation: () => set({ isSimulating: false }),
  resetSimulation: () =>
    set({
      isSimulating: false,
      simProgress: 0,
      simCurrentSeamIndex: 0,
      simPhase: 'idle',
    }),
  setSimProgress: (progress) => set({ simProgress: progress }),
  setSimPhase: (phase) => set({ simPhase: phase }),
  setSimCurrentSeamIndex: (index) => set({ simCurrentSeamIndex: index }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  exportJobJSON: () => {
    const s = get();
    const seams = s.seams;

    let totalLength = 0;
    let totalWeldTime = 0;
    let totalCooling = 0;

    const exportedSeams: WeldSeamExport[] = seams.map((seam) => {
      totalLength += seam.length;
      const activeTime = seam.length / seam.parameters.travelSpeed;
      totalWeldTime += activeTime;
      totalCooling += seam.parameters.interpassDelay;

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
      const approachPoint: [number, number, number] = [
        parseFloat((seam.startPoint.x + seam.normal.x * appDist).toFixed(3)),
        parseFloat((seam.startPoint.y + seam.normal.y * appDist).toFixed(3)),
        parseFloat((seam.startPoint.z + seam.normal.z * appDist).toFixed(3)),
      ];
      const retractPoint: [number, number, number] = [
        parseFloat((seam.endPoint.x + seam.normal.x * retDist).toFixed(3)),
        parseFloat((seam.endPoint.y + seam.normal.y * retDist).toFixed(3)),
        parseFloat((seam.endPoint.z + seam.normal.z * retDist).toFixed(3)),
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
        },
        waypoints,
      };
    });

    let totalTraverseDist = 0;
    for (let i = 0; i < exportedSeams.length - 1; i++) {
      const p1 = exportedSeams[i].retract_point;
      const p2 = exportedSeams[i + 1].approach_point;
      const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2) + Math.pow(p2[2] - p1[2], 2));
      totalTraverseDist += dist;
    }
    const totalTraverseTime = s.rapidTraverseSpeed > 0 ? totalTraverseDist / s.rapidTraverseSpeed : 0;
    const totalCycleTime = totalWeldTime + totalTraverseTime + totalCooling;

    const jobExport: WeldJobExport = {
      schema_version: '1.2.0',
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
      },
      robot_controller_profile: {
        kinematics: 'Armatrix-Continuum-Snake-Arm',
        reach_envelope_max_mm: 3500,
        rapid_traverse_speed_mm_s: s.rapidTraverseSpeed,
        safe_plane_z_clearance_mm: s.safePlaneZClearance,
        tool_effector: {
          model: 'Armatrix-Modular-Torch-MK3',
          nozzle_configuration: s.nozzleType === 'narrow' ? 'Narrow-Bottleneck-Deep-Access' : s.nozzleType === 'laser' ? 'Laser-Optic-Coaxial' : 'Standard-Conical-MIG',
        },
      },
      job_summary: {
        total_seams: seams.length,
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
