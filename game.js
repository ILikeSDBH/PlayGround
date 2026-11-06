import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101e30');
scene.fog = new THREE.FogExp2('#101e30', 0.0065);
const camera = new THREE.PerspectiveCamera(61, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 7, 17);
scene.add(new THREE.HemisphereLight('#a9d8f1', '#101521', 1.35));
const moon = new THREE.DirectionalLight('#b7dfff', 2.1);
moon.position.set(-35, 70, 24);
scene.add(moon);
const warm = new THREE.DirectionalLight('#ff8c72', 0.55);
warm.position.set(42, 18, -65);
scene.add(warm);

const mat = (color, roughness = .8, metalness = 0, emissive = '#000000', intensity = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: intensity });
const roadMat = mat('#171f2b', .94);
const sidewalkMat = mat('#323948', .9);
const laneMat = new THREE.MeshBasicMaterial({ color: '#b8c5c6', transparent: true, opacity: .48 });
const road = new THREE.Mesh(new THREE.PlaneGeometry(34, 9000), roadMat);
road.rotation.x = -Math.PI / 2; road.position.set(0, -.18, -4200); scene.add(road);
for (const x of [-5.7, 5.7]) {
  const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(1.7, .35, 9000), sidewalkMat);
  sidewalk.position.set(x, -.12, -4200); scene.add(sidewalk);
}
for (const x of [-2.7, 2.7]) {
  const line = new THREE.Mesh(new THREE.PlaneGeometry(.09, 9000), laneMat);
  line.rotation.x = -Math.PI / 2; line.position.set(x, -.06, -4200); scene.add(line);
}
// Soft city glow on the horizon and a sparse field of distant stars.
const starGeo = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 440; i++) starPositions.push((Math.random() - .5) * 500, 35 + Math.random() * 150, -100 - Math.random() * 700);
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#c4e7ff', size: .45, transparent: true, opacity: .65 })));

const buildingColors = ['#253346', '#293647', '#202d3f', '#303748', '#1d2b3c', '#343749', '#243243'];
const windowMats = [mat('#7393a6', .6, .05, '#5e9eb3', .35), mat('#dfb783', .65, 0, '#db9a4f', .45), mat('#324658', .7, 0, '#273c4d', .18)];
const buildings = [];
function makeBuilding(side, z) {
  const group = new THREE.Group();
  const width = 7 + Math.random() * 10;
  const depth = 11 + Math.random() * 15;
  const height = 15 + Math.random() * 38;
  const centerX = side * (7.5 + width * .52 + Math.random() * 5.5);
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat(buildingColors[Math.floor(Math.random() * buildingColors.length)], .9));
  body.position.y = height / 2 - .25; group.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + .25, .35, depth + .25), mat('#536070', .86));
  roof.position.y = height - .1; group.add(roof);
  // Repeated narrow, emissive windows break up the building faces.
  const windowGeo = new THREE.BoxGeometry(.78, 1.15, .065);
  const countX = Math.max(2, Math.floor(width / 1.65));
  const countY = Math.max(3, Math.floor((height - 3) / 2.35));
  const inst = new THREE.InstancedMesh(windowGeo, windowMats[0], countX * countY);
  const dummy = new THREE.Object3D(); let idx = 0;
  for (let row = 0; row < countY; row++) for (let col = 0; col < countX; col++) {
    dummy.position.set(-width / 2 + (col + .7) * width / (countX + .4), 2 + row * 2.3, depth / 2 + .045);
    dummy.updateMatrix(); inst.setMatrixAt(idx, dummy.matrix);
    if (Math.random() < .29) inst.setColorAt(idx, new THREE.Color('#223343'));
    else if (Math.random() < .24) inst.setColorAt(idx, new THREE.Color('#ffbf79'));
    idx++;
  }
  group.add(inst);
  // A few rooftop silhouettes and antennae add scale against the sky.
  const rooftop = new THREE.Mesh(new THREE.BoxGeometry(width * .36, 1.5, depth * .3), mat('#182333', .9));
  rooftop.position.set(side * width * .13, height + 1, 0); group.add(rooftop);
  if (Math.random() > .53) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.035, .06, 3.8, 5), mat('#7c94a5', .6, .25));
    antenna.position.set(-side * width * .22, height + 3.6, 0); group.add(antenna);
  }
  group.position.set(centerX, 0, z);
  scene.add(group);
  buildings.push({ group, side, width, depth });
}
for (let i = 0; i < 38; i++) {
  const z = 18 - i * 12.5;
  makeBuilding(-1, z + Math.random() * 5);
  makeBuilding(1, z + Math.random() * 5);
}

