import * as THREE from 'three';

const canvas = document.querySelector('#duck-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.05, 7.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const duck = new THREE.Group();
scene.add(duck);

const yellowMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd100,
  roughness: 0.48,
  metalness: 0,
  emissive: 0x3a2700,
  emissiveIntensity: 0.08
});

const shadowMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.28,
  depthWrite: false
});

function createSphere(name, position, scale, geometry = new THREE.SphereGeometry(1, 48, 32)) {
  const mesh = new THREE.Mesh(geometry, yellowMaterial);
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.scale.set(scale.x, scale.y, scale.z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  duck.add(mesh);
  return mesh;
}

const body = createSphere(
  'body',
  { x: 0, y: -0.45, z: 0 },
  { x: 2.35, y: 1.05, z: 1.05 }
);

const chest = createSphere(
  'chest',
  { x: 1.2, y: -0.1, z: 0 },
  { x: 1.1, y: 0.92, z: 0.98 }
);

const head = createSphere(
  'head',
  { x: 0.75, y: 1.12, z: 0 },
  { x: 0.78, y: 0.78, z: 0.78 }
);

const neck = createSphere(
  'neck',
  { x: 0.55, y: 0.48, z: 0 },
  { x: 0.48, y: 0.58, z: 0.52 }
);

const beak = createSphere(
  'beak',
  { x: 1.56, y: 1.05, z: 0 },
  { x: 0.72, y: 0.24, z: 0.34 },
  new THREE.SphereGeometry(1, 40, 20)
);

const tail = createSphere(
  'tail',
  { x: -1.76, y: 0.02, z: 0 },
  { x: 0.55, y: 0.88, z: 0.58 },
  new THREE.SphereGeometry(1, 36, 20)
);
tail.rotation.z = -0.55;

const base = new THREE.Mesh(
  new THREE.CircleGeometry(1.7, 48),
  shadowMaterial
);
base.position.set(0.05, -1.55, -0.08);
base.rotation.x = -Math.PI / 2;
base.scale.set(1.55, 0.42, 1);
scene.add(base);

const ambient = new THREE.HemisphereLight(0xffffff, 0x111827, 2.25);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 4.2);
key.position.set(3.8, 4.8, 5.5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffd100, 1.15);
fill.position.set(-4, 1.5, 2);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 1.8);
rim.position.set(-2.5, 3, -4);
scene.add(rim);

duck.rotation.set(-0.08, -0.42, 0.03);
duck.scale.setScalar(1.08);

let targetScroll = 0;
let currentScroll = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return window.scrollY / maxScroll;
}

function updateScroll() {
  targetScroll = getScrollProgress();
}

window.addEventListener('scroll', updateScroll, { passive: true });
window.addEventListener('pointermove', (event) => {
  targetMouseX = (event.clientX / window.innerWidth - 0.5) * 0.24;
  targetMouseY = (event.clientY / window.innerHeight - 0.5) * 0.16;
}, { passive: true });

function resize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();
updateScroll();

function animate() {
  requestAnimationFrame(animate);

  currentScroll += (targetScroll - currentScroll) * 0.075;
  mouseX += (targetMouseX - mouseX) * 0.06;
  mouseY += (targetMouseY - mouseY) * 0.06;

  const fullRotation = currentScroll * Math.PI * 2.35;
  duck.rotation.y = -0.42 + fullRotation + mouseX;
  duck.rotation.x = -0.08 + Math.sin(currentScroll * Math.PI * 2) * 0.12 + mouseY;
  duck.rotation.z = 0.03 + Math.sin(currentScroll * Math.PI * 4) * 0.035;

  const pulse = 1.08 + Math.sin(performance.now() * 0.0018) * 0.015;
  duck.scale.setScalar(pulse);

  base.material.opacity = 0.2 + Math.sin(currentScroll * Math.PI) * 0.08;

  renderer.render(scene, camera);
}

animate();
