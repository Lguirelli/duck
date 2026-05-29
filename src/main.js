import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const canvas = document.querySelector('#duckCanvas');
const statusEl = document.querySelector('#loaderStatus');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07090d, 0.025);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.45, 8.4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const duckGroup = new THREE.Group();
scene.add(duckGroup);

const rubberTexture = createRubberTexture();
rubberTexture.colorSpace = THREE.SRGBColorSpace;
rubberTexture.wrapS = THREE.RepeatWrapping;
rubberTexture.wrapT = THREE.RepeatWrapping;
rubberTexture.repeat.set(9, 9);

const duckMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffd100,
  roughness: 0.82,
  metalness: 0,
  clearcoat: 0.12,
  clearcoatRoughness: 0.8,
  sheen: 0.25,
  sheenRoughness: 0.85,
  bumpMap: rubberTexture,
  bumpScale: 0.026
});

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x111318, 2.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
keyLight.position.set(-4.2, 5.8, 6.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffd100, 2.8);
rimLight.position.set(4, 3, -5);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0xffd100, 58, 13);
fillLight.position.set(0.5, -2.2, 4.4);
scene.add(fillLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(7, 96),
  new THREE.ShadowMaterial({ opacity: 0.22 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.05;
floor.receiveShadow = true;
scene.add(floor);

let targetScroll = 0;
let currentScroll = 0;
let pointerX = 0;
let pointerY = 0;
let modelLoaded = false;

const loader = new OBJLoader();
const modelUrl = new URL('../assets/models/duck.obj', import.meta.url).href;

loader.load(
  modelUrl,
  (obj) => {
    prepareImportedModel(obj);
    duckGroup.add(obj);
    modelLoaded = true;
    hideStatus();
  },
  (event) => {
    if (!event.total) return;
    const progress = Math.round((event.loaded / event.total) * 100);
    statusEl.textContent = `carregando pato 3D ${progress}%`;
  },
  (error) => {
    console.error('Erro ao carregar o OBJ:', error);
    statusEl.textContent = 'erro ao carregar OBJ, usando fallback 3D';
    statusEl.classList.add('is-error');
    const fallbackDuck = createFallbackDuck();
    duckGroup.add(fallbackDuck);
    modelLoaded = true;
    setTimeout(hideStatus, 1600);
  }
);

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', resize);
window.addEventListener('pointermove', updatePointer, { passive: true });

updateScrollProgress();
animate();

function animate() {
  requestAnimationFrame(animate);

  currentScroll += (targetScroll - currentScroll) * 0.075;

  const time = performance.now() * 0.001;
  const fullRotation = currentScroll * Math.PI * 2;
  const floatMotion = Math.sin(time * 1.2) * 0.08;

  duckGroup.rotation.y = fullRotation + pointerX * 0.16;
  duckGroup.rotation.x = Math.sin(currentScroll * Math.PI) * 0.16 + pointerY * 0.08;
  duckGroup.rotation.z = Math.sin(currentScroll * Math.PI * 2) * 0.045;
  duckGroup.position.y = floatMotion;

  const desktopOffset = window.innerWidth < 760 ? 0 : 1.72;
  duckGroup.position.x = THREE.MathUtils.lerp(0, desktopOffset, Math.sin(currentScroll * Math.PI));

  if (!modelLoaded) {
    duckGroup.rotation.y += time * 0.08;
  }

  camera.position.z = 8.4 - Math.sin(currentScroll * Math.PI) * 0.75;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function prepareImportedModel(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.material = duckMaterial;
    child.castShadow = true;
    child.receiveShadow = true;
    child.geometry.computeVertexNormals();
  });

  normalizeModel(model, 3.9);
  model.rotation.set(0, -0.55, 0);
}

function normalizeModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxAxis;

  model.position.set(-center.x, -center.y, -center.z);
  model.scale.setScalar(scale);

  const normalizedBox = new THREE.Box3().setFromObject(model);
  const normalizedCenter = new THREE.Vector3();
  normalizedBox.getCenter(normalizedCenter);
  model.position.x -= normalizedCenter.x;
  model.position.y -= normalizedCenter.y;
  model.position.z -= normalizedCenter.z;
}

function createFallbackDuck() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.45, 64, 64), duckMaterial);
  body.scale.set(1.45, 0.82, 0.92);
  body.position.set(-0.25, -0.35, 0);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.76, 64, 64), duckMaterial);
  head.position.set(0.75, 0.7, 0);

  const beak = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 48), duckMaterial);
  beak.scale.set(1.25, 0.42, 0.52);
  beak.position.set(1.42, 0.55, 0);

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 48), duckMaterial);
  tail.scale.set(0.6, 1, 0.7);
  tail.rotation.z = -0.75;
  tail.position.set(-1.85, 0.05, 0);

  [body, head, beak, tail].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  group.scale.setScalar(1.25);
  return group;
}

function createRubberTexture() {
  const size = 256;
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = size;
  canvasTexture.height = size;

  const ctx = canvasTexture.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = 126 + Math.random() * 32;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = 0.18;

  for (let i = 0; i < 1800; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 1.25 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#222222';
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvasTexture);
}

function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScroll = maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

function updatePointer(event) {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function hideStatus() {
  statusEl.classList.add('is-hidden');
}
