import * as THREE from 'three';
import gsap from 'gsap';

// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ СЦЕНЫ И ТУМАНА (MINECRAFT SOLITUDE)
// ==========================================
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Цвет сумеречного фона (Joji / Minecraft Alpha Vibe)
const bgColor = 0x0a0c12;
scene.background = new THREE.Color(bgColor);

// Густой экспоненциальный туман создает эффект лиминального пространства
scene.fog = new THREE.FogExp2(bgColor, 0.035);

// Настройка Камеры
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 12);

// Настройка Рендерера
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================
// 2. ОСВЕЩЕНИЕ
// ==========================================
// Слабый холодный фоновый свет
const ambientLight = new THREE.AmbientLight(0x2a2f45, 0.8);
scene.add(ambientLight);

// Тёплый одинокий свет в центре (как от костра или мерцающего терминала)
const pointLight = new THREE.PointLight(0xff9e3b, 3, 20);
pointLight.position.set(0, 1, 0);
scene.add(pointLight);

// ==========================================
// 3. СОЗДАНИЕ 3D ЛАНДШАФТА И ОБЪЕКТОВ
// ==========================================

// --- А) Низкополигональный рельеф земли (Холмы) ---
const planeGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
planeGeo.rotateX(-Math.PI / 2); // Поворачиваем плоскость горизонтально

// Искажаем вершины математическими волнами для имитации холмов
const pos = planeGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  // Формула волн холмистой местности
  const y = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.2 + Math.sin(x * 0.05) * 2;
  pos.setY(i, y);
}
planeGeo.computeVertexNormals();

const planeMat = new THREE.MeshStandardMaterial({
  color: 0x121622,
  roughness: 0.9,
  metalness: 0.1,
});
const terrain = new THREE.Mesh(planeGeo, planeMat);
terrain.position.y = -1;
scene.add(terrain);

// --- Б) Одинокий Монолит в центре ---
const monolithGeo = new THREE.BoxGeometry(1.2, 4, 1.2);
const monolithMat = new THREE.MeshStandardMaterial({
  color: 0x1f2430,
  roughness: 0.2,
  metalness: 0.8
});
const monolith = new THREE.Mesh(monolithGeo, monolithMat);
monolith.position.set(0, 1, 0);
scene.add(monolith);

// --- В) Парящие частицы (Пепел / Снег) ---
const particleCount = 400;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  particlePositions[i] = (Math.random() - 0.5) * 40;     // X
  particlePositions[i + 1] = Math.random() * 20;         // Y
  particlePositions[i + 2] = (Math.random() - 0.5) * 40; // Z
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0xff9e3b,
  size: 0.08,
  transparent: true,
  opacity: 0.6
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ==========================================
// 4. ИНТЕРАКТИВНОСТЬ (СЛЕЖЕНИЕ ЗА МЫШЬЮ)
// ==========================================
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

// Адаптивность под изменение размера экрана
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 5. ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ (GSAP)
// ==========================================
const pageHome = document.querySelector('#page-home');
const pageProjects = document.querySelector('#page-projects');
const btnGoProjects = document.querySelector('#go-projects-btn');
const btnGoHome = document.querySelector('#go-home-btn');

// Позиции камеры для первой и второй страниц
const posHome = { x: 0, y: 2, z: 12, rotY: 0 };
const posProjects = { x: -6, y: 3, z: 6, rotY: -0.6 };

function goToProjects() {
  pageHome.classList.remove('active');
  pageHome.classList.add('hidden');

  // Перелёт 3D-камеры на вторую позицию
  gsap.to(camera.position, {
    x: posProjects.x,
    y: posProjects.y,
    z: posProjects.z,
    duration: 2,
    ease: 'power2.inOut'
  });

  gsap.to(camera.rotation, {
    y: posProjects.rotY,
    duration: 2,
    ease: 'power2.inOut',
    onComplete: () => {
      pageProjects.classList.remove('hidden');
      pageProjects.classList.add('active');
    }
  });
}

function goToHome() {
  pageProjects.classList.remove('active');
  pageProjects.classList.add('hidden');

  // Перелёт 3D-камеры обратно на главную позицию
  gsap.to(camera.position, {
    x: posHome.x,
    y: posHome.y,
    z: posHome.z,
    duration: 2,
    ease: 'power2.inOut'
  });

  gsap.to(camera.rotation, {
    y: posHome.rotY,
    duration: 2,
    ease: 'power2.inOut',
    onComplete: () => {
      pageHome.classList.remove('hidden');
      pageHome.classList.add('active');
    }
  });
}

btnGoProjects.addEventListener('click', goToProjects);
btnGoHome.addEventListener('click', goToHome);

// ==========================================
// 6. СИНТЕЗАТОР ЭМБИЕНТ-ЗВУКА (Web Audio API)
// ==========================================
const audioBtn = document.querySelector('#audio-btn');
let audioCtx = null;
let isPlaying = false;

audioBtn.addEventListener('click', () => {
  if (!isPlaying) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime); // Низкая нота ля (A2)
    
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    audioBtn.textContent = '[ AUDIO: ON ]';
    audioBtn.style.color = '#ff9e3b';
    isPlaying = true;
  } else {
    if (audioCtx) audioCtx.close();
    audioBtn.textContent = '[ AUDIO: OFF ]';
    audioBtn.style.color = '#c2c8d6';
    isPlaying = false;
  }
});

// ==========================================
// 7. РЕНДЕР-ЦИКЛ (АНИМАЦИЯ КАЖДЫЙ КАДР)
// ==========================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();

  // Поворот монолита и мерцание света
  monolith.rotation.y = elapsedTime * 0.2;
  pointLight.intensity = 2 + Math.sin(elapsedTime * 3) * 0.8;

  // Анимация падения частиц (снег/пепел)
  const positions = particles.geometry.attributes.position.array;
  for (let i = 1; i < particleCount * 3; i += 3) {
    positions[i] -= 0.01;
    if (positions[i] < 0) positions[i] = 20;
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // Плавный параллакс камеры за мышкой
  camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
  camera.position.y += (-mouseY * 0.5 + 2 - camera.position.y) * 0.05;

  renderer.render(scene, camera);
}

animate();