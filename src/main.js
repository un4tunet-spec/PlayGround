import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildEngine, STEPS, TOOLS } from './engineModel.js';
import { createGame, DIFFS, fmtTime, addScore, mistake, loadBest, saveBest } from './gameState.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);
scene.fog = new THREE.Fog(0x0b1220, 18, 38);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
const CAM_HOME = new THREE.Vector3(7.6, 3.4, 8.8);
camera.position.copy(CAM_HOME);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -0.1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3.2;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.62;

// Lights
scene.add(new THREE.HemisphereLight(0xbdd7ff, 0x1a2233, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(6, 9, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);
const rim = new THREE.DirectionalLight(0x38e1ff, 0.9);
rim.position.set(-7, 4, -6);
scene.add(rim);
const warm = new THREE.PointLight(0xffcf5c, 18, 20, 1.8);
warm.position.set(0, 3.4, 2.5);
scene.add(warm);

// Back-wall glow strips (hangar vibe)
{
  const geo = new THREE.BoxGeometry(0.25, 0.25, 14);
  const m1 = new THREE.MeshBasicMaterial({ color: 0x38e1ff });
  const m2 = new THREE.MeshBasicMaterial({ color: 0xffcf5c });
  const s1 = new THREE.Mesh(geo, m1); s1.position.set(-7, 5.4, 0); s1.rotation.y = Math.PI / 2;
  const s2 = new THREE.Mesh(geo, m2); s2.position.set(7, 5.4, 0); s2.rotation.y = Math.PI / 2;
  s1.material.transparent = s2.material.transparent = true;
  s1.material.opacity = s2.material.opacity = 0.7;
  scene.add(s1, s2);
}

const { engine, parts, pickables, shaftGroup } = buildEngine(scene);
engine.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

// (Bolt reachability guard runs at the end of this module, after probe() exists.)

const G = createGame();

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const stepsEl = $('steps'), toastWrap = $('toast-wrap'), tooltip = $('tooltip');
const hudTime = $('hud-time'), hudScore = $('hud-score'), hudCond = $('hud-condition'), hudProg = $('hud-progress');

function toast(msg, kind = 'info', ms = 2600) {
  const d = document.createElement('div');
  d.className = `toast ${kind}`;
  d.textContent = msg;
  toastWrap.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity .4s'; setTimeout(() => d.remove(), 400); }, ms);
  while (toastWrap.children.length > 3) toastWrap.firstChild.remove();
}

function renderSteps() {
  stepsEl.innerHTML = '';
  STEPS.forEach((s, i) => {
    const li = document.createElement('li');
    const cls = i < G.currentStep ? 'done' : i === G.currentStep ? 'active' : 'locked';
    li.className = cls;
    const mark = i < G.currentStep ? '✓' : (i + 1);
    li.innerHTML = `<span class="n">${mark}</span><span><b>${s.name}</b><br/><small style="color:var(--dim)">${s.hint}</small></span><span class="tool-tag">${TOOLS[s.tool].icon} ${TOOLS[s.tool].name}</span>`;
    stepsEl.appendChild(li);
  });
  hudProg.textContent = `${G.removedCount} / ${STEPS.length}`;
  $('diff-badge').textContent = DIFFS[G.diff].label;
}

function renderTools() {
  document.querySelectorAll('#toolbelt .tool').forEach((b) => {
    b.classList.toggle('active', b.dataset.tool === G.selectedTool);
  });
}

function renderBench() {
  const box = $('bench-items');
  box.innerHTML = '';
  if (G.removedCount === 0) { box.innerHTML = '<p class="empty">Removed parts land here.</p>'; return; }
  parts.filter((p) => p.removed).forEach((p) => {
    const d = document.createElement('div');
    d.className = 'bench-item';
    d.textContent = `✔ ${p.step.name} (+${Math.round(500 * DIFFS[G.diff].scoreMul)})`;
    box.appendChild(d);
  });
}

function renderCombo() {
  const c = $('combo');
  if (G.streak >= 2) { c.classList.remove('hidden'); $('combo-n').textContent = G.streak; }
  else c.classList.add('hidden');
}

function updateHUD() {
  hudTime.textContent = fmtTime(G.over ? G.finishedTime : G.elapsed);
  hudScore.textContent = G.score.toLocaleString();
  hudCond.textContent = `${G.condition}%`;
  hudCond.style.color = G.condition > 60 ? 'var(--good)' : G.condition > 30 ? 'var(--gold)' : 'var(--bad)';
}

function bestLine() {
  const b = loadBest();
  $('best-line').textContent = b ? `${b.score.toLocaleString()} pts · ${fmtTime(b.time)} · ${b.diff}` : 'no flights yet';
}
bestLine();

// ---------- Picking ----------
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = null;
let pointerDownPos = null;

function setMouse(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function findPart(stepIndex) { return parts[stepIndex]; }

function pulseTargets() {
  const t = performance.now() / 1000;
  const showGuide = DIFFS[G.diff].highlight || performance.now() < G.hintUntil;
  parts.forEach((p, i) => {
    const isCurrent = i === G.currentStep && !p.removed && G.started && !G.over;
    p.boltMeshes.forEach((b) => {
      if (b.userData.gone) return;
      const s = isCurrent && (showGuide || true) ? 1 + Math.sin(t * 5) * 0.18 : 1;
      b.scale.setScalar(b.userData.popping ? b.scale.x : s);
      b.material.emissiveIntensity = isCurrent ? 0.9 + Math.sin(t * 5) * 0.35 : 0.25;
    });
    // loose part pulse
    if (p.loose && !p.removed) {
      p.group.traverse((o) => {
        if (o.isMesh && !o.userData.isBolt && o.material.emissive) {
          o.material.emissive = o.material.emissive || new THREE.Color(0);
        }
      });
      const k = 1 + Math.sin(t * 4) * 0.015;
      p.group.scale.setScalar(k);
    }
  });
  // spin fan + turbines until removed
  const fanB = parts[4], fanD = parts[5], hpt = parts[18], lpt = parts[20];
  if (fanB && !fanB.removed) fanB.group.rotation.x += 0.008;
  if (fanD && !fanD.removed) fanD.group.rotation.x += 0.008;
  if (hpt && !hpt.removed) hpt.group.rotation.x += 0.014;
  if (lpt && !lpt.removed) lpt.group.rotation.x += 0.010;
  shaftGroup.rotation.x += 0.004;
}

canvas.addEventListener('pointermove', (e) => {
  setMouse(e);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(pickables.filter((o) => o.visible && !o.userData.gone), false);
  const hit = hits[0]?.object || null;
  if (hit !== hovered) {
    hovered = hit;
    document.body.style.cursor = hit ? 'pointer' : 'default';
  }
  if (!hit) { tooltip.textContent = 'Hover the engine — click glowing bolts.'; return; }
  const si = hit.userData.stepIndex;
  const p = parts[si];
  if (hit.userData.isBolt) {
    const need = STEPS[si].tool;
    tooltip.textContent = p.removed ? `${p.step.name} — already removed`
      : si !== G.currentStep ? `🔒 ${p.step.name} — follow the manual (step ${G.currentStep + 1} first)`
      : G.selectedTool === need ? `◉ Bolt · ${p.step.name} — click to loosen (${p.boltsLeft} left)`
      : `⚠ Bolt · ${p.step.name} — needs ${TOOLS[need].name} (you hold ${TOOLS[G.selectedTool].name})`;
  } else {
    tooltip.textContent = p.removed ? `${p.step.name} — on the bench`
      : p.loose ? `✦ ${p.step.name} is LOOSE — click to extract it!`
      : si !== G.currentStep ? `🔒 ${p.step.name} — step ${si + 1} (do step ${G.currentStep + 1} first)`
      : `${p.step.name} — loosen all ${p.boltsLeft} bolt(s) with ${TOOLS[p.step.tool].name} first`;
  }
});

canvas.addEventListener('pointerdown', (e) => { pointerDownPos = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!pointerDownPos) return;
  const dx = e.clientX - pointerDownPos[0], dy = e.clientY - pointerDownPos[1];
  pointerDownPos = null;
  if (dx * dx + dy * dy > 25) return; // was a drag
  handleClick(e);
});

function shakeCamera() {
  const x0 = camera.position.x;
  let n = 0;
  const iv = setInterval(() => {
    camera.position.x = x0 + Math.sin(n * 1.2) * 0.12 * (1 - n / 8);
    if (++n > 8) { clearInterval(iv); camera.position.x = x0; }
  }, 30);
}

function animateBoltOut(b, done) {
  b.userData.popping = true;
  const s0 = b.scale.x || 1;
  const t0 = performance.now();
  (function tick() {
    const k = (performance.now() - t0) / 220;
    if (k >= 1) { b.visible = false; b.userData.gone = true; done?.(); return; }
    b.scale.setScalar(Math.max(0.001, s0 * (1 - k)));
    b.rotation.y += 0.4;
    requestAnimationFrame(tick);
  })();
}

function animateExtract(part, done) {
  const dir = new THREE.Vector3(...part.step.extract).normalize();
  const p0 = part.group.position.clone();
  const t0 = performance.now();
  G.animating.add(part.step.id);
  sfx.extract();
  (function tick() {
    const k = Math.min(1, (performance.now() - t0) / 900);
    const e = 1 - Math.pow(1 - k, 3);
    part.group.position.copy(p0).addScaledVector(dir, e * 3.2);
    part.group.position.y += e * 0.6;
    part.group.rotation.x += 0.02;
    part.group.scale.setScalar(1 - e * 0.55);
    part.group.traverse((o) => {
      if (o.isMesh && o.material.transparent !== undefined) { o.material.transparent = true; o.material.opacity = 1 - e * 0.9; }
    });
    if (k >= 1) {
      part.group.visible = false;
      G.animating.delete(part.step.id);
      done?.();
      return;
    }
    requestAnimationFrame(tick);
  })();
}

function handleClick(e) {
  if (!G.started || G.over) return;
  setMouse(e);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(pickables.filter((o) => o.visible && !o.userData.gone), false);
  if (!hits.length) return;
  const hit = hits[0].object;
  const si = hit.userData.stepIndex;
  const part = parts[si];

  if (part.removed || G.animating.has(part.step.id)) return;

  // Wrong order
  if (si !== G.currentStep) {
    mistake(G);
    sfx.locked();
    shakeCamera();
    toast(`🔒 Follow the manual — remove “${STEPS[G.currentStep].name}” first (step ${G.currentStep + 1}).`, 'bad');
    updateHUD();
    return;
  }

  if (hit.userData.isBolt) {
    const need = part.step.tool;
    if (G.selectedTool !== need) {
      mistake(G);
      sfx.error();
      shakeCamera();
      const btn = document.querySelector(`.tool[data-tool="${G.selectedTool}"]`);
      btn?.classList.add('wrong-flash');
      setTimeout(() => btn?.classList.remove('wrong-flash'), 350);
      toast(`⚠ Wrong tool! “${part.step.name}” needs ${TOOLS[need].icon} ${TOOLS[need].name}. (−150, −8% condition)`, 'bad');
      updateHUD();
      return;
    }
    // correct bolt
    sfx.ratchet();
    setTimeout(() => sfx.boltOut(), 90);
    animateBoltOut(hit);
    part.boltsLeft--;
    addScore(G, 100);
    G.streak++;
    G.bestStreak = Math.max(G.bestStreak, G.streak);
    if (G.streak >= 2 && G.streak % 5 === 0) { addScore(G, 100); toast(`🔥 Streak ×${G.streak}! Bonus +100`, 'info', 1800); }
    if (part.boltsLeft <= 0) {
      part.loose = true;
      toast(`✦ “${part.step.name}” is LOOSE — click the part to extract it!`, 'good');
      sfx.select();
    } else {
      toast(`Bolt out — ${part.boltsLeft} left on “${part.step.name}” (+100)`, 'info', 1400);
    }
    renderCombo(); updateHUD();
    return;
  }

  // Clicked part body
  if (!part.loose) {
    const need = part.step.tool;
    if (G.selectedTool !== need) {
      mistake(G); sfx.error(); shakeCamera();
      toast(`⚠ Select ${TOOLS[need].icon} ${TOOLS[need].name} first, then click the glowing bolts.`, 'bad');
    } else {
      sfx.locked();
      toast(`🔩 “${part.step.name}” still has ${part.boltsLeft} bolt(s) — click them first.`, 'info', 2000);
    }
    updateHUD();
    return;
  }
  // extract!
  addScore(G, 500);
  G.streak++;
  G.bestStreak = Math.max(G.bestStreak, G.streak);
  animateExtract(part, () => {
    part.removed = true;
    part.loose = false;
    G.removedCount++;
    G.currentStep++;
    renderSteps(); renderBench(); renderCombo(); updateHUD();
    if (G.removedCount >= STEPS.length) winGame();
    else toast(`✔ “${part.step.name}” on the bench! Next: ${STEPS[G.currentStep].name} (${TOOLS[STEPS[G.currentStep].tool].name}).`, 'good');
  });
  renderCombo(); updateHUD();
}

// ---------- Flow ----------
function startGame() {
  G.started = true;
  G.over = false;
  G.startTime = performance.now();
  $('overlay-start').classList.add('hidden');
  $('overlay-win').classList.add('hidden');
  toast(`🔧 Step 1: ${STEPS[0].name} — grab the ${TOOLS[STEPS[0].tool].name} (press 1/2/3 to swap).`, 'info', 3400);
  sfx.select();
}

function resetGame(keepOverlay = false) {
  const diff = G.diff;
  Object.assign(G, createGame(), { diff });
  parts.forEach((p) => {
    p.removed = false; p.loose = false;
    p.boltsLeft = p.boltMeshes.length;
    p.group.visible = true;
    p.group.position.copy(p.basePos);
    p.group.rotation.set(0, 0, 0);
    p.group.scale.setScalar(1);
    p.group.traverse((o) => {
      if (o.isMesh) {
        o.visible = true;
        if (o.material.opacity !== undefined) { o.material.opacity = 1; o.material.transparent = o.material.transparent && false; }
        if (o.userData.isBolt) { o.userData.gone = false; o.userData.popping = false; o.scale.setScalar(1); }
      }
    });
    // re-add bolts that were hidden
    p.boltMeshes.forEach((b) => { b.visible = true; });
  });
  // restore opacity flags cleanly
  engine.traverse((o) => { if (o.isMesh && o.material.transparent) { o.material.transparent = false; o.material.opacity = 1; } });
  G.selectedTool = STEPS[0].tool;
  renderSteps(); renderTools(); renderBench(); renderCombo(); updateHUD();
  if (!keepOverlay) { G.started = true; G.startTime = performance.now(); }
}

function winGame() {
  G.over = true;
  G.finishedTime = G.elapsed;
  const timeBonus = Math.max(0, 3000 - Math.floor(G.elapsed / 1000) * 10);
  const condBonus = G.condition * 5;
  addScore(G, timeBonus + condBonus);
  updateHUD();
  const rec = saveBest(G);
  sfx.win();
  $('win-stats').innerHTML = `
    <div><label>TIME</label><strong>${fmtTime(G.finishedTime)}</strong></div>
    <div><label>SCORE</label><strong>${G.score.toLocaleString()}</strong></div>
    <div><label>CONDITION</label><strong>${G.condition}%</strong></div>
    <div><label>MISTAKES</label><strong>${G.mistakes}</strong></div>
    <div><label>BEST STREAK</label><strong>×${G.bestStreak}</strong></div>
    <div><label>BEST EVER</label><strong>${rec.isNew ? '★ NEW!' : loadBest().score.toLocaleString()}</strong></div>`;
  setTimeout(() => $('overlay-win').classList.remove('hidden'), 900);
  bestLine();
}

function doHint() {
  if (!G.started || G.over) return;
  const p = parts[G.currentStep];
  if (!p || p.removed) return;
  addScore(G, -100);
  G.hintsUsed++;
  G.selectedTool = p.step.tool;
  renderTools();
  G.hintUntil = performance.now() + 3000;
  sfx.hint();
  toast(`💡 Hint: ${p.step.name} → use ${TOOLS[p.step.tool].icon} ${TOOLS[p.step.tool].name}, ${p.boltsLeft} bolt(s) left. (−100)`, 'info');
  updateHUD();
  // focus camera briefly on part
  const target = new THREE.Vector3();
  p.group.getWorldPosition(target);
  const dir = camera.position.clone().sub(controls.target).normalize();
  controls.target.lerp(target, 0.45);
  camera.position.copy(controls.target).addScaledVector(dir, 7);
}

// ---------- Events ----------
document.querySelectorAll('#toolbelt .tool').forEach((b) => {
  b.addEventListener('click', () => {
    G.selectedTool = b.dataset.tool;
    sfx.click();
    renderTools();
    tooltip.textContent = `${TOOLS[G.selectedTool].icon} ${TOOLS[G.selectedTool].name} selected.`;
  });
});
document.querySelectorAll('.diff').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.diff').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    G.diff = b.dataset.diff;
    renderSteps();
    sfx.click();
  });
});
$('btn-start').addEventListener('click', startGame);
$('btn-again').addEventListener('click', () => { resetGame(); $('overlay-win').classList.add('hidden'); toast('🔧 New engine rolled in. Strip it!', 'info'); });
$('btn-inspect').addEventListener('click', () => {
  $('overlay-win').classList.add('hidden');
  controls.target.set(0.4, -0.2, 0);
  camera.position.set(3.2, 1.2, 3.6);
  toast('🔍 Core shaft exposed — drag to inspect. Press R for a new engine.', 'info', 3200);
});
$('btn-hint').addEventListener('click', doHint);
$('btn-reset').addEventListener('click', () => { resetGame(true); startGame(); toast('↺ New engine rolled in.', 'info'); });
$('btn-sound').addEventListener('click', (e) => {
  const m = sfx.toggle();
  e.currentTarget.textContent = m ? '🔇' : '🔊';
});
$('btn-help').addEventListener('click', () => $('overlay-help').classList.remove('hidden'));
$('btn-close-help').addEventListener('click', () => $('overlay-help').classList.add('hidden'));

