const DUCK_3D = {
  modelUrl: new URL("../assets/models/duck.glb", import.meta.url).href,
  modelViewerUrl: "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js",
  threeUrl: "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
  gltfLoaderUrl: "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js",
  hero: "#hero",
  problem: "#problem",
  startAnchor: "#hero-duck-anchor",
  endAnchor: "#problem-card",
  startText: "#hero-copy",
  endText: "#problem-copy"
};

let duck3DStarted = false;

function duckClamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function duckLerp(a, b, t) {
  return a + (b - a) * t;
}

function duckEase(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function duckRectPoint(element, x = 0.5, y = 0.5) {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width * x,
    y: rect.top + rect.height * y,
    width: rect.width,
    height: rect.height
  };
}

function duckGetRequiredElements() {
  const elements = {
    hero: document.querySelector(DUCK_3D.hero),
    problem: document.querySelector(DUCK_3D.problem),
    startAnchor: document.querySelector(DUCK_3D.startAnchor),
    endAnchor: document.querySelector(DUCK_3D.endAnchor),
    startText: document.querySelector(DUCK_3D.startText),
    endText: document.querySelector(DUCK_3D.endText)
  };

  return Object.values(elements).every(Boolean) ? elements : null;
}

function duckGetProgress(elements) {
  const heroTop = window.scrollY + elements.hero.getBoundingClientRect().top;
  const problemTop = window.scrollY + elements.problem.getBoundingClientRect().top;
  const problemHeight = elements.problem.offsetHeight || 1;

  const startScroll = heroTop - window.innerHeight * 0.1;
  const endScroll = problemTop + problemHeight * 0.18 - window.innerHeight * 0.72;
  const raw = (window.scrollY - startScroll) / Math.max(1, endScroll - startScroll);

  return duckEase(duckClamp(raw));
}

function duckGetMotion(elements) {
  const progress = duckGetProgress(elements);
  const start = duckRectPoint(elements.startAnchor, 0.5, 0.52);
  const end = duckRectPoint(elements.endAnchor, 0.5, 0.48);
  const startText = duckRectPoint(elements.startText, 0.78, 0.36);
  const endText = duckRectPoint(elements.endText, 0.24, 0.36);

  const x = duckLerp(start.x, end.x, progress);
  const y = duckLerp(start.y, end.y, progress);
  const targetX = duckLerp(startText.x, endText.x, progress);
  const targetY = duckLerp(startText.y, endText.y, progress);

  const directionX = targetX - x;
  const directionY = targetY - y;
  const angle = Math.atan2(directionY, directionX) * 180 / Math.PI;
  const width = duckClamp(window.innerWidth * 0.34, 260, 500);
  const scale = duckLerp(1, 0.82, progress);
  const yaw = duckLerp(62, 242, progress);
  const pitch = duckLerp(70, 76, progress);
  const orbitDistance = duckLerp(58, 48, progress);

  return {
    progress,
    x,
    y,
    width,
    scale,
    angle,
    yaw,
    pitch,
    orbitDistance
  };
}

