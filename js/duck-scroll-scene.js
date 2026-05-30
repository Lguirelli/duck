import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";

const SELECTORS = {
  heroSection: "#hero",
  problemSection: "#problem",
  startAnchor: "#hero-duck-start",
  endAnchor: "#problem-duck-end",
  startTarget: "#hero-copy",
  endTarget: "#problem-copy"
};

const TUNING = {
  startAnchorOffset: { x: 0.52, y: 0.48 },
  endAnchorOffset: { x: 0.44, y: 0.56 },
  startTargetOffset: { x: 0.72, y: 0.28 },
  endTargetOffset: { x: 0.18, y: 0.34 },
  duckScale: 1.12,
  viewportMinScale: 0.62,
  viewportMaxScale: 1,
  floatX: 0.016,
  floatY: 0.028,
  floatSpeedX: 0.95,
  floatSpeedY: 1.35,
  startViewportWidth: 360,
  endViewportWidth: 280,
  startScrollInset: 0.1,
  endScrollInset: 0.82,
  modelColor: 0xffd84d,
  emissiveColor: 0xb88700,
  baseTiltX: 0.08,
  baseTiltZ: -0.05
};

let isInitialized = false;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getRectPoint(element, offsetX = 0.5, offsetY = 0.5) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width * offsetX,
    y: rect.top + rect.height * offsetY,
    rect
  };
}

function createDuckElement() {
  const existing = document.getElementById("duck-float");
  if (existing) return existing;

  const duck = document.createElement("div");
  duck.id = "duck-float";
  duck.setAttribute("aria-hidden", "true");
  duck.innerHTML = '<canvas id="duck-float-canvas"></canvas>';
  document.body.appendChild(duck);
  return duck;
}

