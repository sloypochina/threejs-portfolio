import * as THREE from 'three';
import gsap from 'gsap';

// 1. СЦЕНА И ТУМАН
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x0a0c12);
scene.fog = new THREE.FogExp2(0x0a0c12, 0.035);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 18);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. СВЕТ
const ambientLight = new THREE.AmbientLight(0x2a354a, 1.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff7700, 3, 20);
pointLight.position.set(0, 2, 0);
scene.add(pointLight);

// 3. 3D ХОЛМЫ И МОНОЛИТ
const terrainGeo = new THREE.PlaneGeometry(120, 120, 50, 50);
terrainGeo.rotateX(-Math.PI / 2);

const pos = terrainGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2.5 + Math.sin(x * 0.05 + z * 0.05) * 3;
  pos.setY(i, y);
}
terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
  color: 0x121722,
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true
});

const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.position.y = -2;
scene.add(terrain);

const monolithGeo = new THREE.BoxGeometry(1.5, 6, 1.5);
const monolithMat = new THREE.MeshStandardMaterial({
  color: 0x050508,
  roughness: 0.2,
  metalness: 0.8
});
const monolith = new THREE.Mesh(monolithGeo, monolithMat);
monolith.position.set(0, 1, 0);
scene.add(monolith);

// ЧАСТИЦЫ (ПЕПЕЛ)
const particleCount = 400;
const particleGeo = new THREE.BufferGeometry();
const particleCoords = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  particleCoords[i] = (Math.random() - 0.5) * 40;
  particleCoords[i + 1] = Math.random() * 15;
  particleCoords[i + 2] = (Math.random() - 0.5) * 40;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.15,
  color: 0xffa500,
  transparent: true,
  opacity: 0.6
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// 4. НАВИГАЦИЯ (НАВЕШИВАЕМ КЛИКИ)
let currentState = 'home';

function navigateTo(page) {
  if (page === currentState) return;
  currentState = page;

  const homePage = document.querySelector('#page-home');
  const projectsPage = document.querySelector('#page-projects');

  if (page === 'projects') {
    homePage.classList.add('hidden');
    projectsPage.classList.remove('hidden');

    gsap.to(camera.position, { x: -8, y: 2, z: 8, duration: 2, ease: 'power3.inOut' });
    gsap.to(camera.rotation, { y: -0.6, duration: 2, ease: 'power3.inOut' });
  } else {
    projectsPage.classList.add('hidden');
    homePage.classList.remove('hidden');

    gsap.to(camera.position, { x: 0, y: 3, z: 18, duration: 2, ease: 'power3.inOut' });
    gsap.to(camera.rotation, { y: 0, duration: 2, ease: 'power3.inOut' });
  }
}

// Подключаем слушатели событий напрямую после загрузки
document.addEventListener('DOMContentLoaded', () => {
  const btnToProjects = document.getElementById('btn-to-projects');
  const btnToHome = document.getElementById('btn-to-home');

  if (btnToProjects) btnToProjects.addEventListener('click', () => navigateTo('projects'));
  if (btnToHome) btnToHome.addEventListener('click', () => navigateTo('home'));
});

// 5. РЕНДЕР И АНИМАЦИЯ
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  monolith.rotation.y = elapsedTime * 0.2;
  particles.rotation.y = elapsedTime * 0.03;

  camera.position.x += (mouseX * 1.5 - camera.position.x + (currentState === 'projects' ? -8 : 0)) * 0.02;
  camera.position.y += (-mouseY * 1.5 - camera.position.y + (currentState === 'projects' ? 2 : 3)) * 0.02;

  renderer.render(scene, camera);
}

animate();