window.addEventListener('keydown', (e) => {
  if (e.key === '1') { G.selectedTool = 'wrench'; renderTools(); }
  if (e.key === '2') { G.selectedTool = 'screwdriver'; renderTools(); }
  if (e.key === '3') { G.selectedTool = 'puller'; renderTools(); }
  if (e.key === 'h' || e.key === 'H') doHint();
  if (e.key === 'r' || e.key === 'R') { resetGame(true); startGame(); }
  if (e.key === 'f' || e.key === 'F') { controls.target.set(0, -0.1, 0); camera.position.copy(CAM_HOME); }
  if (e.key === 'm' || e.key === 'M') $('btn-sound').click();
  if (e.key === 'F1') { e.preventDefault(); $('overlay-help').classList.toggle('hidden'); }
  if (e.key === 'Escape') { $('overlay-help').classList.add('hidden'); }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Loop ----------
renderSteps(); renderTools(); renderBench(); updateHUD();
G.selectedTool = STEPS[0].tool;
renderTools();

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (G.started && !G.over) G.elapsed = now - G.startTime;
  pulseTargets();
  controls.update(dt);
  renderer.render(scene, camera);
  if (!loop._t || now - loop._t > 250) { loop._t = now; updateHUD(); }
}
requestAnimationFrame(loop);

// Autostart via ?autostart=1 (useful for kiosk / screenshots)
if (new URLSearchParams(location.search).has('autostart')) startGame();

// Debug / automation handle (used by smoke tests, harmless in production)
function probe(cx, cy, list = pickables, cam = camera) {
  mouse.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, cam);
  const hits = ray.intersectObjects(list.filter((o) => o.visible && !o.userData.gone), false);
  const h0 = hits[0]?.object;
  return h0 ? { partId: h0.userData.partId, stepIndex: h0.userData.stepIndex, isBolt: !!h0.userData.isBolt } : null;
}
window.__hangar = { G, parts, STEPS, camera, controls, renderer, startGame, resetGame, doHint, probe, pickables };

