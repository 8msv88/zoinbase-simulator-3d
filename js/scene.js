import * as THREE from 'three';
import { getMonitorCanvas, setMonitorTexture } from './monitor.js';

let renderer, scene, camera, lookAt;
let camTheta = 0.05, camPhi = 1.12, camRadius = 2.35;
let matPhoneScr, matHalo, keyLight, halo, cityLight;
let phoneMeshes = [];
let haloPulse = 0;
let dragging = false, dragMoved = false, lastX = 0, lastY = 0, downX = 0, downY = 0;
let onPhoneClick = null;

export function initScene(canvas, phoneClickCb) {
  onPhoneClick = phoneClickCb;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06060a);
  scene.fog = new THREE.Fog(0x06060a, 8, 18);
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  lookAt = new THREE.Vector3(0, 1.28, -0.12);
  updateCamera();
  resize();
  addEventListener('resize', resize);
  buildRoom();
  setupControls(canvas);
  animate();
}

function updateCamera() {
  camera.position.set(
    lookAt.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta),
    lookAt.y + camRadius * Math.cos(camPhi),
    lookAt.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta)
  );
  camera.lookAt(lookAt);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function buildRoom() {
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.9 });
  const matWall = new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.95 });
  const matRug = new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.98 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.7 });
  const matBezel = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.4, metalness: 0.6 });
  const matKey = new THREE.MeshStandardMaterial({ color: 0x1a1c22, emissive: 0x3a5a9a, emissiveIntensity: 0.12, roughness: 0.5 });
  const matMug = new THREE.MeshStandardMaterial({ color: 0x4a2e1a, roughness: 0.6 });
  const matPhone = new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.35, metalness: 0.5 });
  matPhoneScr = new THREE.MeshStandardMaterial({ color: 0x0a1a0a, emissive: 0x1aff5a, emissiveIntensity: 0.35, roughness: 0.3 });
  matHalo = new THREE.MeshBasicMaterial({ color: 0x4f8cff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const matCeil = new THREE.MeshStandardMaterial({ color: 0x222830, emissive: 0x8899bb, emissiveIntensity: 0.4 });
  const matWindow = new THREE.MeshStandardMaterial({ color: 0x0a1020, emissive: 0x1a3a6a, emissiveIntensity: 0.25, roughness: 0.2 });

  const monCanvas = getMonitorCanvas();
  const monTex = new THREE.CanvasTexture(monCanvas);
  monTex.colorSpace = THREE.SRGBColorSpace;
  monTex.minFilter = THREE.LinearFilter;
  monTex.magFilter = THREE.LinearFilter;
  setMonitorTexture(monTex);
  // BasicMaterial = true colors, no lighting glare on the texture
  const matScreen = new THREE.MeshBasicMaterial({ map: monTex });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), matWall);
  backWall.position.set(0, 3, -4); scene.add(backWall);
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), matWall);
  sideWall.rotation.y = Math.PI / 2; sideWall.position.set(-4, 3, 0); scene.add(sideWall);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), matWindow);
  win.rotation.y = Math.PI / 2; win.position.set(-3.98, 2.2, 0.5); scene.add(win);
  cityLight = new THREE.PointLight(0x4a7fff, 0.25, 6, 2); cityLight.position.set(-3.5, 2.2, 0.5); scene.add(cityLight);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), matRug);
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.2, 0.005, 0.3); scene.add(rug);

  const deskGroup = new THREE.Group();
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), matWood);
  deskTop.position.y = 0.72; deskTop.castShadow = true; deskTop.receiveShadow = true; deskGroup.add(deskTop);
  [[-1.1,0.36,-0.45],[1.1,0.36,-0.45],[-1.1,0.36,0.45],[1.1,0.36,0.45]].forEach(([x,y,z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.07), matWood);
    leg.position.set(x,y,z); leg.castShadow = true; deskGroup.add(leg);
  });
  deskGroup.position.set(0, 0, 0.2); scene.add(deskGroup);

  const monGroup = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.8, 0.05), matBezel);
  bezel.position.y = 0.55; bezel.castShadow = true; monGroup.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.7), matScreen);
  screen.position.set(0, 0.55, 0.028); monGroup.add(screen);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 12), matBezel);
  stand.position.y = 0.1; monGroup.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.03, 24), matBezel);
  base.position.y = 0.015; monGroup.add(base);
  monGroup.position.set(0, 0.76, -0.12);
  monGroup.rotation.x = -0.04;
  scene.add(monGroup);

  const kbGroup = new THREE.Group();
  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.2), matBezel); kbGroup.add(kbBase);
  const keyGeo = new THREE.BoxGeometry(0.035, 0.012, 0.035);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const key = new THREE.Mesh(keyGeo, matKey.clone());
    key.position.set(-0.24 + c * 0.043, 0.018, -0.07 + r * 0.045); kbGroup.add(key);
  }
  kbGroup.position.set(0, 0.775, 0.32); scene.add(kbGroup);

  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 16), matMug);
  mug.position.set(0.8, 0.81, 0.2); mug.castShadow = true; scene.add(mug);

  const note = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.002, 0.12), new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.6 }));
  note.position.set(0.5, 0.765, 0.38); scene.add(note);

  const phoneGroup = new THREE.Group();
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.16), matPhone);
  phoneBody.castShadow = true; phoneGroup.add(phoneBody);
  const phoneScr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.13), matPhoneScr);
  phoneScr.rotation.x = -Math.PI / 2; phoneScr.position.y = 0.009; phoneGroup.add(phoneScr);
  phoneGroup.position.set(-0.6, 0.775, 0.28); phoneGroup.rotation.y = 0.25; scene.add(phoneGroup);
  halo = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 32), matHalo);
  halo.rotation.x = -Math.PI / 2; halo.position.set(-0.6, 0.762, 0.28); scene.add(halo);
  phoneMeshes = [phoneBody, phoneScr];

  scene.add(new THREE.AmbientLight(0x1a1e2a, 0.4));
  keyLight = new THREE.PointLight(0x6a9fff, 0.9, 10, 1.5);
  keyLight.position.set(0.5, 2.8, 1.5); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024); scene.add(keyLight);
  const rim = new THREE.PointLight(0xff8a40, 0.45, 8, 1.5); rim.position.set(-2.5, 2.2, -2); scene.add(rim);
  const screenGlow = new THREE.PointLight(0x2a6aff, 0.25, 2.5, 2); screenGlow.position.set(0, 1.3, 0.2); scene.add(screenGlow);
  const ceilStrip = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 0.15), matCeil);
  ceilStrip.position.set(0, 3.5, -1.5); scene.add(ceilStrip);
}