// Hero: a compact, masked red-and-midnight-blue rooftop runner.
const hero = new THREE.Group(); scene.add(hero);
const suitRed = mat('#df414b', .48, .1);
const suitBlue = mat('#122e54', .56, .12);
const suitDark = mat('#101d2d', .55, .1);
const eyeMat = new THREE.MeshStandardMaterial({ color: '#edfaff', emissive: '#94ddff', emissiveIntensity: .65, roughness: .25 });
const sphereGeo = new THREE.SphereGeometry(1, 14, 12);
function orb(parent, material, pos, scale) { const m = new THREE.Mesh(sphereGeo, material); m.position.set(...pos); m.scale.set(...scale); parent.add(m); return m; }
orb(hero, suitBlue, [0, 1.48, 0], [.42, .62, .25]);
orb(hero, suitRed, [0, 2.08, 0], [.33, .34, .3]);
// Mask eyes are deliberately graphic and bright against the red hood.
orb(hero, eyeMat, [-.13, 2.12, -.253], [.105, .055, .025]);
orb(hero, eyeMat, [.13, 2.12, -.253], [.105, .055, .025]);
orb(hero, suitRed, [0, .92, 0], [.34, .45, .23]);
const limbs = [];
function limb(radius, material) { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .72, radius, 1, 8), material); hero.add(mesh); limbs.push(mesh); return mesh; }
const leftArm = limb(.13, suitRed), rightArm = limb(.13, suitRed), leftLeg = limb(.16, suitBlue), rightLeg = limb(.16, suitBlue);
function placeLimb(mesh, from, to) { const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to); mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.scale.y = a.distanceTo(b); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()); }
const chestMark = new THREE.Mesh(new THREE.OctahedronGeometry(.115, 0), mat('#f3f5ed', .4, .08, '#b7f2ff', .35)); chestMark.position.set(0, 1.63, -.246); chestMark.scale.set(.65, 1.1, .32); hero.add(chestMark);
hero.scale.setScalar(1.05);

// Web line and current swing anchor.
const webMat = new THREE.LineBasicMaterial({ color: '#eaf7ff', transparent: true, opacity: .92 });
let webLine = null;
let tether = null;
let tetherLength = 0;
const anchorMarker = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#8de8ff' }));
anchorMarker.visible = false; scene.add(anchorMarker);

const tokens = [];
const tokenMat = new THREE.MeshStandardMaterial({ color: '#ffd36e', emissive: '#ff9e38', emissiveIntensity: 1.8, metalness: .3, roughness: .22 });
for (let i = 0; i < 12; i++) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.7, .075, 8, 20), tokenMat);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.28, 1), tokenMat); group.add(ring, core);
  group.position.set((Math.random() * 2 - 1) * 6.4, 5.5 + Math.random() * 8, -38 - i * 27 - Math.random() * 13);
  scene.add(group); tokens.push({ group, collected: false, phase: Math.random() * 6 });
}

