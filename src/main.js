import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/OBJLoader.js';

const canvas = document.querySelector('#duckCanvas');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07090d, 0.035);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 9.2);

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
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const duckGroup = new THREE.Group();
scene.add(duckGroup);

const texture = createRubberTexture();
texture.colorSpace = THREE.SRGBColorSpace;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(7, 7);

const duckMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffd100,
  roughness: 0.78,
  metalness: 0,
  clearcoat: 0.16,
  clearcoatRoughness: 0.72,
  sheen: 0.28,
  sheenRoughness: 0.85,
  bumpMap: texture,
  bumpScale: 0.032
});

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x101014, 2.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
keyLight.position.set(-3.8, 5.4, 6.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffd100, 2.6);
rimLight.position.set(4, 3, -5);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0xffd100, 55, 12);
fillLight.position.set(0, -2.4, 4);
scene.add(fillLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(7, 96),
  new THREE.ShadowMaterial({ opacity: 0.18 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.05;
floor.receiveShadow = true;
scene.add(floor);

let duck = null;
let targetScroll = 0;
let currentScroll = 0;
let pointerX = 0;
let pointerY = 0;

const loader = new OBJLoader();
loader.load(
  './assets/models/duck.obj',
  (obj) => {
    duck = obj;

    duck.traverse((child) => {
      if (child.isMesh) {
        child.material = duckMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.computeVertexNormals();
      }
    });

    normalizeModel(duck, 4.2);
    duck.rotation.set(0, -0.55, 0);
    duckGroup.add(duck);
  },
  undefined,
  (error) => {
    console.error('Erro ao carregar o OBJ:', error);
  }
);

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', resize);
window.addEventListener('pointermove', updatePointer, { passive: true });

updateScrollProgress();
requestAnimationFrame(animate);

function animate() {
  requestAnimationFrame(animate);

  currentScroll += (targetScroll - currentScroll) * 0.075;

  const fullRotation = currentScroll * Math.PI * 2;
  const floatMotion = Math.sin(performance.now() * 0.0012) * 0.08;

  duckGroup.rotation.y = fullRotation + pointerX * 0.16;
  duckGroup.rotation.x = Math.sin(currentScroll * Math.PI) * 0.16 + pointerY * 0.08;
  duckGroup.rotation.z = Math.sin(currentScroll * Math.PI * 2) * 0.045;
  duckGroup.position.y = floatMotion;

  const viewportOffset = window.innerWidth < 760 ? 0 : 1.05;
  duckGroup.position.x = THREE.MathUtils.lerp(0, viewportOffset, Math.sin(currentScroll * Math.PI));

  camera.position.z = 9.2 - Math.sin(currentScroll * Math.PI) * 0.85;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
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

function normalizeModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxAxis;

  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));

  const normalizedBox = new THREE.Box3().setFromObject(model);
  const normalizedSize = new THREE.Vector3();
  normalizedBox.getSize(normalizedSize);
  model.position.y -= normalizedBox.min.y + normalizedSize.y * 0.5;
}

function createRubberTexture() {
  const size = 256;
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = size;
  canvasTexture.height = size;

  const ctx = canvasTexture.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = 124 + Math.random() * 32;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 1500; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 1.35 + 0.25;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#222222';
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvasTexture);
}
