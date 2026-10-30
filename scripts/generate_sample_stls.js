const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { STLExporter } = require('three-stdlib');

const exporter = new STLExporter();
const outDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function exportMesh(object3d, filename) {
  // Exporting as ASCII STL guarantees clean, uncorrupted vertex data
  const result = exporter.parse(object3d, { binary: false });
  fs.writeFileSync(path.join(outDir, filename), result, 'utf8');
  console.log(`Exported solid ${filename}`);
}

// 1. Solid Structural L-Bracket with Gussets & Base
function createLBracket() {
  const group = new THREE.Group();

  // Base Plate (120 x 14 x 80)
  const baseGeom = new THREE.BoxGeometry(120, 14, 80);
  baseGeom.translate(0, 7, 0);
  group.add(new THREE.Mesh(baseGeom));

  // Upright Plate (120 x 85 x 14)
  const uprightGeom = new THREE.BoxGeometry(120, 85, 14);
  uprightGeom.translate(0, 14 + 85 / 2, -40 + 7);
  group.add(new THREE.Mesh(uprightGeom));

  // Gusset 1 (Left triangle)
  const s1 = new THREE.Shape();
  s1.moveTo(0, 0);
  s1.lineTo(0, 65);
  s1.lineTo(55, 0);
  s1.closePath();
  const g1Geom = new THREE.ExtrudeGeometry(s1, { depth: 10, bevelEnabled: false });
  g1Geom.rotateY(Math.PI / 2);
  g1Geom.translate(-40, 14, -33);
  group.add(new THREE.Mesh(g1Geom));

  // Gusset 2 (Right triangle)
  const g2Geom = g1Geom.clone();
  g2Geom.translate(70, 0, 0);
  group.add(new THREE.Mesh(g2Geom));

  return group;
}

// 2. Industrial Pipe T-Joint with Flanges
function createPipeJoint() {
  const group = new THREE.Group();

  // Main Cylinder (Diameter 50mm, Length 140mm)
  const mainPipeGeom = new THREE.CylinderGeometry(25, 25, 140, 24);
  mainPipeGeom.rotateZ(Math.PI / 2);
  mainPipeGeom.translate(0, 25, 0);
  group.add(new THREE.Mesh(mainPipeGeom));

  // Flange Left
  const flGeom = new THREE.CylinderGeometry(36, 36, 12, 24);
  flGeom.rotateZ(Math.PI / 2);
  flGeom.translate(-70, 25, 0);
  group.add(new THREE.Mesh(flGeom));

  // Flange Right
  const frGeom = flGeom.clone();
  frGeom.translate(140, 0, 0);
  group.add(new THREE.Mesh(frGeom));

  // Branch Cylinder
  const branchGeom = new THREE.CylinderGeometry(18, 18, 65, 24);
  branchGeom.translate(0, 25 + 65 / 2, 0);
  group.add(new THREE.Mesh(branchGeom));

  // Branch Top Flange
  const topFlangeGeom = new THREE.CylinderGeometry(28, 28, 10, 24);
  topFlangeGeom.translate(0, 25 + 65, 0);
  group.add(new THREE.Mesh(topFlangeGeom));

  return group;
}

// 3. Welded Box Frame / Chamber
function createBoxFlange() {
  const group = new THREE.Group();

  // Bottom Base Plate
  const baseGeom = new THREE.BoxGeometry(130, 12, 90);
  baseGeom.translate(0, 6, 0);
  group.add(new THREE.Mesh(baseGeom));

  // Center Welded Box
  const chamberGeom = new THREE.BoxGeometry(80, 50, 60);
  chamberGeom.translate(0, 12 + 25, 0);
  group.add(new THREE.Mesh(chamberGeom));

  // Top Collar Flange
  const topGeom = new THREE.BoxGeometry(100, 10, 80);
  topGeom.translate(0, 12 + 50 + 5, 0);
  group.add(new THREE.Mesh(topGeom));

  // Gusset Ribs
  const rib1 = new THREE.BoxGeometry(8, 45, 16);
  rib1.translate(-44, 12 + 22.5, 0);
  group.add(new THREE.Mesh(rib1));

  const rib2 = rib1.clone();
  rib2.translate(88, 0, 0);
  group.add(new THREE.Mesh(rib2));

  return group;
}

exportMesh(createLBracket(), 'bracket.stl');
exportMesh(createPipeJoint(), 'pipe_joint.stl');
exportMesh(createBoxFlange(), 'box_flange.stl');

console.log('All 3 solid CAD models exported cleanly!');
