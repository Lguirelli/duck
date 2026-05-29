import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SubdivisionModifier } from 'three/examples/jsm/modifiers/SubdivisionModifier.js';

const MODEL_URL = './assets/models/duck_original.glb'; // seu GLB original
const canvas = document.getElementById('duckCanvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 0.01, 100);
camera.position.set(0, 0.08, 4.4);

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.5));

const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
fillLight.position.set(-3,2,3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0,2,-4);
scene.add(rimLight);

const duckMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd100,
    roughness: 0.7,
    metalness: 0
});

const duck = new THREE.Group();
scene.add(duck);

let targetRotation = 0;
let currentRotation = 0;
let modelLoaded = false;

const loader = new GLTFLoader();
loader.load(MODEL_URL, (gltf)=>{
    const model = gltf.scene;

    model.traverse((node)=>{
        if(!node.isMesh) return;

        // Aplica suavização de geometria
        const modifier = new SubdivisionModifier(1); // 1-2 níveis para suavizar
        node.geometry = modifier.modify(node.geometry);

        node.material = duckMaterial;
        node.castShadow = false;
        node.receiveShadow = false;
        node.frustumCulled = false;
    });

    // Centralizar
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    // Escala
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.45 / maxDim : 1;
    model.scale.setScalar(scale);

    // Ajuste inicial de rotação
    model.rotation.x = Math.PI/2;
    model.rotation.y = 0;
    model.rotation.z = 0;

    duck.add(model);
    modelLoaded = true;
}, undefined, (err)=>console.error(err));

function getScrollProgress(){
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll>0 ? window.scrollY / maxScroll : 0;
}

function updateScrollValues(){
    targetRotation = getScrollProgress()*Math.PI*2; // 360º
}

window.addEventListener('scroll', updateScrollValues, {passive:true});
updateScrollValues();

function resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
}
window.addEventListener('resize', resize);

function animate(){
    requestAnimationFrame(animate);
    currentRotation += (targetRotation - currentRotation)*0.075;
    duck.rotation.y = currentRotation;
    renderer.render(scene, camera);
}

animate();