const state = { running: false, paused: false, x: 0, y: 3.2, z: 0, vx: 0, vy: 0, vz: -14, score: 0, distance: 0, boost: 0, sound: true, swingHeld: false, steer: 0, elapsed: 0 };
const keys = new Set();
const $ = (s) => document.querySelector(s);
const hud = $('#hud'); const crosshair = $('#crosshair'); const startScreen = $('#start-screen'); const pauseScreen = $('#pause-screen');
let audioContext = null;
function tone(freq, duration = .12, type = 'sine', volume = .035) {
  if (!state.sound) return;
  try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain(); osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration); osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is an optional flourish. */ }
}
function showToast(text) { $('#toast-text').textContent = text; $('#toast').classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => $('#toast').classList.remove('show'), 1250); }
function startGame() {
  if (state.running && state.paused) { state.paused = false; pauseScreen.classList.add('hidden'); return; }
  state.running = true; state.paused = false; startScreen.classList.add('hidden'); pauseScreen.classList.add('hidden');
  hud.classList.add('active'); crosshair.classList.add('active'); $('#mobile-controls').classList.add('active');
  if (audioContext?.state === 'suspended') audioContext.resume();
}
function pauseGame() { if (!state.running || state.paused) return; state.paused = true; pauseScreen.classList.remove('hidden'); }
$('#play-button').addEventListener('click', startGame);
$('#resume-button').addEventListener('click', startGame);
$('#sound-button').addEventListener('click', () => { state.sound = !state.sound; $('#sound-button').innerHTML = `${state.sound ? '♫' : '♪'} <span>SOUND ${state.sound ? 'ON' : 'OFF'}</span>`; if (state.sound) tone(580, .1); });
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) event.preventDefault();
  if (key === 'escape' || key === 'p') { if (state.running && !state.paused) pauseGame(); else if (state.paused) startGame(); return; }
  keys.add(key);
  if (key === ' ' && !event.repeat) state.swingHeld = true;
  if (key === 'shift' && !event.repeat) { state.boost = Math.max(state.boost, .9); tone(240, .18, 'sawtooth', .025); }
  if ((key === 'enter' || key === ' ') && !state.running) startGame();
});
window.addEventListener('keyup', (event) => { const key = event.key.toLowerCase(); keys.delete(key); if (key === ' ') state.swingHeld = false; });
window.addEventListener('blur', () => { keys.clear(); state.swingHeld = false; });
for (const button of document.querySelectorAll('.mobile-controls button')) {
  const key = button.dataset.key;
  const down = (e) => { e.preventDefault(); button.setPointerCapture?.(e.pointerId); if (key === 'space') state.swingHeld = true; else if (key === 'shift') state.boost = .9; else keys.add(key); };
  const up = (e) => { e.preventDefault(); if (key === 'space') state.swingHeld = false; else if (key !== 'shift') keys.delete(key); };
  button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
}

function findAnchor() {
  const side = state.x >= 0 ? -1 : 1;
  const x = side * (10 + Math.random() * 6);
  const z = state.z - (11 + Math.random() * 12);
  const y = 16 + Math.random() * 17;
  return new THREE.Vector3(x, y, z);
}
function attachWeb() {
  if (tether) return;
  tether = findAnchor();
  tetherLength = Math.max(9, new THREE.Vector3(state.x, state.y + 1, state.z).distanceTo(tether));
  webLine = new THREE.Line(new THREE.BufferGeometry(), webMat); scene.add(webLine);
  anchorMarker.position.copy(tether); anchorMarker.visible = true;
  tone(460, .08, 'triangle', .025);
}
function releaseWeb() { if (webLine) scene.remove(webLine); webLine = null; tether = null; anchorMarker.visible = false; }
function projectTether() {
  if (!tether) return;
  const p = new THREE.Vector3(state.x, state.y + 1, state.z), delta = p.clone().sub(tether), dist = delta.length();
  if (dist > tetherLength) {
    const direction = delta.multiplyScalar(1 / dist);
    p.copy(tether).addScaledVector(direction, tetherLength);
    state.x = p.x; state.y = p.y - 1; state.z = p.z;
    const radial = state.vx * direction.x + state.vy * direction.y + state.vz * direction.z;
    if (radial > 0) { state.vx -= radial * direction.x; state.vy -= radial * direction.y; state.vz -= radial * direction.z; }
    // Pump the swing gently along the travel direction so it feels responsive.
    state.vz -= .48;
  }
}

