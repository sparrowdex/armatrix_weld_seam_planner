"""
Generates the robustness test set in test-stls/: awkward STL files for testing the planner's upload path
(ASCII and binary, open meshes, tiny and huge parts, wrong units, Z-up exports, curved and dense meshes,
and files that are not valid STLs at all). Standard library only.

    python scripts/generate_test_stls.py            # writes to ./test-stls
    python scripts/generate_test_stls.py some/dir
"""
import math, os, struct, sys

out = sys.argv[1] if len(sys.argv) > 1 else 'test-stls'
os.makedirs(out, exist_ok=True)

def normal(a, b, c):
    u = [b[i] - a[i] for i in range(3)]
    v = [c[i] - a[i] for i in range(3)]
    n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
    l = math.sqrt(sum(x*x for x in n)) or 1
    return [x / l for x in n]

def box(x0, y0, z0, x1, y1, z1, skip_top=False):
    p = [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
    quads = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(2,3,7,6),(1,2,6,5),(3,0,4,7)]  # bottom(z0), top(z1), sides
    tris = []
    for qi, q in enumerate(quads):
        if skip_top and qi == 3:  # the +Y face is the lid (the planner is Y-up)
            continue
        a, b, c, d = (p[i] for i in q)
        tris += [(a, b, c), (a, c, d)]
    return tris

def write_ascii(name, tris):
    with open(os.path.join(out, name), 'w') as f:
        f.write('solid test\n')
        for a, b, c in tris:
            n = normal(a, b, c)
            f.write(f'  facet normal {n[0]:.6f} {n[1]:.6f} {n[2]:.6f}\n    outer loop\n')
            for v in (a, b, c):
                f.write(f'      vertex {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n')
            f.write('    endloop\n  endfacet\n')
        f.write('endsolid test\n')

def write_binary(name, tris):
    with open(os.path.join(out, name), 'wb') as f:
        f.write(b'binary test'.ljust(80, b' '))
        f.write(struct.pack('<I', len(tris)))
        for a, b, c in tris:
            f.write(struct.pack('<3f', *normal(a, b, c)))
            for v in (a, b, c):
                f.write(struct.pack('<3f', *v))
            f.write(struct.pack('<H', 0))

def uv_sphere(r, seg=64, rings=48):
    tris = []
    for i in range(rings):
        t0, t1 = math.pi * i / rings, math.pi * (i + 1) / rings
        for j in range(seg):
            p0, p1 = 2 * math.pi * j / seg, 2 * math.pi * (j + 1) / seg
            pt = lambda t, p: (r * math.sin(t) * math.cos(p), r * math.cos(t), r * math.sin(t) * math.sin(p))
            a, b, c, d = pt(t0, p0), pt(t0, p1), pt(t1, p1), pt(t1, p0)
            if i > 0: tris.append((a, b, c))
            if i < rings - 1: tris.append((a, c, d))
    return tris

# 1. The tetrahedral "cube corner" from the STL format page (ASCII, closed)
write_ascii('01_cube_corner_ascii.stl', [
    ((0,0,0),(1,0,0),(0,0,1)), ((0,0,0),(0,1,0),(1,0,0)),
    ((0,0,0),(0,0,1),(0,1,0)), ((1,0,0),(0,1,0),(0,0,1)),
])
# 2. Binary L-bracket made of two plates (watertight shells touching)
write_binary('02_bracket_binary.stl', box(-60, 0, -45, 60, 14, 45) + box(-60, 14, -45, 60, 99, -31))
# 3. Open box: a tray with no lid (holes -> "Open mesh")
write_ascii('03_open_tray_no_lid.stl', box(-50, 0, -40, 50, 40, 40, skip_top=True))
# 4. Flat plate: nothing to auto-detect
write_ascii('04_flat_plate.stl', box(-100, 0, -60, 100, 6, 60))
# 5. Tiny part: a 4 mm cube
write_ascii('05_tiny_4mm_cube.stl', box(-2, 0, -2, 2, 4, 2))
# 6. Huge part: 5 m long beam (beyond the 3500 mm reach)
write_binary('06_huge_5m_beam.stl', box(-2500, 0, -100, 2500, 200, 100))
# 7. Same bracket exported "in metres": looks 1000x too small
write_ascii('07_bracket_in_metres.stl', [tuple(tuple(c / 1000 for c in v) for v in t) for t in box(-60, 0, -45, 60, 14, 45) + box(-60, 14, -45, 60, 99, -31)])
# 8. Z-up export: same bracket with the upright along +Z (lies on its side here)
write_binary('08_bracket_z_up.stl', [tuple((v[0], v[2], v[1]) for v in t) for t in box(-60, 0, -45, 60, 14, 45) + box(-60, 14, -45, 60, 99, -31)])
# 9. Organic: a dense sphere (no creases; ~6k triangles)
write_binary('09_sphere_curved.stl', uv_sphere(40))
# 10. Big mesh: a very dense sphere (~400k triangles) for performance
write_binary('10_dense_sphere_400k.stl', uv_sphere(60, seg=640, rings=320))
# 11. Not an STL at all
with open(os.path.join(out, '11_not_really_an_stl.stl'), 'w') as f:
    f.write('This is just a text file pretending to be an STL.\n')
# 12. Empty file
open(os.path.join(out, '12_empty.stl'), 'wb').close()

for n in sorted(os.listdir(out)):
    print(f'{n:34s} {os.path.getsize(os.path.join(out, n)):>12,d} bytes')