function setupControls(canvas) {
  canvas.addEventListener('pointerdown', e => {
    dragging = true; dragMoved = false; lastX = downX = e.clientX; lastY = downY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) dragMoved = true;
    camTheta -= (e.clientX - lastX) * 0.005;
    camPhi = Math.max(0.5, Math.min(1.45, camPhi + (e.clientY - lastY) * 0.005));
    lastX = e.clientX; lastY = e.clientY; updateCamera();
  });
  canvas.addEventListener('pointerup', e => {
    if (!dragging) return; dragging = false; canvas.releasePointerCapture(e.pointerId);
    if (!dragMoved && Math.abs(e.clientX - downX) < 4 && Math.abs(e.clientY - downY) < 4) {
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObjects(phoneMeshes).length && onPhoneClick) onPhoneClick();
    }
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    camRadius = Math.max(1.5, Math.min(5.5, camRadius + e.deltaY * 0.003));
    updateCamera();
  }, { passive: false });
}

export function pulseHalo() { haloPulse = 1.5; }

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (keyLight) keyLight.position.x = 0.5 + Math.sin(t * 0.35) * 0.35;
  if (cityLight) cityLight.intensity = 0.2 + Math.sin(t * 0.6) * 0.08;
  if (matPhoneScr) matPhoneScr.emissiveIntensity = 0.25 + Math.sin(t * 4) * 0.12;
  if (halo && matHalo) {
    if (haloPulse > 0) {
      haloPulse -= 0.04;
      const p = Math.max(0, haloPulse);
      halo.scale.setScalar(1 + p * 0.8);
      matHalo.opacity = 0.2 + p * 0.6;
    } else {
      const b = 1 + Math.sin(t * 1.8) * 0.08;
      halo.scale.setScalar(b);
      matHalo.opacity = 0.25 + Math.sin(t * 1.8) * 0.1;
    }
  }
  renderer.render(scene, camera);
}
