const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'images', 'logo', 'armatrix-horizontal-full-color.svg'), 'utf8');

// The first path inside <g> is the logo symbol
const pathMatch = svgContent.match(/<path style="fill:#627F47;" d="([^"]+)"><\/path>/);

if (!pathMatch) {
  console.error('Could not find logo path');
  process.exit(1);
}

const logoD = pathMatch[1];

// Create standalone Armatrix symbol SVG
// Bounding box for this path: minX: 235, maxX: 585 (width ~350), minY: 147, maxY: 375 (height ~228)
const symbolSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="235 145 352 232" fill="currentColor">
  <path d="${logoD}" />
</svg>`;

const outDir = path.join(__dirname, '..', 'public', 'images', 'logo');
fs.writeFileSync(path.join(outDir, 'armatrix-symbol.svg'), symbolSvg, 'utf8');
console.log('Successfully created public/images/logo/armatrix-symbol.svg');
