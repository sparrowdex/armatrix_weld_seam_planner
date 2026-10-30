const fs = require('fs');
const path = require('path');

function createBinarySTL(triangles) {
  const buffer = Buffer.alloc(84 + triangles.length * 50);
  // Header: 80 bytes
  buffer.write('Armatrix Robotics - Industrial Benchmark STL', 0, 80, 'utf8');
  // Number of triangles: 4 bytes
  buffer.writeUInt32LE(triangles.length, 80);

  let offset = 84;
  for (const tri of triangles) {
    // Normal (float32 x 3)
    buffer.writeFloatLE(tri.normal[0], offset);
    buffer.writeFloatLE(tri.normal[1], offset + 4);
    buffer.writeFloatLE(tri.normal[2], offset + 8);
    // V1 (float32 x 3)
    buffer.writeFloatLE(tri.v1[0], offset + 12);
    buffer.writeFloatLE(tri.v1[1], offset + 16);
    buffer.writeFloatLE(tri.v1[2], offset + 20);
    // V2 (float32 x 3)
    buffer.writeFloatLE(tri.v2[0], offset + 24);
    buffer.writeFloatLE(tri.v2[1], offset + 28);
    buffer.writeFloatLE(tri.v2[2], offset + 32);
    // V3 (float32 x 3)
    buffer.writeFloatLE(tri.v3[0], offset + 36);
    buffer.writeFloatLE(tri.v3[1], offset + 40);
    buffer.writeFloatLE(tri.v3[4] || tri.v3[2], offset + 44);
    // Attribute byte count (uint16)
    buffer.writeUInt16LE(0, offset + 48);
    offset += 50;
  }
  return buffer;
}

// Generate Structural L-Bracket
function generateLBracket() {
  const triangles = [];
  function addQuad(v1, v2, v3, v4, normal) {
    triangles.push({ normal, v1, v2, v3 });
    triangles.push({ normal, v1, v2: v3, v3: v4 });
  }

  // Base Plate: 100 wide (X: -50 to 50), 60 deep (Z: -30 to 30), 12 thick (Y: 0 to 12)
  // Upright Plate: 100 wide (X: -50 to 50), 12 thick (Z: -30 to -18), 70 tall (Y: 12 to 82)
  // Base bottom
  addQuad([-50, 0, -30], [50, 0, -30], [50, 0, 30], [-50, 0, 30], [0, -1, 0]);
  // Base front
  addQuad([-50, 0, 30], [50, 0, 30], [50, 12, 30], [-50, 12, 30], [0, 0, 1]);
  // Base sides
  addQuad([50, 0, -30], [50, 12, -30], [50, 12, 30], [50, 0, 30], [1, 0, 0]);
  addQuad([-50, 0, 30], [-50, 12, 30], [-50, 12, -30], [-50, 0, -30], [-1, 0, 0]);
  // Base top step (forward part where weld seam meets the upright)
  addQuad([-50, 12, -18], [50, 12, -18], [50, 12, 30], [-50, 12, 30], [0, 1, 0]);

  // Upright back
  addQuad([-50, 0, -30], [-50, 82, -30], [50, 82, -30], [50, 0, -30], [0, 0, -1]);
  // Upright top
  addQuad([-50, 82, -30], [-50, 82, -18], [50, 82, -18], [50, 82, -30], [0, 1, 0]);
  // Upright sides
  addQuad([50, 12, -30], [50, 82, -30], [50, 82, -18], [50, 12, -18], [1, 0, 0]);
  addQuad([-50, 12, -18], [-50, 82, -18], [-50, 82, -30], [-50, 12, -30], [-1, 0, 0]);
  // Upright front face (The key 90 degree corner weld joint with base top!)
  addQuad([-50, 12, -18], [-50, 82, -18], [50, 82, -18], [50, 12, -18], [0, 0, 1]);

  // Stiffener gusset triangle in the center (X: -6 to 6, Y: 12 to 70, Z: -18 to 20)
  // Gusset sides
  triangles.push({ normal: [1, 0, 0], v1: [6, 12, -18], v2: [6, 70, -18], v3: [6, 12, 20] });
  triangles.push({ normal: [-1, 0, 0], v1: [-6, 12, -18], v2: [-6, 12, 20], v3: [-6, 70, -18] });
  // Gusset hypotenuse slope
  addQuad([-6, 12, 20], [6, 12, 20], [6, 70, -18], [-6, 70, -18], [0, 0.5, 0.86]);

  return createBinarySTL(triangles);
}

