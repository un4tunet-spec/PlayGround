import * as THREE from 'three';

// Teardown step definitions (order matters) — 25 assemblies, 168 fasteners.
// Front-to-back strip of a high-bypass turbofan, externals before cases,
// cases before rotors, cold section before hot section.
export const STEPS = [
  { id: 'noseLip',  name: 'Nose Cowl Lip',      tool: 'screwdriver', bolts: 8,  hint: 'Inlet lip + anti-ice screws',            extract: [-2.4, 1.6, 0] },
  { id: 'cowlTop',  name: 'Fan Cowl — Top',     tool: 'wrench',      bolts: 8,  hint: 'Upper cowl door — unbolt it first',      extract: [0, 2.6, 0.4] },
  { id: 'cowlBot',  name: 'Fan Cowl — Bottom',  tool: 'wrench',      bolts: 8,  hint: 'Lower cowl door + drain mast',            extract: [0, -2.0, 1.4] },
  { id: 'spinner',  name: 'Spinner Cone',       tool: 'screwdriver', bolts: 4,  hint: 'Nose spinner flank studs',               extract: [-2.8, 1.0, 0] },
  { id: 'fanBlades',name: 'Fan Blade Set',      tool: 'puller',      bolts: 6,  hint: '22 wide-chord blades — puller',          extract: [-1.8, 1.8, 0] },
  { id: 'fanDisc',  name: 'Fan Disc + Nut',     tool: 'puller',      bolts: 6,  hint: 'Hub disc + shaft nut',                   extract: [-2.0, 1.4, 0] },
  { id: 'ogv',      name: 'Outlet Guide Vanes', tool: 'screwdriver', bolts: 8,  hint: 'Structural stator vanes',                extract: [-0.8, 2.4, 0] },
  { id: 'fanCase',  name: 'Fan Case + Frame',   tool: 'wrench',      bolts: 8,  hint: 'Containment case + frame struts',        extract: [0, 2.6, -0.4] },
  { id: 'lpc',      name: 'LPC Booster',        tool: 'wrench',      bolts: 6,  hint: 'Low-pressure compressor, 3 stages',      extract: [-0.4, 2.4, 0] },
  { id: 'gearbox',  name: 'Accessory Gearbox',  tool: 'wrench',      bolts: 8,  hint: 'Gearbox, pumps + oil tank',              extract: [0.2, -2.2, 0.8] },
  { id: 'hpcCase',  name: 'HPC Split Casing',   tool: 'wrench',      bolts: 10, hint: 'Split casing + bleed valves',            extract: [0.5, 2.2, 0] },
  { id: 'hpcRotor', name: 'HPC Rotor',          tool: 'wrench',      bolts: 8,  hint: 'Five blisk stages + flange',             extract: [0.3, 2.4, 0] },
  { id: 'eec',      name: 'EEC + Harness',      tool: 'screwdriver', bolts: 6,  hint: 'Control box + wiring loom',              extract: [0.8, -2.0, 0.6] },
  { id: 'igniters', name: 'Ignition Exciters',  tool: 'screwdriver', bolts: 4,  hint: 'Two exciter boxes on the case',          extract: [1.0, 1.8, 0.6] },
  { id: 'combCase', name: 'Combustor Case',     tool: 'wrench',      bolts: 8,  hint: 'Pressure casing + flanges',              extract: [0.6, 2.2, 0] },
  { id: 'fuel',     name: 'Fuel Manifold',      tool: 'wrench',      bolts: 8,  hint: 'Manifold ring + 8 nozzles',              extract: [0.5, -2.2, -0.6] },
  { id: 'burners',  name: 'Burner Cans',        tool: 'screwdriver', bolts: 10, hint: 'Eight flame tubes + liner',              extract: [0, 2.0, 0.6] },
  { id: 'hptNrv',   name: 'HPT Nozzle Vanes',   tool: 'puller',      bolts: 4,  hint: 'Stage-1 nozzle ring',                    extract: [1.6, 1.8, 0] },
  { id: 'hptRotor', name: 'HPT Rotor',          tool: 'puller',      bolts: 6,  hint: 'Turbine disc + 30 blades',               extract: [1.8, 1.6, 0] },
  { id: 'lptNrv',   name: 'LPT Nozzle Vanes',   tool: 'puller',      bolts: 4,  hint: 'Downstream nozzle ring',                 extract: [2.0, 1.4, 0] },
  { id: 'lptRotor', name: 'LPT Rotor',          tool: 'puller',      bolts: 6,  hint: 'Big disc + 36 blades',                   extract: [2.2, 1.2, 0] },
  { id: 'tec',      name: 'Exhaust Case (TEC)', tool: 'wrench',      bolts: 8,  hint: 'Turbine exhaust strut case',             extract: [2.6, 1.0, 0] },
  { id: 'mixer',    name: 'Exhaust Mixer',      tool: 'wrench',      bolts: 6,  hint: 'Lobed bypass mixer',                     extract: [2.8, 0.8, 0] },
  { id: 'plug',     name: 'Exhaust Plug',       tool: 'screwdriver', bolts: 4,  hint: 'Tail plug on 4 struts',                  extract: [3.0, 0.8, 0] },
  { id: 'nozzle',   name: 'Exhaust Nozzle',     tool: 'wrench',      bolts: 6,  hint: 'Petal nozzle + actuators',               extract: [2.8, 1.0, 0] },
];

