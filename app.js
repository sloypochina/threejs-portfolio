// Импортируем 3D библиотеку Three.js и модули напрямую через интернет (CDN)
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js';

// 1. Создаем сцену и темный фон
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050204);
scene.fog = new THREE.FogExp2(0x050204, 0.04); // Алый/темный туман в глубине

// 2. Настройка камеры (Ракурс в точности с обложки)
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

function resetToAlbumCamera() {
    camera.position.set(-0.8, 1.2, 8.5); // Низкий ракурс
    camera.lookAt(-0.2, 2.0, 0); // Взгляд снизу вверх на дерево
}
resetToAlbumCamera();

// 3. Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 4. Освещение (Вместо треугольника на полу — настоящий скрытый источник алого света)
const ambientLight = new THREE.AmbientLight(0x0d0810, 0.5);
scene.add(ambientLight);

// Главный алый свет справа за деревом
const redSource = new THREE.PointLight(0xff1100, 15, 20);
redSource.position.set(4, 2.5, -1);
scene.add(redSource);

// 5. Земля (тёмное поле)
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x080507, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 6. Загрузка органического дерева (положите файл дерева tree.glb в папку проекта, если есть)
const loader = new GLTFLoader();
loader.load('tree.glb', (gltf) => {
    const tree = gltf.scene;
    tree.position.set(-0.5, 0, 0);
    tree.scale.set(1.5, 1.5, 1.5);
    scene.add(tree);
}, undefined, () => {
    // Если файла tree.glb нет, временно создаем силуэт веток для проверки
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.25, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x050405 })
    );
    trunk.position.set(-0.5, 2, 0);
    scene.add(trunk);
});

// 7. Шейдер мелкого АНИМИРОВАННОГО зерна (Film Grain)
const GrainShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'uTime': { value: 0.0 },
        'uAmount': { value: 0.04 } // Градация мелкого зерна
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uAmount;
        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            // Зерно постоянно движется во времени uTime
            float noise = (rand(vUv + vec2(uTime * 0.05, uTime * 0.1)) - 0.5) * uAmount;
            color.rgb += noise;
            gl_FragColor = color;
        }
    `
};

// Постобработка (накладывает анимированный шум поверх кадра)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const grainPass = new ShaderPass(GrainShader);
composer.addPass(grainPass);

// 8. Анимация
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    grainPass.uniforms['uTime'].value = clock.getElapsedTime();
    composer.render();
}
animate();

// 9. Кнопка сброса/выравнивания камеры
document.getElementById('cameraBtn').addEventListener('click', () => {
    resetToAlbumCamera();
});

// Адаптив при изменении размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});