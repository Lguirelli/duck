import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = './assets/models/duck.glb';
const canvas = document.getElementById('duckCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);

camera.position.set(0, 0.1, 5.2);

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

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x171717, 1.75);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
keyLight.position.set(4, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
fillLight.position.set(-4, 2.5, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

function createRubberBumpTexture() {
  const size = 256;
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = size;
  canvasTexture.height = size;

  const ctx = canvasTexture.getContext('2d', { willReadFrequently: true });
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const fine = Math.random() * 18;
      const soft = Math.sin(x * 0.08) * 4 + Math.cos(y * 0.07) * 4;
      const value = 128 + fine + soft;

      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;

  return texture;
}

const rubberBump = createRubberBumpTexture();

const duckMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffd100,
  roughness: 0.78,
  metalness: 0,
  clearcoat: 0.18,
  clearcoatRoughness: 0.72,
  sheen: 0.35,
  sheenRoughness: 0.85,
  bumpMap: rubberBump,
  bumpScale: 0.018
});

duckMaterial.flatShading = false;

duckMaterial.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `
      float rubberNoise = fract(sin(dot(vViewPosition.xy, vec2(12.9898,78.233))) * 43758.5453);
      gl_FragColor.rgb *= 0.985 + rubberNoise * 0.03;
      #include <dithering_fragment>
    `
  );
};

const duck = new THREE.Group();
scene.add(duck);

let targetRotation = 0;
let currentRotation = 0;
let targetFloat = 0;
let modelLoaded = false;

const loader = new GLTFLoader();

loader.load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene;

    model.traverse((node) => {
      if (!node.isMesh) return;

      const geometry = node.geometry;

      if (geometry) {
        geometry.deleteAttribute('normal');
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
      }

      node.material = duckMaterial;
      node.castShadow = false;
      node.receiveShadow = false;
      node.frustumCulled = true;
    });

    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    model.position.sub(center);

    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = maxDimension > 0 ? 2.35 / maxDimension : 1;
    model.scale.setScalar(scale);

    model.rotation.set(0, 0, 0);

    duck.add(model);
    modelLoaded = true;
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
}

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);

  currentRotation += (targetRotation - currentRotation) * 0.08;
  duck.rotation.y = currentRotation;
  duck.position.y += (targetFloat - duck.position.y) * 0.055;

  if (!modelLoaded) {
    duck.rotation.y = 0;
  }

  renderer.render(scene, camera);
}

animate();