export const TOOLS = {
  wrench:      { name: 'Wrench',      icon: '🔧', color: 0x38e1ff },
  screwdriver: { name: 'Screwdriver', icon: '🪛', color: 0xffcf5c },
  puller:      { name: 'Puller',      icon: '🦾', color: 0xc792ff },
};

function metal(color, rough = 0.35, met = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: met });
}

// Bolt entry: [x, y, z] (upright stud) or [x, y, z, nx, ny, nz] (aligned to
// surface normal so the head sits proud of the skin and stays clickable).
function boltMesh(color = 0xffcf5c, normal = null) {
  const g = new THREE.CylinderGeometry(0.07, 0.07, 0.09, 6);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: 0.3, metalness: 0.9,
    emissive: new THREE.Color(color), emissiveIntensity: 0.55
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.userData.isBolt = true;
  if (normal) {
    const n = new THREE.Vector3(normal[0], normal[1], normal[2]).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  }
  return mesh;
}

export function buildEngine(scene) {
  const engine = new THREE.Group();
  engine.name = 'engine';
  scene.add(engine);

  const parts = [];
  const pickables = [];
  const bolts = [];

  const matCowling = metal(0x3f6ea5, 0.4, 0.7);
  const matDark    = metal(0x2a3342, 0.5, 0.8);
  const matSteel   = metal(0xb9c4d4, 0.28, 0.95);
  const matTitan   = metal(0x8d99ae, 0.32, 0.95);
  const matCopper  = metal(0xc97b3d, 0.4, 0.9);
  const matBurn    = metal(0x6b5a4e, 0.55, 0.8);
  const matBlade   = metal(0xd7dee9, 0.22, 1.0);
  const matAccent  = new THREE.MeshStandardMaterial({ color: 0x173a5e, roughness: 0.5, metalness: 0.6 });

  // Core shafts (never removed — win backdrop): N1 + N2 spools
  const shaftGroup = new THREE.Group();
  const n1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6.6, 16), matSteel);
  n1.rotation.z = Math.PI / 2;
  const n2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 4.6, 16), matCopper);
  n2.rotation.z = Math.PI / 2;
  shaftGroup.add(n1, n2);
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 10, 24), i % 2 ? matSteel : matCopper);
    ring.position.x = -2.2 + i * 0.9;
    ring.rotation.y = Math.PI / 2;
    shaftGroup.add(ring);
  }
  // bearing housings (static)
  [-1.7, 0.2, 1.9].forEach((x) => {
    const brg = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.3, 16), matDark);
    brg.rotation.z = Math.PI / 2; brg.position.x = x;
    shaftGroup.add(brg);
  });
  engine.add(shaftGroup);
  engine.userData.shaft = shaftGroup;

  // Stand
  const standMat = metal(0x232f45, 0.6, 0.6);
  const base = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.25, 3.4), standMat);
  base.position.y = -2.15;
  const legA = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.3), standMat);
  legA.position.set(-1.6, -1.3, 0);
  const legB = legA.clone(); legB.position.x = 1.6;
  const cradle = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.12, 10, 40, Math.PI), standMat);
  cradle.position.set(0, -0.9, 0);
  engine.add(base, legA, legB, cradle);

  function registerPart(stepIndex, group, boltPositions) {
    const step = STEPS[stepIndex];
    group.userData.partId = step.id;
    group.userData.stepIndex = stepIndex;
    const boltMeshes = [];
    boltPositions.forEach((p) => {
      const b = boltMesh(step.tool === 'wrench' ? 0x38e1ff : step.tool === 'screwdriver' ? 0xffcf5c : 0xc792ff, p.length > 3 ? [p[3], p[4], p[5]] : null);
      b.position.set(p[0], p[1], p[2]);
      b.userData.partId = step.id;
      b.userData.stepIndex = stepIndex;
      b.userData.isBolt = true;
      group.add(b);
      boltMeshes.push(b);
      bolts.push(b);
      pickables.push(b);
    });
    group.traverse((o) => { if (o.isMesh && !o.userData.isBolt) { o.userData.partId = step.id; o.userData.stepIndex = stepIndex; pickables.push(o); } });
    engine.add(group);
    parts.push({ step, group, boltMeshes, removed: false, loose: false, boltsLeft: boltMeshes.length, basePos: group.position.clone() });
  }

  // helper: ring of bolts on an X-axis cylinder surface
  function ringBolts(x, r, angles, normal = 'radial') {
    return angles.map((deg) => {
      const a = deg * Math.PI / 180;
      const y = r * Math.cos(a), z = r * Math.sin(a);
      return normal === 'radial' ? [x, y, z, 0, Math.cos(a), Math.sin(a)] : [x, y, z];
    });
  }
  // helper: bolts on a flat face perpendicular to X
  function faceBolts(x, r, angles, facing /* -1 front, +1 rear */) {
    return angles.map((deg) => {
      const a = deg * Math.PI / 180;
      return [x, r * Math.cos(a), r * Math.sin(a), facing, 0, 0];
    });
  }

  // 0 — Nose cowl lip: lip torus + piccolo + acoustic liner
  {
    const g = new THREE.Group();
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.18, 14, 36), matSteel);
    lip.rotation.y = Math.PI / 2; lip.position.x = -2.5;
    const piccolo = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 8, 30), matCopper);
    piccolo.rotation.y = Math.PI / 2; piccolo.position.x = -2.42;
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.3, 28, 1, true), matAccent);
    liner.rotation.z = Math.PI / 2; liner.position.x = -2.05;
    liner.material = matAccent.clone(); liner.material.side = THREE.DoubleSide;
    // liner perforation bands
    [-2.12, -1.98].forEach((x) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.025, 6, 30), matDark);
      band.rotation.y = Math.PI / 2; band.position.x = x;
      g.add(band);
    });
    g.add(lip, piccolo, liner);
    const front = [45, 135, 225, 315].map((deg) => {
      const a = deg * Math.PI / 180;
      return [-2.68, 1.15 * Math.cos(a), 1.15 * Math.sin(a), -1, 0, 0];
    });
    registerPart(0, g, [...front,
      [-2.5, 1.33, 0, 0, 1, 0], [-2.5, -1.33, 0, 0, -1, 0],
      [-2.5, 0, 1.33, 0, 0, 1], [-2.5, 0, -1.33, 0, 0, -1]]);
  }

  // 1 — Fan cowl top: shell + stripes + latch rail + hinge beam
  {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 3.4, 28, 1, true, 0, Math.PI), matCowling);
    top.rotation.z = Math.PI / 2;
    top.material = matCowling.clone(); top.material.side = THREE.DoubleSide;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.045, 8, 40), new THREE.MeshStandardMaterial({ color: 0xffcf5c, roughness: 0.4, metalness: 0.4 }));
    stripe.rotation.y = Math.PI / 2; stripe.position.x = -1.2;
    const stripe2 = stripe.clone(); stripe2.position.x = 1.2;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.09, 0.16), matDark);
    rail.position.set(0, 1.56, 0);
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.22), matDark);
    hinge.position.set(0, 1.45, 0.62);
    [-1.1, 0, 1.1].forEach((x) => {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), matTitan);
      latch.position.set(x, 1.56, 0);
      g.add(latch);
    });
    g.add(top, stripe, stripe2, rail, hinge);
    const n = (y, z) => [0, y / 1.55, z / 1.55];
    registerPart(1, g, [
      [-1.4, 1.51, 0.35, ...n(1.51, 0.35)], [-0.5, 1.52, 0.3, ...n(1.52, 0.3)],
      [0.5, 1.52, -0.3, ...n(1.52, -0.3)], [1.4, 1.51, 0.35, ...n(1.51, 0.35)],
      [-1.4, 1.51, -0.35, ...n(1.51, -0.35)], [1.4, 1.51, -0.35, ...n(1.51, -0.35)],
      [0, 1.10, 1.095, ...n(1.10, 1.095)], [0, 1.10, -1.095, ...n(1.10, -1.095)],
    ]);
  }

  // 2 — Fan cowl bottom: shell + rail + drain mast + latch housings
  {
    const g = new THREE.Group();
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 3.4, 28, 1, true, Math.PI, Math.PI), matCowling);
    bot.rotation.z = Math.PI / 2;
    bot.material = matCowling.clone(); bot.material.side = THREE.DoubleSide;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.09, 0.16), matDark);
    rail.position.set(0, -1.56, 0);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.2), matDark);
    mast.position.set(0.9, -1.7, 0);
    [-1.1, 1.1].forEach((x) => {
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.22), matTitan);
      housing.position.set(x, -1.56, 0);
      g.add(housing);
    });
    g.add(bot, rail, mast);
    const n = (y, z) => [0, y / 1.55, z / 1.55];
    registerPart(2, g, [
      [-1.4, -1.51, 0.35, ...n(-1.51, 0.35)], [-0.5, -1.52, 0.3, ...n(-1.52, 0.3)],
      [-0.9, -1.096, -1.096, ...n(-1.096, -1.096)], [1.4, -1.51, 0.35, ...n(-1.51, 0.35)],
      [-1.4, -1.51, -0.35, ...n(-1.51, -0.35)], [1.4, -1.51, -0.35, ...n(-1.51, -0.35)],
      [0, -1.10, 1.095, ...n(-1.10, 1.095)], [0, -1.10, -1.095, ...n(-1.10, -1.095)],
    ]);
  }

  // 3 — Spinner cone with flank studs
  {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 24), metal(0xe8eef7, 0.25, 0.9));
    cone.rotation.z = Math.PI / 2; cone.position.x = -2.6;
    g.add(cone);
    const studs = [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]].map(([y, z]) => {
      const ry = y / 0.3, rz = z / 0.3;
      return [-2.467, y, z, -0.49, 0.872 * ry, 0.872 * rz];
    });
    registerPart(3, g, studs);
  }

  // 4 — Fan blade set: 22 wide-chord blades + root ring + shroud band
  {
    const g = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.05, 1.05, 0.3);
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(bladeGeo, matBlade);
      const a = (i / 22) * Math.PI * 2;
      b.position.set(-1.7, Math.cos(a) * 0.9, Math.sin(a) * 0.9);
      b.rotation.x = -a;
      b.rotation.y = 0.5;
      g.add(b);
    }
    const root = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 10, 28), matDark);
    root.rotation.y = Math.PI / 2; root.position.x = -1.7;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.03, 6, 32), matTitan);
    band.rotation.y = Math.PI / 2; band.position.x = -1.7;
    g.add(root, band);
    g.userData.spin = true;
    registerPart(4, g, faceBolts(-1.82, 0.45, [0, 60, 120, 180, 240, 300], -1));
  }

  // 5 — Fan disc: hub disc + shaft nut + thrust housing
  {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 24), matTitan);
    disc.rotation.z = Math.PI / 2; disc.position.x = -1.7;
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 6), matCopper);
    nut.rotation.z = Math.PI / 2; nut.position.x = -1.9;
    const thrust = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 10, 24), matDark);
    thrust.rotation.y = Math.PI / 2; thrust.position.x = -1.55;
    g.add(disc, nut, thrust);
    g.userData.spin = true;
    registerPart(5, g, faceBolts(-1.845, 0.28, [0, 60, 120, 180, 240, 300], -1));
  }

  // 6 — Outlet guide vanes: 14 structural vanes + shrouds
  {
    const g = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.28), matTitan);
      vane.position.set(-1.1, Math.cos(a) * 0.95, Math.sin(a) * 0.95);
      vane.rotation.x = -a + 0.2;
      g.add(vane);
    }
    [0.68, 1.22].forEach((r) => {
      const sh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 32), matDark);
      sh.rotation.y = Math.PI / 2; sh.position.x = -1.1;
      g.add(sh);
    });
    registerPart(6, g, faceBolts(-1.18, 1.22, [0, 45, 90, 135, 180, 225, 270, 315], -1));
  }

  // 7 — Fan case + frame: containment shell, kevlar band, flanges, 6 struts
  {
    const g = new THREE.Group();
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.48, 0.6, 30, 1, true), matAccent);
    casing.rotation.z = Math.PI / 2; casing.position.x = -1.7;
    casing.material = matAccent.clone(); casing.material.side = THREE.DoubleSide;
    const kevlar = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.06, 8, 36), matCopper);
    kevlar.rotation.y = Math.PI / 2; kevlar.position.x = -1.45;
    [-2.0, -1.4].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.07, 8, 36), matTitan);
      fl.rotation.y = Math.PI / 2; fl.position.x = x;
      g.add(fl);
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.12), matDark);
      strut.position.set(-1.35, Math.cos(a) * 0.95, Math.sin(a) * 0.95);
      strut.rotation.x = -a;
      g.add(strut);
    }
    const hubring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 8, 24), matDark);
    hubring.rotation.y = Math.PI / 2; hubring.position.x = -1.35;
    g.add(casing, kevlar, hubring);
    registerPart(7, g, [...ringBolts(-2.0, 1.58, [90, 0, 270, 180]), ...ringBolts(-1.4, 1.58, [90, 0, 270, 180])]);
  }

  // 8 — LPC booster: 3 stages + vanes
  {
    const g = new THREE.Group();
    [[-0.9, 1.0], [-0.5, 0.95], [-0.1, 0.9]].forEach(([x, R]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.13, 10, 30), matTitan);
      ring.rotation.y = Math.PI / 2; ring.position.x = x;
      g.add(ring);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const vane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.12), matDark);
        vane.position.set(x, Math.cos(a) * (R - 0.28), Math.sin(a) * (R - 0.28));
        vane.rotation.x = -a + 0.4;
        g.add(vane);
      }
    });
    registerPart(8, g, [
      [-0.9, 1.14, 0], [-0.1, 1.04, 0], [-0.9, -1.14, 0], [-0.1, -1.04, 0],
      [-0.5, 0, 1.09, 0, 0, 1], [-0.5, 0, -1.09, 0, 0, -1],
    ]);
  }

  // 9 — Accessory gearbox: case + gears + oil tank + pumps + starter
  {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.8), matDark);
    box.position.set(0.2, -1.55, 0);
    g.add(box);
    [-0.2, 0.6].forEach((x) => {
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 14), matTitan);
      housing.position.set(x, -1.85, 0.15);
      const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 12), matCopper);
      gear.position.set(x, -1.85, 0.15);
      g.add(housing, gear);
    });
    const oilTank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 16), metal(0x2e7d4f, 0.5, 0.6));
    oilTank.rotation.z = Math.PI / 2;
    oilTank.position.set(0.2, -1.5, -0.62);
    const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 10), matSteel);
    towerShaft.position.set(-0.3, -1.0, 0);
    const fuelPump = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.3), matTitan);
    fuelPump.position.set(-0.35, -1.62, 0.45);
    const starter = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), metal(0x7a2e2e, 0.5, 0.6));
    starter.position.set(0.7, -1.6, -0.45);
    g.add(oilTank, towerShaft, fuelPump, starter);
    registerPart(9, g, [
      [-0.4, -1.29, 0.3, 0, 1, 0], [0.8, -1.29, 0.3, 0, 1, 0],
      [-0.4, -1.29, -0.3, 0, 1, 0], [0.8, -1.29, -0.3, 0, 1, 0],
      [-0.45, -1.48, 0.45, 0, 1, 0], [-0.25, -1.48, 0.45, 0, 1, 0],
      [0.62, -1.44, -0.45, 0, 1, 0], [0.78, -1.44, -0.45, 0, 1, 0],
    ]);
  }

  // 10 — HPC split casing: shell, flanges, rails, bleed valves, bosses
  {
    const g = new THREE.Group();
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 1.0, 26, 1, true), metal(0x54607a, 0.45, 0.85));
    casing.rotation.z = Math.PI / 2; casing.position.x = 0.6;
    casing.material = casing.material.clone(); casing.material.side = THREE.DoubleSide;
    [0.1, 1.1].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.06, 8, 30), matTitan);
      fl.rotation.y = Math.PI / 2; fl.position.x = x;
      g.add(fl);
    });
    [1.03, -1.03].forEach((z) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.12), matDark);
      rail.position.set(0.6, 0, z);
      g.add(rail);
    });
    [0.15, 0.85].forEach((x) => {
      const bv = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), matCopper);
      bv.position.set(x, 1.02, 0);
      g.add(bv);
    });
    [[0.4, 0.3], [0.8, -0.3]].forEach(([x, z]) => {
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), matSteel);
      boss.position.set(x, 0.98, z);
      g.add(boss);
    });
    g.add(casing);
    const railBolts = [];
    [0.15, 0.3, 0.45].forEach((x) => {
      railBolts.push([x, 0.05, 1.03, 0, 1, 0], [x, 0.05, -1.03, 0, 1, 0]);
    });
    registerPart(10, g, [...railBolts,
      [0.15, 1.14, 0, 0, 1, 0], [0.85, 1.14, 0, 0, 1, 0],
      [0.02, 0.721, 0.721, -1, 0, 0], [0.02, -0.721, -0.721, -1, 0, 0]]);
  }

  // 11 — HPC rotor: 5 blisk stages + front flange + tie cone
  {
    const g = new THREE.Group();
    [[0.35, 0.8], [0.5, 0.75], [0.65, 0.7], [0.8, 0.65], [0.95, 0.6]].forEach(([x, R]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.1, 10, 28), matTitan);
      ring.rotation.y = Math.PI / 2; ring.position.x = x;
      g.add(ring);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const vane = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.09), matDark);
        vane.position.set(x, Math.cos(a) * (R - 0.2), Math.sin(a) * (R - 0.2));
        vane.rotation.x = -a + 0.5;
        g.add(vane);
      }
    });
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 20), matSteel);
    flange.rotation.z = Math.PI / 2; flange.position.x = 0.29;
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.5, 12), matCopper);
    tie.rotation.z = Math.PI / 2; tie.position.x = 0.1;
    g.add(flange, tie);
    registerPart(11, g, [
      ...faceBolts(0.21, 0.35, [45, 135, 225, 315], -1),
      [0.35, 0.91, 0, 0, 0.964, 0.267], [0.35, -0.91, 0, 0, -0.964, -0.267],
      [0.35, 0, 0.91, 0, 0.267, 0.964], [0.35, 0, -0.91, 0, -0.267, -0.964],
    ]);
  }

  // 12 — EEC + harness: control box on tray + loom arcs + plugs
  {
    const g = new THREE.Group();
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.35), matDark);
    tray.position.set(1.1, -1.20, 0.4);
    const eec = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.4), metal(0x1d3a2e, 0.5, 0.6));
    eec.position.set(1.1, -1.28, 0.4);
    g.add(tray, eec);
    for (let k = 0; k < 6; k++) {
      const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), matCopper);
      plug.rotation.z = Math.PI / 2;
      plug.position.set(0.80, -1.28, 0.28 + k * 0.05);
      g.add(plug);
    }
    [0.7, 1.0, 1.3].forEach((x, i) => {
      const loom = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.045, 8, 30, 2.1), matDark);
      loom.rotation.y = Math.PI / 2;
      loom.rotation.x = 0.6 + i * 0.9;
      loom.position.x = x;
      g.add(loom);
    });
    [[0.9, 0.2], [1.3, -0.3]].forEach(([x, a]) => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), matTitan);
      clamp.position.set(x, 1.25 * Math.cos(a), 1.25 * Math.sin(a));
      g.add(clamp);
    });
    // Studs face DOWN off the box belly (unbolted from underneath)
    registerPart(12, g, [
      [0.95, -1.40, 0.3, 0, -1, 0], [1.25, -1.40, 0.3, 0, -1, 0],
      [0.95, -1.40, 0.5, 0, -1, 0], [1.25, -1.40, 0.5, 0, -1, 0],
      [1.1, -1.40, 0.3, 0, -1, 0], [1.1, -1.40, 0.5, 0, -1, 0],
    ]);
  }

  // 13 — Ignition exciters: 2 boxes + HT leads
  {
    const g = new THREE.Group();
    [0.5, -0.5].forEach((z) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.28), matDark);
      box.position.set(1.2, 1.02, z);
      g.add(box);
      [-0.08, 0.08].forEach((dx) => {
        const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), matCopper);
        lead.position.set(1.2 + dx, 0.72, z);
        lead.rotation.x = z > 0 ? 0.25 : -0.25;
        g.add(lead);
      });
    });
    registerPart(13, g, [
      [1.12, 1.12, 0.5, 0, 1, 0], [1.28, 1.12, 0.5, 0, 1, 0],
      [1.12, 1.12, -0.5, 0, 1, 0], [1.28, 1.12, -0.5, 0, 1, 0],
    ]);
  }

  // 14 — Combustor outer case: pressure shell + flanges + bosses
  {
    const g = new THREE.Group();
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 1.1, 28, 1, true), metal(0x5a6b85, 0.45, 0.85));
    casing.rotation.z = Math.PI / 2; casing.position.x = 1.1;
    casing.material = casing.material.clone(); casing.material.side = THREE.DoubleSide;
    [0.55, 1.65].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.07, 8, 32), matTitan);
      fl.rotation.y = Math.PI / 2; fl.position.x = x;
      g.add(fl);
    });
    [[0.8, 0.5], [1.3, -0.5]].forEach(([x, z]) => {
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 10), matCopper);
      boss.position.set(x, 1.1, z);
      g.add(boss);
    });
    g.add(casing);
    registerPart(14, g, [
      ...faceBolts(0.53, 1.12, [45, 135, 225, 315], -1),
      [1.1, 1.13, 0, 0, 1, 0], [1.1, -1.13, 0, 0, -1, 0],
      [1.1, 0, 1.13, 0, 0, 1], [1.1, 0, -1.13, 0, 0, -1],
    ]);
  }

  // 15 — Fuel manifold: ring + 8 nozzle stems + pads + pipes + metering
  {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.1, 10, 28), matCopper);
    ring.rotation.y = Math.PI / 2; ring.position.x = 0.9;
    g.add(ring);
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const dir = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.51, 8), matCopper);
      stem.quaternion.setFromUnitVectors(up, dir);
      stem.position.set(0.9, dir.y * 0.8, dir.z * 0.8);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), matDark);
      pad.position.set(0.9, dir.y * 1.08, dir.z * 1.08);
      pad.quaternion.setFromUnitVectors(up, dir);
      g.add(stem, pad);
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const pipe = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.07, 10, 32, Math.PI * 1.2), matCopper);
      pipe.rotation.y = Math.PI / 2;
      pipe.rotation.x = a;
      pipe.position.x = 0.55;
      g.add(pipe);
    }
    const metering = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), matDark);
    metering.position.set(0.55, -1.42, 0.3);
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 12), matCopper);
    manifold.position.set(0.55, -1.35, 0);
    manifold.rotation.z = Math.PI / 2;
    g.add(metering, manifold);
    const padAngles = [67.5, 157.5, 247.5, 337.5].map((deg) => {
      const a = deg * Math.PI / 180;
      return [0.9, 1.14 * Math.cos(a), 1.14 * Math.sin(a), 0, Math.cos(a), Math.sin(a)];
    });
    registerPart(15, g, [...padAngles,
      [0.0, -1.18, 0.12, 0, 1, 0], [1.1, -1.18, -0.12, 0, 1, 0],
      [0.45, -1.21, 0.25, 0, 1, 0], [0.65, -1.21, 0.35, 0, 1, 0]]);
  }

  // 16 — Burner cans: 8 flame tubes + caps + support ring + liner
  {
    const g = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 1.0, 14), matBurn);
      can.rotation.z = Math.PI / 2;
      can.position.set(1.0, Math.cos(a) * 0.75, Math.sin(a) * 0.75);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 14), metal(0xff8c42, 0.4, 0.8));
      cap.rotation.z = Math.PI / 2;
      cap.position.set(0.46, Math.cos(a) * 0.75, Math.sin(a) * 0.75);
      g.add(can, cap);
    }
    const support = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 32), matDark);
    support.rotation.y = Math.PI / 2; support.position.x = 0.5;
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 20, 1, true), matBurn);
    liner.rotation.z = Math.PI / 2; liner.position.x = 1.0;
    liner.material = matBurn.clone(); liner.material.side = THREE.DoubleSide;
    g.add(support, liner);
    const flank = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      flank.push([1.0, 1.0 * Math.cos(a), 1.0 * Math.sin(a), 0, Math.cos(a), Math.sin(a)]);
    }
    registerPart(16, g, [...flank, [0.40, 0.75, 0, -1, 0, 0], [0.40, -0.75, 0, -1, 0, 0]]);
  }

  // 17 — HPT nozzle vanes: 20 vanes + shrouds
  {
    const g = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.1), metal(0xe0a45c, 0.35, 0.9));
      vane.position.set(1.62, Math.cos(a) * 0.95, Math.sin(a) * 0.95);
      vane.rotation.x = -a + 0.35;
      g.add(vane);
    }
    [0.7, 1.2].forEach((r) => {
      const sh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 30), matDark);
      sh.rotation.y = Math.PI / 2; sh.position.x = 1.62;
      g.add(sh);
    });
    registerPart(17, g, faceBolts(1.54, 1.2, [45, 135, 225, 315], -1));
  }

  // 18 — HPT rotor: disc + 30 blades + shroud + coupling
  {
    const g = new THREE.Group();
    const x = 1.78;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.18, 26), metal(0x9aa3b2, 0.3, 0.95));
    disc.rotation.z = Math.PI / 2; disc.position.x = x;
    g.add(disc);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.13), metal(0xe0a45c, 0.35, 0.9));
      bl.position.set(x, Math.cos(a) * 0.96, Math.sin(a) * 0.96);
      bl.rotation.x = -a;
      g.add(bl);
    }
    const shroud = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.07, 8, 32), matDark);
    shroud.rotation.y = Math.PI / 2; shroud.position.x = x;
    const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.25, 16), matSteel);
    coupling.rotation.z = Math.PI / 2; coupling.position.x = x - 0.2;
    g.add(shroud, coupling);
    g.userData.spin = true;
    registerPart(18, g, faceBolts(1.67, 0.5, [0, 60, 120, 180, 240, 300], -1));
  }

  // 19 — LPT nozzle vanes: 24 vanes + shrouds
  {
    const g = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.11), matTitan);
      vane.position.set(2.02, Math.cos(a) * 1.02, Math.sin(a) * 1.02);
      vane.rotation.x = -a + 0.35;
      g.add(vane);
    }
    [0.75, 1.3].forEach((r) => {
      const sh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 32), matDark);
      sh.rotation.y = Math.PI / 2; sh.position.x = 2.02;
      g.add(sh);
    });
    registerPart(19, g, faceBolts(1.94, 1.3, [45, 135, 225, 315], -1));
  }

  // 20 — LPT rotor: big disc + 36 blades + shroud
  {
    const g = new THREE.Group();
    const x = 2.22;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.18, 28), metal(0x9aa3b2, 0.3, 0.95));
    disc.rotation.z = Math.PI / 2; disc.position.x = x;
    g.add(disc);
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.14), matBlade);
      bl.position.set(x, Math.cos(a) * 1.075, Math.sin(a) * 1.075);
      bl.rotation.x = -a + 0.3;
      g.add(bl);
    }
    const shroud = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.07, 8, 34), matDark);
    shroud.rotation.y = Math.PI / 2; shroud.position.x = x;
    g.add(shroud);
    g.userData.spin = true;
    registerPart(20, g, faceBolts(2.11, 0.55, [0, 60, 120, 180, 240, 300], -1));
  }

  // 21 — TEC: outer ring + hub + 10 struts + rear flange
  {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.4, 30, 1, true), matDark);
    ring.rotation.z = Math.PI / 2; ring.position.x = 2.75;
    ring.material = matDark.clone(); ring.material.side = THREE.DoubleSide;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 18), matTitan);
    hub.rotation.z = Math.PI / 2; hub.position.x = 2.75;
    g.add(ring, hub);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.18), matTitan);
      strut.position.set(2.75, Math.cos(a) * 0.825, Math.sin(a) * 0.825);
      strut.rotation.x = -a;
      g.add(strut);
    }
    const flange = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.07, 8, 34), matTitan);
    flange.rotation.y = Math.PI / 2; flange.position.x = 2.95;
    g.add(flange);
    registerPart(21, g, faceBolts(3.03, 1.3, [0, 45, 90, 135, 180, 225, 270, 315], 1));
  }

  // 22 — Exhaust mixer: lobed ring + base + flange
  {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 24, 1, true), matBurn);
    base.rotation.z = Math.PI / 2; base.position.x = 2.55;
    base.material = matBurn.clone(); base.material.side = THREE.DoubleSide;
    g.add(base);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const off = i % 2 === 0 ? 0.08 : -0.08;
      const lobe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.14), matTitan);
      lobe.position.set(2.55, Math.cos(a) * (0.85 + off), Math.sin(a) * (0.85 + off));
      lobe.rotation.x = -a;
      g.add(lobe);
    }
    const flange = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 28), matTitan);
    flange.rotation.y = Math.PI / 2; flange.position.x = 2.4;
    g.add(flange);
    registerPart(22, g, faceBolts(2.32, 0.85, [0, 60, 120, 180, 240, 300], -1));
  }

  // 23 — Exhaust plug: cone + hub + 4 struts
  {
    const g = new THREE.Group();
    const plug = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 20), matSteel);
    plug.rotation.z = -Math.PI / 2; plug.position.x = 3.1;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 12), matDark);
    hub.rotation.z = Math.PI / 2; hub.position.x = 2.66;
    g.add(plug, hub);
    [0, 90, 180, 270].forEach((deg) => {
      const a = deg * Math.PI / 180;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.12), matTitan);
      strut.position.set(2.68, Math.cos(a) * 0.62, Math.sin(a) * 0.62);
      strut.rotation.x = -a;
      g.add(strut);
    });
    const sb = [0, 90, 180, 270].map((deg) => {
      const a = deg * Math.PI / 180;
      return [2.62, 0.62 * Math.cos(a), 0.62 * Math.sin(a), -1, 0, 0];
    });
    registerPart(23, g, sb);
  }

  // 24 — Exhaust nozzle: petal shell + petals + actuator ring + rams
  {
    const g = new THREE.Group();
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.62, 1.1, 26, 1, true), matDark);
    noz.rotation.z = Math.PI / 2; noz.position.x = 2.9;
    noz.material = noz.material.clone(); noz.material.side = THREE.DoubleSide;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.18), matTitan);
      petal.position.set(3.3, Math.cos(a) * 0.68, Math.sin(a) * 0.68);
      petal.rotation.x = -a;
      g.add(petal);
    }
    const actRing = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.08, 10, 30), matCopper);
    actRing.rotation.y = Math.PI / 2; actRing.position.x = 2.42;
    g.add(actRing);
    [90, 210, 330].forEach((deg) => {
      const a = deg * Math.PI / 180;
      const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 10), matSteel);
      ram.rotation.z = Math.PI / 2;
      ram.position.set(2.5, Math.cos(a) * 1.02, Math.sin(a) * 1.02);
      g.add(ram);
    });
    g.add(noz);
    registerPart(24, g, faceBolts(2.32, 0.98, [0, 60, 120, 180, 240, 300], -1));
  }

  // Hangar floor + lights
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 48),
    new THREE.MeshStandardMaterial({ color: 0x111a2c, roughness: 0.9, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.28;
  scene.add(floor);
  const grid = new THREE.GridHelper(30, 30, 0x38e1ff, 0x1c2f55);
  grid.position.y = -2.27;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);

  return { engine, parts, pickables, bolts, shaftGroup };
}