function initDuckScene() {
  if (isInitialized) return;

  const heroSection = document.querySelector(SELECTORS.heroSection);
  const problemSection = document.querySelector(SELECTORS.problemSection);
  const startAnchor = document.querySelector(SELECTORS.startAnchor);
  const endAnchor = document.querySelector(SELECTORS.endAnchor);
  const startTarget = document.querySelector(SELECTORS.startTarget);
  const endTarget = document.querySelector(SELECTORS.endTarget);

  if (!heroSection || !problemSection || !startAnchor || !endAnchor || !startTarget || !endTarget) {
    return;
  }

  isInitialized = true;

  const duckElement = createDuckElement();
  const canvas = duckElement.querySelector("#duck-float-canvas");

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 8.6);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  const fillLight = new THREE.DirectionalLight(0xfff2b6, 1.4);
  const rimLight = new THREE.DirectionalLight(0xffd84d, 1.6);
  const bottomLight = new THREE.DirectionalLight(0xd19a00, 0.7);

  keyLight.position.set(4.5, 5, 8);
  fillLight.position.set(-5, 1.8, 4.6);
  rimLight.position.set(-2.5, 3.2, -2.8);
  bottomLight.position.set(0, -4, 3.2);

  scene.add(ambientLight, keyLight, fillLight, rimLight, bottomLight);

  const moveGroup = new THREE.Group();
  const aimGroup = new THREE.Group();
  const duckGroup = new THREE.Group();

  scene.add(moveGroup);
  moveGroup.add(aimGroup);
  aimGroup.add(duckGroup);

  const targetPoint = new THREE.Vector3();
  const loader = new GLTFLoader();
  const clock = new THREE.Clock();
  const modelUrl = new URL("../assets/models/duck.glb", import.meta.url).href;
  let ready = false;

  loader.load(
    modelUrl,
    (gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z) || 1;

      root.position.sub(center);
      root.scale.setScalar(TUNING.duckScale / maxSize);

      root.traverse((child) => {
        if (!child.isMesh) return;
        const material = new THREE.MeshStandardMaterial({
          color: TUNING.modelColor,
          emissive: TUNING.emissiveColor,
          emissiveIntensity: 0.22,
          roughness: 0.82,
          metalness: 0.03
        });
        child.material = material;
        child.castShadow = false;
        child.receiveShadow = false;
      });

      duckGroup.add(root);

      // O bico do pato aponta aproximadamente para +X no arquivo original.
      // Essa rotação alinha o bico com a direção de "lookAt" do grupo pai.
      duckGroup.rotation.set(TUNING.baseTiltX, Math.PI / 2, TUNING.baseTiltZ);
      ready = true;
    },
    undefined,
    (error) => {
      console.error("Falha ao carregar duck.glb:", error);
    }
  );

  function resizeRenderer() {
    const width = duckElement.clientWidth;
    const height = duckElement.clientHeight;

    if (width <= 0 || height <= 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function computeProgress() {
    const heroTop = window.scrollY + heroSection.getBoundingClientRect().top;
    const problemTop = window.scrollY + problemSection.getBoundingClientRect().top;
    const problemHeight = problemSection.offsetHeight;

    const start = heroTop - window.innerHeight * TUNING.startScrollInset;
    const end = problemTop + problemHeight * 0.12 - window.innerHeight * TUNING.endScrollInset;
    const raw = (window.scrollY - start) / Math.max(1, end - start);

    return easeInOutCubic(clamp(raw));
  }

  function updateDuckLayout() {
    const progress = computeProgress();

    const startPoint = getRectPoint(startAnchor, TUNING.startAnchorOffset.x, TUNING.startAnchorOffset.y);
    const endPoint = getRectPoint(endAnchor, TUNING.endAnchorOffset.x, TUNING.endAnchorOffset.y);
    const lookStart = getRectPoint(startTarget, TUNING.startTargetOffset.x, TUNING.startTargetOffset.y);
    const lookEnd = getRectPoint(endTarget, TUNING.endTargetOffset.x, TUNING.endTargetOffset.y);

    const x = lerp(startPoint.x, endPoint.x, progress);
    const y = lerp(startPoint.y, endPoint.y, progress);
    const width = lerp(TUNING.startViewportWidth, TUNING.endViewportWidth, progress);
    const height = width;

    duckElement.style.width = `${width}px`;
    duckElement.style.height = `${height}px`;
    duckElement.style.transform = `translate3d(${x - width * 0.5}px, ${y - height * 0.5}px, 0)`;

    resizeRenderer();

    targetPoint.set(
      lerp(lookStart.x, lookEnd.x, progress),
      lerp(lookStart.y, lookEnd.y, progress),
      0
    );

    duckElement.dataset.progress = String(progress);
  }

  function screenToWorld(x, y) {
    const bounds = canvas.getBoundingClientRect();
    const nx = ((x - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
    const ny = -(((y - bounds.top) / Math.max(1, bounds.height)) * 2 - 1);

    const vector = new THREE.Vector3(nx, ny, 0.12).unproject(camera);
    const direction = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / direction.z;

    return camera.position.clone().add(direction.multiplyScalar(distance));
  }

  function render() {
    requestAnimationFrame(render);

    if (!ready) return;

    updateDuckLayout();

    const time = clock.getElapsedTime();
    const progress = Number(duckElement.dataset.progress || 0);
    const viewportScale = clamp(window.innerWidth / 1440, TUNING.viewportMinScale, TUNING.viewportMaxScale);
    const worldTarget = screenToWorld(targetPoint.x, targetPoint.y);

    moveGroup.position.set(0, 0, 0);
    aimGroup.position.set(0, 0, 0);
    moveGroup.lookAt(worldTarget);

    moveGroup.rotation.z += lerp(-0.06, 0.08, progress);
    duckGroup.position.x = Math.cos(time * TUNING.floatSpeedX) * TUNING.floatX;
    duckGroup.position.y = Math.sin(time * TUNING.floatSpeedY) * TUNING.floatY;
    duckGroup.position.z = Math.sin(time * 0.85) * 0.02;

    const pulse = 1 + Math.sin(time * 1.2) * 0.012;
    duckGroup.scale.setScalar(viewportScale * pulse);

    renderer.render(scene, camera);
  }

  const resizeObserver = new ResizeObserver(() => updateDuckLayout());
  resizeObserver.observe(document.body);
  resizeObserver.observe(startAnchor);
  resizeObserver.observe(endAnchor);
  resizeObserver.observe(startTarget);
  resizeObserver.observe(endTarget);

  window.addEventListener("resize", updateDuckLayout, { passive: true });
  window.addEventListener("scroll", updateDuckLayout, { passive: true });
  window.addEventListener("load", updateDuckLayout, { passive: true });

  updateDuckLayout();
  render();
}

document.addEventListener("sectionsLoaded", initDuckScene);
