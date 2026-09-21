// ==========================================
// 1. ИНИЦИАЛИЗА СЦЕНЫ И КАМЕРЫ
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040204);

// Глубокий алый/темный туман
scene.fog = new THREE.FogExp2(0x060205, 0.04);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);

// Установка точного ракурса с обложки альбома (низкий угол съемки)
function setAlbumCameraView(animated = false) {
    const targetPos = { x: -0.6, y: 1.3, z: 7.2 };
    const targetLook = { x: -0.2, y: 2.1, z: 0 };

    if (!animated) {
        camera.position.set(targetPos.x, targetPos.y, targetPos.z);
        camera.lookAt(targetLook.x, targetLook.y, targetLook.z);
    } else {
        // Плавно возвращаем камеру к ракурсу обложки
        let progress = 0;
        const startPos = camera.position.clone();
        const anim = setInterval(() => {
            progress += 0.04;
            camera.position.lerpVectors(startPos, new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), progress);
            camera.lookAt(targetLook.x, targetLook.y, targetLook.z);
            if (progress >= 1) clearInterval(anim);
        }, 16);
    }
}
setAlbumCameraView(false);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ==========================================
// 2. ОСВЕЩЕНИЕ (Алый источник за деревом)
// ==========================================
const ambientLight = new THREE.AmbientLight(0x0f0a12, 0.6);
scene.add(ambientLight);

// Непонятно откуда взявшийся мощный алый источник света справа за горизонтом
const redSourceLight = new THREE.PointLight(0xff1500, 22, 35, 1.5);
redSourceLight.position.set(5.5, 2.0, -2.5);
scene.add(redSourceLight);

// Дополнительный рассеянный SpotLight для алой туманности на земле
const redAtmosphereLight = new THREE.SpotLight(0xff0500, 15, 40, Math.PI / 2.5, 0.8, 1);
redAtmosphereLight.position.set(7, 5, 2);
redAtmosphereLight.target.position.set(-1, 1, -2);
scene.add(redAtmosphereLight);

// ==========================================
// 3. ЗЕМЛЯ И ЛАНДШАФТ
// ==========================================
const groundGeo = new THREE.PlaneGeometry(80, 80, 64, 64);
// Добавляем легкую неровность рельефа
const pos = groundGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    pos.setZ(i, Math.sin(vx * 0.2) * Math.cos(vy * 0.2) * 0.25);
}
groundGeo.computeVertexNormals();

const groundMat = new THREE.MeshStandardMaterial({
    color: 0x080406,
    roughness: 0.95,
    metalness: 0.1
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ==========================================
// 4. ПРОЦЕДУРНОЕ ОРГАНИЧЕСКОЕ ДЕРЕВО (Без Minecraft)
// ==========================================
const treeGroup = new THREE.Group();
const barkMaterial = new THREE.MeshStandardMaterial({ color: 0x050305, roughness: 0.9 });

function createBranch(length, radius, depth) {
    const branchGroup = new THREE.Group();
    
    const geo = new THREE.CylinderGeometry(radius * 0.65, radius, length, 7);
    geo.translate(0, length / 2, 0);
    const mesh = new THREE.Mesh(geo, barkMaterial);
    branchGroup.add(mesh);

    if (depth > 0) {
        const subBranches = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < subBranches; i++) {
            const sub = createBranch(length * 0.72, radius * 0.6, depth - 1);
            sub.position.y = length * (0.6 + Math.random() * 0.35);
            
            // Естественные изгибы и углы веток
            sub.rotation.z = (Math.random() - 0.5) * 0.9 + (i === 0 ? 0.4 : -0.4);
            sub.rotation.x = (Math.random() - 0.5) * 0.7;
            sub.rotation.y = (Math.random() - 0.5) * 1.2;
            branchGroup.add(sub);
        }
    }
    return branchGroup;
}

// Генерируем сухой ствол с кроной
const mainTrunk = createBranch(3.2, 0.28, 4);
mainTrunk.position.set(-0.3, 0, 0);
mainTrunk.rotation.z = -0.08;
treeGroup.add(mainTrunk);
scene.add(treeGroup);

// ==========================================
// 5. СИЛУЭТЫ СТОЛБОВ ЛЭП И ПРОВОДОВ (Слева на фоне)
// ==========================================
const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x020102 });

function createPowerPole(x, z) {
    const poleGroup = new THREE.Group();
    // Основной столб
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.06, 5, 6);
    const pole = new THREE.Mesh(poleGeo, poleMaterial);
    pole.position.y = 2.5;
    poleGroup.add(pole);

    // Перекладина
    const crossGeo = new THREE.BoxGeometry(0.8, 0.04, 0.04);
    const cross = new THREE.Mesh(crossGeo, poleMaterial);
    cross.position.y = 4.6;
    poleGroup.add(cross);

    poleGroup.position.set(x, 0, z);
    return poleGroup;
}

const pole1 = createPowerPole(-5.5, -4.0);
const pole2 = createPowerPole(-9.0, -8.0);
scene.add(pole1);
scene.add(pole2);

// ==========================================
// 6. АНИМИРОВАННОЕ МЕЛКОЕ ЗЕРНО (Film Grain)
// ==========================================
const FineGrainShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'uTime': { value: 0.0 },
        'uIntensity': { value: 0.038 } // Тонкое движущееся зерно
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
        uniform float uIntensity;
        varying vec2 vUv;

        // Динамический генератор шума
        float pseudoRandom(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Зернистость анимируется каждый кадр за счет uTime
            vec2 seed = vUv + vec2(sin(uTime * 0.3), cos(uTime * 0.5));
            float grain = (pseudoRandom(seed) - 0.5) * uIntensity;

            // Зерно деликатно подчёркивает контрасты и туман
            color.rgb += vec3(grain);
            gl_FragColor = color;
        }
    `
};

const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

const grainPass = new THREE.ShaderPass(FineGrainShader);
composer.addPass(grainPass);

// ==========================================
// 7. РЕНДЕР И ОБРАБОТКА СОБЫТИЙ
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    // Обновляем время для живого движения зерна
    const elapsedTime = clock.getElapsedTime();
    grainPass.uniforms['uTime'].value = elapsedTime;

    // Легчайшее дыхание алого света
    redSourceLight.intensity = 20 + Math.sin(elapsedTime * 1.5) * 2.5;

    composer.render();
}
animate();

// Клик по кнопке устанавливает правильный ракурс с обложки
document.getElementById('cameraBtn').addEventListener('click', () => {
    setAlbumCameraView(true);
});

// Адаптив под размеры экрана
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updatePointerMatrix ? camera.updatePointerMatrix() : camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});