export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type WeldProcess = 'MIG' | 'TIG' | 'LASER';

export type WeldJointType = 'FILLET' | 'BUTT' | 'LAP' | 'CORNER' | 'EDGE';

export type TorchNozzleType = 'conical' | 'narrow' | 'laser';

export interface WeldParameters {
  process: WeldProcess;
  jointType: WeldJointType;
  travelSpeed: number; // mm/s
  current: number; // Amperes (A)
  voltage: number; // Volts (V)
  wireFeedSpeed: number; // m/min
  gasFlowRate: number; // L/min
  torchLeadAngle: number; // degrees (-30 to +30)
  torchTiltAngle: number; // degrees (-45 to +45)
  approachDistance: number; // mm (safe approach height)
  retractDistance: number; // mm (safe retract height)
  interpassDelay: number; // seconds (cooling delay before next seam)
  wireDiameter?: number; // mm (0.8, 1.0, 1.2, 1.6)
  nozzleType?: TorchNozzleType;
}

export interface WeldSeam {
  id: string;
  name: string;
  sequenceOrder: number;
  startPoint: Vector3D;
  endPoint: Vector3D;
  normal: Vector3D; // Surface normal unit vector pointing outward
  length: number; // mm
  parameters: WeldParameters;
  createdVia: 'manual' | 'detected';
}

export interface PartMetadata {
  name: string;
  triangleCount: number;
  vertexCount: number;
  dimensions: {
    width: number; // X size (mm)
    height: number; // Y size (mm)
    depth: number; // Z size (mm)
  };
  boundingBox: {
    min: Vector3D;
    max: Vector3D;
  };
}

export interface WeldSeamExport {
  seam_id: string;
  name: string;
  sequence_order: number;
  process: WeldProcess;
  joint_type: WeldJointType;
  length_mm: number;
  start_coordinate: [number, number, number];
  end_coordinate: [number, number, number];
  surface_normal: [number, number, number];
  approach_point: [number, number, number];
  retract_point: [number, number, number];
  torch_orientation: {
    lead_angle_deg: number;
    tilt_angle_deg: number;
    nozzle_type: string;
  };
  weld_parameters: {
    travel_speed_mm_s: number;
    current_amps: number;
    voltage_volts: number;
    wire_feed_m_min: number;
    shielding_gas_l_min: number;
    interpass_delay_sec: number;
    wire_diameter_mm?: number;
  };
  waypoints: Array<[number, number, number]>;
}

export interface WeldJobExport {
  schema_version: '1.2.0';
  generator: 'Armatrix Autonomous Seam Planner v1.0';
  job_id: string;
  created_at: string;
  part: {
    filename: string;
    units: 'mm';
    bounding_dimensions_mm: {
      x: number;
      y: number;
      z: number;
    };
  };
  robot_controller_profile: {
    kinematics: 'Armatrix-Continuum-Snake-Arm';
    reach_envelope_max_mm: number;
    rapid_traverse_speed_mm_s: number;
    safe_plane_z_clearance_mm: number;
    tool_effector: {
      model: 'Armatrix-Modular-Torch-MK3';
      nozzle_configuration: string;
    };
  };
  job_summary: {
    total_seams: number;
    total_weld_length_mm: number;
    estimated_active_weld_time_sec: number;
    estimated_traverse_time_sec: number;
    estimated_cooling_delays_sec: number;
    total_cycle_time_sec: number;
  };
  seams: WeldSeamExport[];
}

export type ViewportMode = 'orbit' | 'add_seam' | 'inspect' | 'simulate';