function duckCreateLayer() {
  let layer = document.getElementById("duck-3d-layer");

  if (!layer) {
    layer = document.createElement("div");
    layer.id = "duck-3d-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }

  return layer;
}

function duckSetVisibleState(element, isReady) {
  element.classList.toggle("is-loaded", isReady);
}

async function duckInitModelViewer(elements) {
  await import(DUCK_3D.modelViewerUrl);

  const layer = duckCreateLayer();
  layer.innerHTML = "";
  layer.classList.add("is-model-viewer");

  const viewer = document.createElement("model-viewer");
  viewer.id = "duck-3d-model";
  viewer.src = DUCK_3D.modelUrl;
  viewer.alt = "Modelo 3D";
  viewer.setAttribute("reveal", "auto");
  viewer.setAttribute("loading", "eager");
  viewer.setAttribute("interaction-prompt", "none");
  viewer.setAttribute("disable-zoom", "");
  viewer.setAttribute("camera-controls", "false");
  viewer.setAttribute("touch-action", "none");
  viewer.setAttribute("ar", "false");
  viewer.setAttribute("shadow-intensity", "0.7");
  viewer.setAttribute("shadow-softness", "1");
  viewer.setAttribute("exposure", "1.35");
  viewer.setAttribute("environment-image", "neutral");

  layer.appendChild(viewer);

  viewer.addEventListener("load", () => {
    duckSetVisibleState(viewer, true);
    update();
  });

  viewer.addEventListener("error", () => {
    duckInitThreeFallback(elements);
  }, { once: true });

  function update() {
    const motion = duckGetMotion(elements);
    const floatY = Math.sin(performance.now() * 0.0012) * 8;
    const floatX = Math.cos(performance.now() * 0.0009) * 5;

    viewer.style.width = `${motion.width}px`;
    viewer.style.height = `${motion.width}px`;
    viewer.style.transform = `translate3d(${motion.x - motion.width / 2 + floatX}px, ${motion.y - motion.width / 2 + floatY}px, 0) scale(${motion.scale})`;
    viewer.setAttribute("camera-orbit", `${motion.yaw}deg ${motion.pitch}deg ${motion.orbitDistance}%`);
    viewer.setAttribute("field-of-view", `${duckLerp(26, 22, motion.progress)}deg`);

    requestAnimationFrame(update);
  }

  update();
}

async function duckInitThreeFallback(elements) {
  const layer = duckCreateLayer();
  layer.innerHTML = "";
  layer.classList.remove("is-model-viewer");
  layer.classList.add("is-three-fallback");

  const canvas = document.createElement("canvas");
  canvas.id = "duck-3d-canvas";
  layer.appendChild(canvas);

  const THREE = await import(DUCK_3D.threeUrl);
  const { GLTFLoader } = await import(DUCK_3D.gltfLoaderUrl);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.7;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.8));

  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(5, 5, 8);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffd84d, 2.2);
  fill.position.set(-6, 2, 5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x7aa2ff, 2.8);
  rim.position.set(-4, 5, -3);
  scene.add(rim);

  const root = new THREE.Group();
  const modelPivot = new THREE.Group();
  scene.add(root);
  root.add(modelPivot);

  let modelLoaded = false;
  const loader = new GLTFLoader();

  loader.load(
    DUCK_3D.modelUrl,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);
      model.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(2.15 / maxDimension);

      model.traverse((child) => {
        if (!child.isMesh) return;

        child.frustumCulled = false;

        if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.transparent = false;
          child.material.opacity = 1;
          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.material.needsUpdate = true;

          if (child.material.emissive) {
            child.material.emissive.setHex(0x1a1a1a);
            child.material.emissiveIntensity = 0.35;
          }
        }
      });

      modelPivot.add(model);
      modelLoaded = true;
    },
    undefined,
    () => {
      const geometry = new THREE.SphereGeometry(0.9, 32, 16);
      const material = new THREE.MeshStandardMaterial({ color: 0xffd84d, roughness: 0.52, metalness: 0.08 });
      const mesh = new THREE.Mesh(geometry, material);
      modelPivot.add(mesh);
      modelLoaded = true;
    }
  );

  function screenToWorld(x, y) {
    const vector = new THREE.Vector3(
      x / window.innerWidth * 2 - 1,
      -(y / window.innerHeight) * 2 + 1,
      0
    );

    vector.unproject(camera);
    const direction = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / direction.z;

    return camera.position.clone().add(direction.multiplyScalar(distance));
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function update() {
    if (modelLoaded) {
      const motion = duckGetMotion(elements);
      const pos = screenToWorld(motion.x, motion.y);
      const targetX = duckLerp(duckRectPoint(elements.startText, 0.78, 0.36).x, duckRectPoint(elements.endText, 0.24, 0.36).x, motion.progress);
      const targetY = duckLerp(duckRectPoint(elements.startText, 0.78, 0.36).y, duckRectPoint(elements.endText, 0.24, 0.36).y, motion.progress);
      const target = screenToWorld(targetX, targetY);
      const time = performance.now() * 0.001;

      root.position.copy(pos);
      root.position.x += Math.cos(time * 0.9) * 0.035;
      root.position.y += Math.sin(time * 1.2) * 0.05;
      root.lookAt(target);

      modelPivot.rotation.x = 0.15 + Math.sin(time) * 0.03;
      modelPivot.rotation.y = duckLerp(0.75, -0.85, motion.progress);
      modelPivot.rotation.z = duckLerp(-0.18, 0.18, motion.progress);
      modelPivot.scale.setScalar(duckLerp(1.15, 0.92, motion.progress));
    }

    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }

  resize();
  update();
  window.addEventListener("resize", resize, { passive: true });
}

function duckStart3D() {
  if (duck3DStarted) return;

  const elements = duckGetRequiredElements();
  if (!elements) return;

  duck3DStarted = true;

  duckInitModelViewer(elements).catch(() => {
    duckInitThreeFallback(elements).catch((error) => {
      console.error("Não foi possível iniciar o modelo 3D.", error);
    });
  });
}

document.addEventListener("sectionsLoaded", duckStart3D);

if (document.readyState === "complete" || document.readyState === "interactive") {
  window.setTimeout(duckStart3D, 250);
}
