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
  const result = exporter.parse(object3d, { binary: false });
  fs.writeFileSync(path.join(outDir, filename), result, 'utf8');
  console.log(`Exported solid ${filename}`);
}

// 1. Solid Structural L-Bracket with Stiffener Ribs & Base
function createLBracket() {
  const group = new THREE.Group();

  // Base Plate (120 x 14 x 90)
  const baseGeom = new THREE.BoxGeometry(120, 14, 90);
  baseGeom.translate(0, 7, 5); // Z from -40 to +50
  group.add(new THREE.Mesh(baseGeom));

  // Upright Vertical Plate (120 x 85 x 14)
  const uprightGeom = new THREE.BoxGeometry(120, 85, 14);
  uprightGeom.translate(0, 14 + 85 / 2, -33); // Z from -40 to -26, front face at Z = -26
  group.add(new THREE.Mesh(uprightGeom));

  // Gusset 1 (Left stiffener triangle sitting inside the 90° corner)
  const s1 = new THREE.Shape();
  s1.moveTo(0, 0);
  s1.lineTo(0, 60); // 60mm up vertical plate
  s1.lineTo(55, 0); // 55mm forward along base plate
  s1.closePath();
  const g1Geom = new THREE.ExtrudeGeometry(s1, { depth: 10, bevelEnabled: false });
  g1Geom.rotateY(-Math.PI / 2); // Rotate so hypotenuse faces forward onto base plate
  g1Geom.translate(-30, 14, -26); // X from -40 to -30, Z from -26 to +29
  group.add(new THREE.Mesh(g1Geom));

  // Gusset 2 (Right stiffener triangle)
  const g2Geom = g1Geom.clone();
  g2Geom.translate(70, 0, 0); // X from +30 to +40
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

  const baseGeom = new THREE.BoxGeometry(130, 12, 90);
  baseGeom.translate(0, 6, 0);
  group.add(new THREE.Mesh(baseGeom));

  const chamberGeom = new THREE.BoxGeometry(80, 50, 60);
  chamberGeom.translate(0, 12 + 25, 0);
  group.add(new THREE.Mesh(chamberGeom));

  const topGeom = new THREE.BoxGeometry(100, 10, 80);
  topGeom.translate(0, 12 + 50 + 5, 0);
  group.add(new THREE.Mesh(topGeom));

  const rib1 = new THREE.BoxGeometry(8, 45, 16);
  rib1.translate(-44, 12 + 22.5, 0);
  group.add(new THREE.Mesh(rib1));

  const rib2 = rib1.clone();
  rib2.translate(88, 0, 0);
  group.add(new THREE.Mesh(rib2));

  return group;
}

// 4. Armatrix Emblem Brand Plate (Machined mounting plaque with 3 welded snake-joint fingers)
function createArmatrixEmblem() {
  const group = new THREE.Group();

  // Base Machined Plaque (140 x 10 x 95)
  const plaqueGeom = new THREE.BoxGeometry(140, 10, 95);
  plaqueGeom.translate(0, 5, 0);
  group.add(new THREE.Mesh(plaqueGeom));

  // Outer border rim
  const rimFront = new THREE.BoxGeometry(140, 6, 6);
  rimFront.translate(0, 10 + 3, 44.5);
  group.add(new THREE.Mesh(rimFront));

  const rimBack = rimFront.clone();
  rimBack.translate(0, 0, -89);
  group.add(new THREE.Mesh(rimBack));

  // Three Curved Snake-Arm Links of the Armatrix Emblem
  // Link 1 (Left snake link)
  const link1Shape = new THREE.Shape();
  link1Shape.moveTo(-35, -25);
  link1Shape.lineTo(-20, -25);
  link1Shape.lineTo(-20, 15);
  link1Shape.absarc(-27.5, 15, 7.5, 0, Math.PI, false);
  link1Shape.lineTo(-35, -25);
  const link1Geom = new THREE.ExtrudeGeometry(link1Shape, { depth: 12, bevelEnabled: false });
  link1Geom.rotateX(Math.PI / 2);
  link1Geom.translate(0, 10 + 6, 0);
  group.add(new THREE.Mesh(link1Geom));

  // Link 2 (Center snake link)
  const link2Shape = new THREE.Shape();
  link2Shape.moveTo(-7.5, -25);
  link2Shape.lineTo(7.5, -25);
  link2Shape.lineTo(7.5, 20);
  link2Shape.absarc(0, 20, 7.5, 0, Math.PI, false);
  link2Shape.lineTo(-7.5, -25);
  const link2Geom = new THREE.ExtrudeGeometry(link2Shape, { depth: 12, bevelEnabled: false });
  link2Geom.rotateX(Math.PI / 2);
  link2Geom.translate(0, 10 + 6, 0);
  group.add(new THREE.Mesh(link2Geom));

  // Link 3 (Right snake link)
  const link3Shape = new THREE.Shape();
  link3Shape.moveTo(20, -25);
  link3Shape.lineTo(35, -25);
  link3Shape.lineTo(35, 15);
  link3Shape.absarc(27.5, 15, 7.5, 0, Math.PI, false);
  link3Shape.lineTo(20, -25);
  const link3Geom = new THREE.ExtrudeGeometry(link3Shape, { depth: 12, bevelEnabled: false });
  link3Geom.rotateX(Math.PI / 2);
  link3Geom.translate(0, 10 + 6, 0);
  group.add(new THREE.Mesh(link3Geom));

  return group;
}

exportMesh(createLBracket(), 'bracket.stl');
exportMesh(createPipeJoint(), 'pipe_joint.stl');
exportMesh(createBoxFlange(), 'box_flange.stl');
exportMesh(createArmatrixEmblem(), 'armatrix_emblem.stl');

console.log('All 4 solid CAD models exported cleanly!');
