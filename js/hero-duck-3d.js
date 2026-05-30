import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";

const CONFIG = {
  modelPath: "assets/models/duck.glb",
  startSection: "#hero",
  endSection: "#problem",
  startAnchor: "#hero-duck-anchor",
  endAnchor: "#problem-card",
  startTarget: "#hero-copy",
  endTarget: "#problem-copy"
};

let initialized = false;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getRectPoint(element, x = 0.5, y = 0.5) {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width * x,
    y: rect.top + rect.height * y
  };
}

function lerpPoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function screenToWorld(x, y, camera) {
  const ndc = new THREE.Vector3(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1,
    0
  );

  ndc.unproject(camera);

  const direction = ndc.sub(camera.position).normalize();
  const distance = -camera.position.z / direction.z;

  return camera.position.clone().add(direction.multiplyScalar(distance));
}

function initHeroDuck3D() {
  if (initialized) return;

  const startSection = document.querySelector(CONFIG.startSection);
  const endSection = document.querySelector(CONFIG.endSection);
  const startAnchor = document.querySelector(CONFIG.startAnchor);
  const endAnchor = document.querySelector(CONFIG.endAnchor);
  const startTarget = document.querySelector(CONFIG.startTarget);
  const endTarget = document.querySelector(CONFIG.endTarget);

  if (!startSection || !endSection || !startAnchor || !endAnchor || !startTarget || !endTarget) {
    return;
  }

  initialized = true;

  const layer = document.createElement("div");
  layer.id = "duck-scroll-layer";

  const canvas = document.createElement("canvas");
  canvas.id = "duck-scroll-canvas";
  layer.appendChild(canvas);
  document.body.appendChild(layer);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  const rimLight = new THREE.DirectionalLight(0xffd84d, 1.4);

  keyLight.position.set(3.8, 5, 7.5);
  rimLight.position.set(-4, 1.2, 3.4);

  scene.add(ambientLight, keyLight, rimLight);

  const motionGroup = new THREE.Group();
  const lookGroup = new THREE.Group();
  const modelGroup = new THREE.Group();

  scene.add(motionGroup);
  motionGroup.add(lookGroup);
  lookGroup.add(modelGroup);

  const loader = new GLTFLoader();
  const clock = new THREE.Clock();
  let modelReady = false;

  loader.load(
    CONFIG.modelPath,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      model.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const normalizedScale = 1.55 / maxDimension;
      model.scale.setScalar(normalizedScale);

      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
      });

      modelGroup.add(model);
      modelGroup.rotation.set(0.08, Math.PI * 0.48, -0.08);
      modelReady = true;
    },
    undefined,
    (error) => {
      console.error("Erro ao carregar o modelo 3D:", error);
    }
  );

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
  }

  function getProgress() {
    const heroTop = window.scrollY + startSection.getBoundingClientRect().top;
    const problemTop = window.scrollY + endSection.getBoundingClientRect().top;
    const heroHeight = startSection.offsetHeight;
    const problemHeight = endSection.offsetHeight;

    const startScroll = heroTop - window.innerHeight * 0.12;
    const endScroll = problemTop + problemHeight * 0.18 - window.innerHeight * 0.78;
    const raw = (window.scrollY - startScroll) / Math.max(1, endScroll - startScroll);

    return easeInOut(clamp(raw));
  }

  function updateModel() {
    if (!modelReady) return;

    const progress = getProgress();
    const time = clock.getElapsedTime();

    const startPosition = getRectPoint(startAnchor, 0.5, 0.54);
    const endPosition = getRectPoint(endAnchor, 0.5, 0.5);
    const startLookAt = getRectPoint(startTarget, 0.78, 0.38);
    const endLookAt = getRectPoint(endTarget, 0.22, 0.36);

    const screenPosition = lerpPoint(startPosition, endPosition, progress);
    const screenLookAt = lerpPoint(startLookAt, endLookAt, progress);

    const worldPosition = screenToWorld(screenPosition.x, screenPosition.y, camera);
    const worldLookAt = screenToWorld(screenLookAt.x, screenLookAt.y, camera);

    const floatOffsetY = Math.sin(time * 1.45) * 0.06;
    const floatOffsetX = Math.cos(time * 0.95) * 0.04;
    const viewportScale = clamp(window.innerWidth / 1440, 0.72, 1.08);

    motionGroup.position.copy(worldPosition);
    motionGroup.position.x += floatOffsetX;
    motionGroup.position.y += floatOffsetY;
    motionGroup.lookAt(worldLookAt);

    lookGroup.rotation.x = 0.16 + Math.sin(time * 1.15) * 0.03;
    lookGroup.rotation.z = THREE.MathUtils.lerp(-0.18, 0.2, progress);
    lookGroup.scale.setScalar(viewportScale);
  }

  function render() {
    updateModel();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  resize();
  render();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", updateModel, { passive: true });
}

document.addEventListener("sectionsLoaded", initHeroDuck3D);
