import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#duckCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0.05, 4.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.75);
fillLight.position.set(-4, 1.5, 3);
scene.add(fillLight);

const duckMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd100,
  roughness: 0.58,
  metalness: 0,
  envMapIntensity: 0.15
});

const duck = new THREE.Group();
scene.add(duck);

let loadedModel = null;
let targetRotation = 0;
let currentRotation = 0;

const loader = new GLTFLoader();
loader.load(
  './assets/models/duck.glb',
  (gltf) => {
    loadedModel = gltf.scene;

    loadedModel.traverse((node) => {
      if (!node.isMesh) return;
      node.material = duckMaterial;
      node.castShadow = false;
      node.receiveShadow = false;
      node.frustumCulled = true;
    });

    const box = new THREE.Box3().setFromObject(loadedModel);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    loadedModel.position.sub(center);

    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = maxDimension > 0 ? 2.25 / maxDimension : 1;
    loadedModel.scale.setScalar(scale);

    loadedModel.rotation.x = 0;
    loadedModel.rotation.y = 0;
    loadedModel.rotation.z = 0;

    duck.add(loadedModel);
  },
  undefined,
  (error) => {
    console.error('Erro ao carregar duck.glb:', error);
  }
);

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return window.scrollY / maxScroll;
}

function updateScrollRotation() {
  targetRotation = getScrollProgress() * Math.PI * 4;
}

window.addEventListener('scroll', updateScrollRotation, { passive: true });
updateScrollRotation();

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
}

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);

  currentRotation += (targetRotation - currentRotation) * 0.08;
  duck.rotation.y = currentRotation;

  renderer.render(scene, camera);
}

animate();