const clock = new THREE.Clock();
let lastDistance = 0;
function update(dt) {
  state.elapsed += dt;
  const steer = (keys.has('a') || keys.has('arrowleft') ? -1 : 0) + (keys.has('d') || keys.has('arrowright') ? 1 : 0);
  state.steer = steer;
  if (state.swingHeld && !tether) attachWeb();
  if (!state.swingHeld && tether) releaseWeb();
  const boostHeld = keys.has('shift') || state.boost > 0;
  state.boost = Math.max(0, state.boost - dt);
  const speedBonus = boostHeld ? 1.6 : 1;
  state.vx += steer * (tether ? 13 : 10) * dt;
  state.vx *= Math.pow(tether ? .985 : .91, dt * 60);
  state.vx = THREE.MathUtils.clamp(state.vx, -12, 12);
  state.vy -= 17 * dt;
  state.vz = THREE.MathUtils.clamp(state.vz - (boostHeld ? 10 : 2.2) * dt, -42, -8);
  if (tether) {
    // Pull toward the web anchor while retaining forward momentum.
    const toAnchor = new THREE.Vector3(tether.x - state.x, tether.y - (state.y + 1), tether.z - state.z).normalize();
    state.vx += toAnchor.x * 2.5 * dt; state.vy += toAnchor.y * 1.1 * dt;
    if (steer) state.vx += steer * 4 * dt;
  }
  state.x += state.vx * dt * speedBonus;
  state.y += state.vy * dt * speedBonus;
  state.z += state.vz * dt * speedBonus;
  if (tether) projectTether();
  state.x = THREE.MathUtils.clamp(state.x, -11.5, 11.5);
  if (state.y < 1.65) { state.y = 1.65; state.vy = Math.max(4.5, Math.abs(state.vy) * .28); if (tether) releaseWeb(); }
  if (state.y > 55) { state.y = 55; state.vy = Math.min(0, state.vy); }
  state.distance = Math.max(state.distance, Math.floor(-state.z));
  hero.position.set(state.x, state.y, state.z);
  hero.rotation.z = THREE.MathUtils.damp(hero.rotation.z, -state.vx * .035, 5, dt);
  hero.rotation.x = THREE.MathUtils.damp(hero.rotation.x, tether ? -.22 + state.vy * .012 : state.vy * .012, 3, dt);
  const run = state.elapsed * 9;
  const armSwing = tether ? Math.sin(run * .4) * .08 : Math.sin(run) * .31;
  placeLimb(leftArm, [-.31, 1.85, 0], [-.46 + armSwing, 1.3 + (tether ? .46 : 0), -.04]);
  placeLimb(rightArm, [.31, 1.85, 0], [.46 - armSwing, 1.3 + (tether ? .46 : 0), -.04]);
  placeLimb(leftLeg, [-.18, 1.02, 0], [-.25 + Math.sin(run) * .12, .12, -.16]);
  placeLimb(rightLeg, [.18, 1.02, 0], [.25 - Math.sin(run) * .12, .12, .12]);
  if (tether && webLine) {
    const origin = new THREE.Vector3(state.x, state.y + 1.78, state.z);
    webLine.geometry.dispose(); webLine.geometry = new THREE.BufferGeometry().setFromPoints([origin, tether]);
  }
  // Move the long city blocks around the player to create an endless avenue.
  for (const building of buildings) if (building.group.position.z > state.z + 32) building.group.position.z -= 475;
  for (const token of tokens) {
    if (token.collected) continue;
    token.group.rotation.y += dt * 1.5; token.group.rotation.x = Math.sin(state.elapsed * 1.4 + token.phase) * .12;
    token.group.position.y += Math.sin(state.elapsed * 2 + token.phase) * dt * .34;
    const dx = token.group.position.x - state.x, dy = token.group.position.y - (state.y + 1), dz = token.group.position.z - state.z;
    if (dx * dx + dy * dy + dz * dz < 5.2) {
      token.collected = true; token.group.visible = false; state.score++;
      $('#score').textContent = String(state.score).padStart(2, '0');
      showToast(state.score === 12 ? 'CITY COMPLETE — YOU OWN THE SKYLINE' : 'CITY TOKEN COLLECTED');
      tone(650 + state.score * 34, .2, 'sine', .045);
      if (state.score === 12) $('#objective-text').textContent = 'Skyline conquered — keep swinging!';
    }
  }
  camera.position.x = THREE.MathUtils.damp(camera.position.x, state.x * .48, 2.3, dt);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, state.y + 5.4, 2.1, dt);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, state.z + 12.8, 3.2, dt);
  const look = new THREE.Vector3(state.x * .34, state.y + 2.1, state.z - 13);
  camera.lookAt(look);
  $('#distance').textContent = String(state.distance).padStart(3, '0');
  const speed = Math.round(Math.abs(state.vz) * 4.1);
  $('#speed-value').textContent = `${speed} KM/H`;
  $('#speed-meter').style.width = `${Math.min(100, speed / 2.3)}%`;
  if (Math.floor(state.distance / 100) !== lastDistance) { lastDistance = Math.floor(state.distance / 100); $('#frame-rate').textContent = `WEBRUNNER — ${String(lastDistance + 1).padStart(3, '0')}`; }
}
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  if (state.running && !state.paused) update(dt);
  renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65)); });
