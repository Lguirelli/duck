import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";

const DUCK = {
  modelUrl: new URL("../assets/models/duck.glb", import.meta.url).href,
  color: 0xffd84d,
  emissive: 0xd59600,
  startAnchor: "#duck-start-anchor",
  endAnchor: "#duck-end-anchor",
  startTarget: "#hero-copy",
  endTarget: "#problem-copy",
  heroSection: "#hero",
  problemSection: "#problem",
  startSize: 330,
  endSize: 260,
  startAnchorPoint: { x: 0.48, y: 0.5 },
  endAnchorPoint: { x: 0.5, y: 0.52 },
  startTargetPoint: { x: 0.72, y: 0.34 },
  endTargetPoint: { x: 0.18, y: 0.35 },
  normalizedModelSize: 2.55,
  baseRotationX: -0.34,
  baseRotationY: 0.2,
  baseRotationZ: 0,
  beakAngleOffset: 0
};

let initialized = false;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function pointFromElement(element, point) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width * point.x,
    y: rect.top + rect.height * point.y
  };
}

function makeDuckShell() {
  let shell = document.getElementById("duck-3d-float");

  if (!shell) {
    shell = document.createElement("div");
    shell.id = "duck-3d-float";
    shell.setAttribute("aria-hidden", "true");
    shell.innerHTML = '<canvas id="duck-3d-canvas"></canvas>';
    document.body.appendChild(shell);
  }

  return shell;
}

function initDuck() {
  if (initialized) return;

  const startAnchor = document.querySelector(DUCK.startAnchor);
  const endAnchor = document.querySelector(DUCK.endAnchor);
  const startTarget = document.querySelector(DUCK.startTarget);
  const endTarget = document.querySelector(DUCK.endTarget);
  const heroSection = document.querySelector(DUCK.heroSection);
  const problemSection = document.querySelector(DUCK.problemSection);

  if (!startAnchor || !endAnchor || !startTarget || !endTarget || !heroSection || !problemSection) {
    return;
  }

  initialized = true;

  const shell = makeDuckShell();
  const canvas = shell.querySelector("#duck-3d-canvas");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.15, 2.15, 2.15, -2.15, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  const modelHolder = new THREE.Group();
  scene.add(group);
  group.add(modelHolder);

  scene.add(new THREE.AmbientLight(0xffffff, 1.9));

  const key = new THREE.DirectionalLight(0xffffff, 2.35);
  key.position.set(4, 6, 8);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffec9a, 1.2);
  fill.position.set(-5, 2, 5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffd84d, 1.4);
  rim.position.set(-4, 4, -4);
  scene.add(rim);

  let loaded = false;
  let layout = {
    progress: 0,
    center: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    angle: 0
  };

  new GLTFLoader().load(
    DUCK.modelUrl,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;

      model.position.sub(center);
      model.scale.setScalar(DUCK.normalizedModelSize / maxDimension);

      model.traverse((child) => {
        if (!child.isMesh) return;

        child.material = new THREE.MeshStandardMaterial({
          color: DUCK.color,
          emissive: DUCK.emissive,
          emissiveIntensity: 0.16,
          roughness: 0.62,
          metalness: 0.02
        });
      });

      modelHolder.add(model);
      modelHolder.rotation.set(DUCK.baseRotationX, DUCK.baseRotationY, DUCK.baseRotationZ);
      loaded = true;
      shell.classList.add("is-loaded");
    },
    undefined,
    (error) => {
      console.error("duck.glb não carregou:", error);
      shell.classList.add("is-error");
    }
  );

  function progress() {
    const heroTop = window.scrollY + heroSection.getBoundingClientRect().top;
    const problemTop = window.scrollY + problemSection.getBoundingClientRect().top;
    const start = heroTop - window.innerHeight * 0.08;
    const end = problemTop - window.innerHeight * 0.7;
    return ease(clamp((window.scrollY - start) / Math.max(1, end - start)));
  }

  function updateLayout() {
    const t = progress();

    const start = pointFromElement(startAnchor, DUCK.startAnchorPoint);
    const end = pointFromElement(endAnchor, DUCK.endAnchorPoint);
    const targetStart = pointFromElement(startTarget, DUCK.startTargetPoint);
    const targetEnd = pointFromElement(endTarget, DUCK.endTargetPoint);

    const center = {
      x: lerp(start.x, end.x, t),
      y: lerp(start.y, end.y, t)
    };

    const target = {
      x: lerp(targetStart.x, targetEnd.x, t),
      y: lerp(targetStart.y, targetEnd.y, t)
    };

    const size = lerp(DUCK.startSize, DUCK.endSize, t) * clamp(window.innerWidth / 1280, 0.72, 1);
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    const angle = Math.atan2(-dy, dx) + DUCK.beakAngleOffset;

    shell.style.width = `${size}px`;
    shell.style.height = `${size}px`;
    shell.style.transform = `translate3d(${center.x - size / 2}px, ${center.y - size / 2}px, 0)`;

    const w = Math.max(1, Math.round(shell.clientWidth));
    const h = Math.max(1, Math.round(shell.clientHeight));
    renderer.setSize(w, h, false);

    layout = { progress: t, center, target, angle };
  }

  function animate() {
    requestAnimationFrame(animate);

    updateLayout();

    if (!loaded) return;

    const time = performance.now() * 0.001;
    const floatX = Math.cos(time * 0.9) * 0.035;
    const floatY = Math.sin(time * 1.25) * 0.05;
    const floatZ = Math.sin(time * 0.8) * 0.025;

    group.rotation.z = layout.angle;
    modelHolder.rotation.x = DUCK.baseRotationX + Math.sin(time * 1.1) * 0.035;
    modelHolder.rotation.y = DUCK.baseRotationY + Math.cos(time * 0.9) * 0.04;
    modelHolder.position.set(floatX, floatY, floatZ);

    renderer.render(scene, camera);
  }

  updateLayout();
  animate();

  window.addEventListener("scroll", updateLayout, { passive: true });
  window.addEventListener("resize", updateLayout, { passive: true });
  window.addEventListener("load", updateLayout, { passive: true });
}

document.addEventListener("sectionsLoaded", initDuck);
