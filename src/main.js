import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = './assets/models/duck.glb';
const canvas = document.getElementById('duckCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0.08, 4.4);

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
renderer.toneMappingExposure = 1.1;

const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
fillLight.position.set(-3, 2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0, 2, -4);
scene.add(rimLight);

const duckMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd100,
  roughness: 0.62,
  metalness: 0
});

const duck = new THREE.Group();
scene.add(duck);

let targetRotation = 0;
let currentRotation = 0;
let modelLoaded = false;

const loader = new GLTFLoader();
loader.load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene;

    model.traverse((node) => {
      if (!node.isMesh) return;
      if (node.geometry) {
        node.geometry.computeVertexNormals();
        node.geometry.computeBoundingBox();
        node.geometry.computeBoundingSphere();
      }
      node.material = duckMaterial;
      node.castShadow = false;
      node.receiveShadow = false;
      node.frustumCulled = false;
    });

    // Centralizar modelo
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    // Escalar
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.45 / maxDim : 1;
    model.scale.setScalar(scale);

    // Corrigir rotação inicial (posição correta)
    model.rotation.x = Math.PI / 2; // gira para ficar de pé corretamente
    model.rotation.y = 0;
    model.rotation.z = 0;

    duck.add(model);
    modelLoaded = true;
  },
  undefined,
  (error) => {
    console.error('Erro ao carregar o modelo GLB:', error);
  }
);

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

function updateScrollValues() {
  const progress = getScrollProgress();
  targetRotation = progress * Math.PI * 2; // gira 360º durante o scroll
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

  // interpolação suave
  currentRotation += (targetRotation - currentRotation) * 0.075;
  duck.rotation.y = currentRotation;

  renderer.render(scene, camera);
}

animate();