// Generate Pipe T-Joint
function generatePipeJoint() {
  const triangles = [];
  const segments = 24;
  const mainRadius = 25;
  const mainLength = 120;
  const branchRadius = 18;
  const branchHeight = 60;

  // Main Cylinder (aligned with X axis: -60 to 60)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const y1 = Math.cos(a1) * mainRadius;
    const z1 = Math.sin(a1) * mainRadius;
    const y2 = Math.cos(a2) * mainRadius;
    const z2 = Math.sin(a2) * mainRadius;

    // Body
    triangles.push({
      normal: [0, y1 / mainRadius, z1 / mainRadius],
      v1: [-mainLength / 2, y1, z1],
      v2: [mainLength / 2, y1, z1],
      v3: [mainLength / 2, y2, z2],
    });
    triangles.push({
      normal: [0, y1 / mainRadius, z1 / mainRadius],
      v1: [-mainLength / 2, y1, z1],
      v2: [mainLength / 2, y2, z2],
      v3: [-mainLength / 2, y2, z2],
    });

    // Caps
    triangles.push({ normal: [-1, 0, 0], v1: [-mainLength / 2, 0, 0], v2: [-mainLength / 2, y2, z2], v3: [-mainLength / 2, y1, z1] });
    triangles.push({ normal: [1, 0, 0], v1: [mainLength / 2, 0, 0], v2: [mainLength / 2, y1, z1], v3: [mainLength / 2, y2, z2] });
  }

  // Branch Cylinder (standing vertically on Y axis from main pipe surface to +branchHeight)
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(a1) * branchRadius;
    const z1 = Math.sin(a1) * branchRadius;
    const x2 = Math.cos(a2) * branchRadius;
    const z2 = Math.sin(a2) * branchRadius;

    // Base of branch intersects main cylinder at approx y = sqrt(R^2 - z^2)
    const yBase1 = Math.sqrt(Math.max(0, mainRadius * mainRadius - z1 * z1));
    const yBase2 = Math.sqrt(Math.max(0, mainRadius * mainRadius - z2 * z2));
    const yTop = mainRadius + branchHeight;

    triangles.push({
      normal: [x1 / branchRadius, 0, z1 / branchRadius],
      v1: [x1, yBase1, z1],
      v2: [x2, yBase2, z2],
      v3: [x2, yTop, z2],
    });
    triangles.push({
      normal: [x1 / branchRadius, 0, z1 / branchRadius],
      v1: [x1, yBase1, z1],
      v2: [x2, yTop, z2],
      v3: [x1, yTop, z1],
    });

    // Top cap
    triangles.push({ normal: [0, 1, 0], v1: [0, yTop, 0], v2: [x1, yTop, z1], v3: [x2, yTop, z2] });
  }

  return createBinarySTL(triangles);
}

// Generate Box Enclosure
function generateBoxEnclosure() {
  const triangles = [];
  function addQuad(v1, v2, v3, v4, normal) {
    triangles.push({ normal, v1, v2, v3 });
    triangles.push({ normal, v1, v2: v3, v3: v4 });
  }

  // Base plate 120 x 80 x 10
  addQuad([-60, 0, -40], [60, 0, -40], [60, 0, 40], [-60, 0, 40], [0, -1, 0]);
  addQuad([-60, 0, 40], [60, 0, 40], [60, 10, 40], [-60, 10, 40], [0, 0, 1]);
  addQuad([-60, 10, -40], [60, 10, -40], [60, 0, -40], [-60, 0, -40], [0, 0, -1]);
  addQuad([60, 0, -40], [60, 10, -40], [60, 10, 40], [60, 0, 40], [1, 0, 0]);
  addQuad([-60, 0, 40], [-60, 10, 40], [-60, 10, -40], [-60, 0, -40], [-1, 0, 0]);
  addQuad([-60, 10, -40], [-60, 10, 40], [60, 10, 40], [60, 10, -40], [0, 1, 0]);

  // Welded Box Collar (80 x 50 x 40 tall from Y: 10 to 50)
  // Outer walls
  addQuad([-40, 10, 25], [40, 10, 25], [40, 50, 25], [-40, 50, 25], [0, 0, 1]);
  addQuad([40, 10, -25], [-40, 10, -25], [-40, 50, -25], [40, 50, -25], [0, 0, -1]);
  addQuad([40, 10, 25], [40, 10, -25], [40, 50, -25], [40, 50, 25], [1, 0, 0]);
  addQuad([-40, 10, -25], [-40, 10, 25], [-40, 50, 25], [-40, 50, -25], [-1, 0, 0]);
  // Top rim
  addQuad([-40, 50, -25], [40, 50, -25], [40, 50, 25], [-40, 50, 25], [0, 1, 0]);

  return createBinarySTL(triangles);
}

const outDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'bracket.stl'), generateLBracket());
fs.writeFileSync(path.join(outDir, 'pipe_joint.stl'), generatePipeJoint());
fs.writeFileSync(path.join(outDir, 'box_flange.stl'), generateBoxEnclosure());

console.log('Sample STLs generated successfully in public/models!');
