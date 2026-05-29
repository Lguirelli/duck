import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const MODEL_URL = './assets/models/duck.glb';
const canvas = document.getElementById('duckCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.01, 1000);

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
renderer.toneMappingExposure = 1.08;

scene.add(new THREE.AmbientLight(0xffffff, 1.45));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
keyLight.position.set(4, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.05);
fillLight.position.set(-5, 2.5, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

function createRubberNoiseTexture() {
  const size = 128;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;

  const ctx = textureCanvas.getContext('2d', { willReadFrequently: false });
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < image.data.length; i += 4) {
    const v = 120 + Math.random() * 22;
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  texture.needsUpdate = true;

  return texture;
}

const duckMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffd100,
  roughness: 0.82,
  metalness: 0,
  clearcoat: 0.06,
  clearcoatRoughness: 0.9,
  bumpMap: createRubberNoiseTexture(),
  bumpScale: 0.006,
  side: THREE.DoubleSide
});

const duck = new THREE.Group();
scene.add(duck);

let model = null;
let targetRotation = -Math.PI / 2;
let currentRotation = -Math.PI / 2;

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function updateScrollValues() {
  targetRotation = -Math.PI / 2 + getScrollProgress() * Math.PI * 2;
}

function prepareGeometry(geometry) {
  if (!geometry) return geometry;

  let prepared = geometry;

  try {
    prepared = mergeVertices(geometry, 0.0001);
  } catch (error) {
    prepared = geometry.clone();
  }

  prepared.deleteAttribute('normal');
  prepared.computeVertexNormals();
  prepared.computeBoundingBox();
  prepared.computeBoundingSphere();

  return prepared;
}

function centerAndScaleModel(object) {
  object.updateMatrixWorld(true);

  const initialBox = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  initialBox.getCenter(center);

  object.position.x -= center.x;
  object.position.y -= center.y;
  object.position.z -= center.z;
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = maxDimension > 0 ? 2.25 / maxDimension : 1;
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);
}

function frameDuck() {
  if (!model) return;

  duck.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(duck);
  const size = new THREE.Vector3();
  box.getSize(size);

  const aspect = window.innerWidth / window.innerHeight;
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);

  const distanceByHeight = size.y / (2 * Math.tan(verticalFov / 2));
  const distanceByWidth = size.x / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(distanceByHeight, distanceByWidth) * 1.55;

  camera.position.set(0, 0, Math.max(distance, 3.2));
  camera.near = 0.01;
  camera.far = Math.max(100, distance * 20);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    model.traverse((node) => {
      if (!node.isMesh) return;

      node.geometry = prepareGeometry(node.geometry);
      node.material = duckMaterial;
      node.castShadow = false;
      node.receiveShadow = false;
      node.frustumCulled = false;
    });

    model.rotation.set(0, 0, 0);

    duck.add(model);
    centerAndScaleModel(model);
    updateScrollValues();
    duck.rotation.y = targetRotation;
    currentRotation = targetRotation;
    frameDuck();
  },
  undefined,
  (error) => {
    console.error('Erro ao carregar duck.glb:', error);
  }
);

window.addEventListener('scroll', updateScrollValues, { passive: true });

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  frameDuck();
});

function animate() {
  requestAnimationFrame(animate);

  currentRotation += (targetRotation - currentRotation) * 0.075;
  duck.rotation.y = currentRotation;

  renderer.render(scene, camera);
}

updateScrollValues();
animate();
