const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.z = 150;
camera.position.y = 50;
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const AMOUNTX = 80;
const AMOUNTY = 80;
const SEPARATION = 4;

const numParticles = AMOUNTX * AMOUNTY;
const positions = new Float32Array(numParticles * 3);
const scales = new Float32Array(numParticles);

let i = 0, j = 0;

for (let ix = 0; ix < AMOUNTX; ix++) {
    for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
        positions[i + 1] = 0;
        positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);

        scales[j] = 1;

        i += 3;
        j++;
    }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

const material = new THREE.PointsMaterial({
    color: 0x4facfe,
    size: 1.5,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

let count = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.1;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.1;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY + 50 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    const positionAttribute = geometry.attributes.position;
    const currentPositions = positionAttribute.array;

    let particleIdx = 0;

    for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
            const index = (particleIdx * 3) + 1;
            currentPositions[index] = (Math.sin((ix + count) * 0.3) * 6) +
                                      (Math.sin((iy + count) * 0.5) * 6);
            particleIdx++;
        }
    }

    positionAttribute.needsUpdate = true;
    count += 0.05;

    renderer.render(scene, camera);
}

animate();