// Dev guard (background, chunked): every bolt must be hittable through the real
// picking path from at least one of 80 viewpoints, tested in the play state of
// its step (earlier assemblies already on the bench). Uses its own camera so
// the player's view is never disturbed.
{
  const gc = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
  const runGuard = async () => {
    const V = new THREE.Vector3();
    const views = [];
    for (const el of [4.5, 2.2, 0.6, -0.8, -1.6]) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        views.push([Math.cos(a) * 10.5, el, Math.sin(a) * 10.5]);
      }
    }
    const unreachable = [];
    let n = 0;
    for (let si = 0; si < parts.length; si++) {
      const p = parts[si];
      const active = pickables.filter((o) => o.userData.stepIndex >= si);
      for (const b of p.boltMeshes) {
        b.getWorldPosition(V);
        let seen = false;
        for (const [cx, cy, cz] of views) {
          gc.position.set(cx, cy, cz);
          gc.lookAt(0, -0.3, 0);
          gc.updateMatrixWorld();
          const pr = V.clone().project(gc);
          if (pr.z > 1) continue;
          const sx = (pr.x * 0.5 + 0.5) * window.innerWidth, sy = (-pr.y * 0.5 + 0.5) * window.innerHeight;
          if (sx < 0 || sx > window.innerWidth || sy < 0 || sy > window.innerHeight) continue;
          const r = probe(sx, sy, active, gc);
          if (r && r.isBolt && r.stepIndex === si) { seen = true; break; }
        }
        if (!seen) unreachable.push(`${p.step.id}@${b.position.toArray().map((v) => v.toFixed(2)).join(',')}`);
        if (++n % 8 === 0) await new Promise((res) => setTimeout(res, 0));
      }
    }
    if (unreachable.length) console.warn('[hangar7] unreachable bolts in: ' + [...new Set(unreachable)].join(', '));
    else console.info('[hangar7] bolt reachability guard passed.');
  };
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) window.requestIdleCallback(runGuard, { timeout: 20000 });
  else setTimeout(runGuard, 2000);
}
