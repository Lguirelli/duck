import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = './assets/models/duck.glb';
const canvas = document.getElementById('duckCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0, 4.8);
camera.lookAt(0, 0, 0);

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

scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 1.7));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
keyLight.position.set(4, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-4, 2, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

function createRubberBumpTexture() {
  const size = 256;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;

  const ctx = textureCanvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const data = image.data;

  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const grain = random() * 22;
      const softWave = Math.sin(x * 0.06) * 4 + Math.cos(y * 0.055) * 4;
      const value = Math.max(0, Math.min(255, 128 + grain + softWave));

      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

const duckMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffd100,
  roughness: 0.76,
  metalness: 0,
  clearcoat: 0.12,
  clearcoatRoughness: 0.8,
  bumpMap: createRubberBumpTexture(),
  bumpScale: 0.012
});

duckMaterial.flatShading = false;

const duck = new THREE.Group();
scene.add(duck);

let targetRotation = 0;
let currentRotation = 0;
let targetFloat = 0;
let model = null;

function centerAndFitObject(object) {
  object.updateMatrixWorld(true);

  const firstBox = new THREE.Box3().setFromObject(object);
  const firstCenter = firstBox.getCenter(new THREE.Vector3());
  object.position.sub(firstCenter);
  object.updateMatrixWorld(true);

  const secondBox = new THREE.Box3().setFromObject(object);
  const size = secondBox.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);

  const targetSize = window.innerWidth < 760 ? 1.55 : 2.05;
  const scale = maxDimension > 0 ? targetSize / maxDimension : 1;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(object);
  const finalCenter = finalBox.getCenter(new THREE.Vector3());
  object.position.sub(finalCenter);
  object.updateMatrixWorld(true);
}

const loader = new GLTFLoader();

loader.load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    model.traverse((node) => {
      if (!node.isMesh) return;

      if (node.geometry) {
        node.geometry.deleteAttribute('normal');
        node.geometry.computeVertexNormals();
        node.geometry.computeBoundingBox();
        node.geometry.computeBoundingSphere();
      }

      node.material = duckMaterial;
      node.castShadow = false;
      node.receiveShadow = false;
      node.frustumCulled = true;
    });

    model.rotation.set(0, 0, 0);
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    duck.add(model);
    centerAndFitObject(model);
    updateScrollValues();
  },
  undefined,
  (error) => {
    console.error('Erro ao carregar o duck.glb:', error);
  }
);

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

function updateScrollValues() {
  const progress = getScrollProgress();
  targetRotation = progress * Math.PI * 2;
  targetFloat = Math.sin(progress * Math.PI * 2) * 0.035;
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

  if (model) {
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    centerAndFitObject(model);
  }
}

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);

  currentRotation += (targetRotation - currentRotation) * 0.08;
  duck.rotation.y = currentRotation;
  duck.position.y += (targetFloat - duck.position.y) * 0.055;

  renderer.render(scene, camera);
}

animate();
