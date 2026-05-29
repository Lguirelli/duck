import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = './assets/models/duck.glb';
const canvas = document.getElementById('duckCanvas');

const BASE_MODEL_ROTATION = {
  x: Math.PI / 2,
  y: -Math.PI / 2,
  z: 0
};

const SCROLL_TURNS = 1;
const CAMERA_PADDING = 1.35;
const MODEL_VIEW_SIZE = 2.35;
const ROTATION_SMOOTHING = 0.075;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const ambientLight = new THREE.AmbientLight(0xffffff, 1.55);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
keyLight.position.set(3.8, 4.2, 5.5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.05);
fillLight.position.set(-4.5, 2.5, 3.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
rimLight.position.set(0, 2.8, -5);
scene.add(rimLight);

function createRubberBumpTexture() {
  const size = 128;
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = size;
  canvasTexture.height = size;

  const ctx = canvasTexture.getContext('2d');
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < image.data.length; i += 4) {
    const value = 118 + Math.random() * 22;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.needsUpdate = true;

  return texture;
}

const rubberBump = createRubberBumpTexture();

const duckMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffd100,
  roughness: 0.78,
  metalness: 0,
  clearcoat: 0.08,
  clearcoatRoughness: 0.88,
  bumpMap: rubberBump,
  bumpScale: 0.012
});

const duck = new THREE.Group();
scene.add(duck);

let targetRotation = 0;
let currentRotation = 0;
let fitted = false;

function smoothGeometry(geometry) {
  if (!geometry) return;

  geometry.deleteAttribute('normal');
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function frameObject(object) {
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  object.position.sub(center);
  object.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(object);
  centeredBox.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = maxDimension > 0 ? MODEL_VIEW_SIZE / maxDimension : 1;
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  const framedBox = new THREE.Box3().setFromObject(object);
  framedBox.getSize(size);

  const width = size.x;
  const height = size.y;
  const aspect = window.innerWidth / window.innerHeight;
  const fov = THREE.MathUtils.degToRad(camera.fov);

  const distanceByHeight = height / (2 * Math.tan(fov / 2));
  const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const distanceByWidth = width / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(distanceByHeight, distanceByWidth) * CAMERA_PADDING;

  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  fitted = true;
}

const loader = new GLTFLoader();

loader.load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene;

    model.traverse((node) => {
      if (!node.isMesh) return;

      smoothGeometry(node.geometry);
      node.material = duckMaterial;
      node.castShadow = false;
      node.receiveShadow = false;
      node.frustumCulled = false;
    });

    model.rotation.set(
      BASE_MODEL_ROTATION.x,
      BASE_MODEL_ROTATION.y,
      BASE_MODEL_ROTATION.z
    );

    duck.add(model);
    frameObject(duck);
  },
  undefined,
  (error) => {
    console.error('Erro ao carregar o duck.glb:', error);
  }
);

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function updateScrollValues() {
  const progress = getScrollProgress();
  targetRotation = progress * Math.PI * 2 * SCROLL_TURNS;
}

window.addEventListener('scroll', updateScrollValues, { passive: true });
updateScrollValues();

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  if (fitted) frameObject(duck);
}

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);

  currentRotation += (targetRotation - currentRotation) * ROTATION_SMOOTHING;
  duck.rotation.y = currentRotation;

  renderer.render(scene, camera);
}

animate();
