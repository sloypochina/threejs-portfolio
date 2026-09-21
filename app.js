import * as THREE from 'three';
import gsap from 'gsap';

// ==========================================
// 1. СЦЕНА И БАГРОВО-КРАСНЫЙ ТУМАН (JOJI VIBE)
// ==========================================
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Тёмно-бордовый фон и плотный туман
scene.background = new THREE.Color(0x1a0408);
scene.fog = new THREE.FogExp2(0x1a0408, 0.038);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.5, 16);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================
// 2. ОСВЕЩЕНИЕ И КРАСНЫЙ ЛУЧ (SPOTLIGHT)
// ==========================================
const ambientLight = new THREE.AmbientLight(0x3a0810, 1.2);
scene.add(ambientLight);

// Яркий красный прожектор под углом (создаёт треугольник света)
const redSpotLight = new THREE.SpotLight(0xff0022, 25, 35, Math.PI / 3, 0.4, 1);
redSpotLight.position.set(10, 5, 8);
scene.add(redSpotLight);

// ==========================================
// 3. 3D-ОБЪЕКТЫ МИРА
// ==========================================

// А) Тёмный рельеф земли
const terrainGeo = new THREE.PlaneGeometry(120, 120, 50, 50);
terrainGeo.rotateX(-Math.PI / 2);

const pos = terrainGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  const y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 2.2;
  pos.setY(i, y);
}
terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
  color: 0x080406,
  roughness: 0.95,
  metalness: 0.1,
  flatShading: true
});

const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.position.y = -2;
scene.add(terrain);

// Б) Красный треугольный световой луч на земле
const beamGeo = new THREE.PlaneGeometry(14, 18);
beamGeo.rotateX(-Math.PI / 2);
const beamMat = new THREE.MeshBasicMaterial({
  color: 0xff0022,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const redLightBeam = new THREE.Mesh(beamGeo, beamMat);
redLightBeam.position.set(2, -1.9, 1);
redLightBeam.rotation.y = -0.65;
scene.add(redLightBeam);

// В) Дерево с обложки альбома (Procedural Silhouette Tree)
const treeGroup = new THREE.Group();
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x030203, roughness: 1.0 });

// Ствол
const trunkGeo = new THREE.CylinderGeometry(0.2, 0.45, 4.5, 8);
const trunk = new THREE.Mesh(trunkGeo, darkWoodMat);
trunk.position.y = 2;
trunk.rotation.z = -0.08;
treeGroup.add(trunk);

// Главные ветви
const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 2.5, 6), darkWoodMat);
branch1.position.set(0.4, 3.2, 0);
branch1.rotation.z = -0.6;
treeGroup.add(branch1);

const branch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 2.2, 6), darkWoodMat);
branch2.position.set(-0.3, 3.5, 0);
branch2.rotation.z = 0.5;
treeGroup.add(branch2);

// Крона / Листва (темные раскидистые блоки)
const crownMat = new THREE.MeshStandardMaterial({ color: 0x050204, roughness: 1.0, flatShading: true });
const crownGeo = new THREE.DodecahedronGeometry(2.2, 1);

const crown1 = new THREE.Mesh(crownGeo, crownMat);
crown1.position.set(0, 4.8, 0);
crown1.scale.set(1.4, 0.8, 1.2);
treeGroup.add(crown1);

const crown2 = new THREE.Mesh(crownGeo, crownMat);
crown2.position.set(-0.8, 4.2, 0.2);
crown2.scale.set(1.0, 0.7, 0.9);
treeGroup.add(crown2);

treeGroup.position.set(-1.8, -1.8, -1);
scene.add(treeGroup);

// Направляем красный прожектор прямо на дерево
redSpotLight.target = treeGroup;

// Г) Деталь с обложки: Столбы электропередач на заднем плане
const poleMat = new THREE.MeshBasicMaterial({ color: 0x030204 });
const poleGeo = new THREE.CylinderGeometry(0.05, 0.07, 6, 6);

const pole1 = new THREE.Mesh(poleGeo, poleMat);
pole1.position.set(-14, 1, -12);
scene.add(pole1);

const pole2 = new THREE.Mesh(poleGeo, poleMat);
pole2.position.set(-8, 1, -15);
scene.add(pole2);

// Г) ЧАСТИЦЫ (СЛУЧАЙНО КРАСНЫЕ И ЧЁРНЫЕ)
const particleCount = 600;
const particleGeo = new THREE.BufferGeometry();
const particleCoords = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

const colorRed = new THREE.Color(0xff1133);
const colorBlack = new THREE.Color(0x050508);

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  particleCoords[i3] = (Math.random() - 0.5) * 45;
  particleCoords[i3 + 1] = Math.random() * 18;
  particleCoords[i3 + 2] = (Math.random() - 0.5) * 45;

  // 60% красных, 40% черных частиц
  const isRed = Math.random() > 0.4;
  const pColor = isRed ? colorRed : colorBlack;

  particleColors[i3] = pColor.r;
  particleColors[i3 + 1] = pColor.g;
  particleColors[i3 + 2] = pColor.b;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.18,
  vertexColors: true,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ==========================================
// 4. НАВИГАЦИЯ И РАКУРС ИЗ ОБЛОЖКИ ALBUM COVER
// ==========================================
let currentState = 'home';

function navigateTo(page) {
  if (page === currentState) return;
  currentState = page;

  const homePage = document.querySelector('#page-home');
  const projectsPage = document.querySelector('#page-projects');

  if (page === 'projects') {
    homePage.classList.add('hidden');
    projectsPage.classList.remove('hidden');

    // Камера опускается ниже к земле и становится в точности под ракурс обложки!
    gsap.to(camera.position, {
      x: 2.2,
      y: 0.6,
      z: 7.5,
      duration: 2.2,
      ease: 'power3.inOut'
    });

    gsap.to(camera.rotation, {
      x: 0.1,
      y: -0.45,
      z: 0.03,
      duration: 2.2,
      ease: 'power3.inOut'
    });

  } else {
    projectsPage.classList.add('hidden');
    homePage.classList.remove('hidden');

    gsap.to(camera.position, {
      x: 0,
      y: 2.5,
      z: 16,
      duration: 2.2,
      ease: 'power3.inOut'
    });

    gsap.to(camera.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: 2.2,
      ease: 'power3.inOut'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnToProjects = document.getElementById('btn-to-projects');
  const btnToHome = document.getElementById('btn-to-home');

  if (btnToProjects) btnToProjects.addEventListener('click', () => navigateTo('projects'));
  if (btnToHome) btnToHome.addEventListener('click', () => navigateTo('home'));
});

// ==========================================
// 5. АНИМАЦИЯ И РЕСАЙЗ
// ==========================================
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

  // Легкое покачивание и подъем частиц
  particles.rotation.y = elapsedTime * 0.02;

  // Пульсация красного луча света
  beamMat.opacity = 0.3 + Math.sin(elapsedTime * 2) * 0.08;

  // Параллакс мыши
  camera.position.x += (mouseX * 1.2 - camera.position.x + (currentState === 'projects' ? 2.2 : 0)) * 0.02;
  camera.position.y += (-mouseY * 1.2 - camera.position.y + (currentState === 'projects' ? 0.6 : 2.5)) * 0.02;

  renderer.render(scene, camera);
}

animate();