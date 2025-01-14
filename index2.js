import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Camera position
camera.position.z = 5;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05; // Lebih smooth
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Intensitas ambient ditingkatkan sedikit
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8); // Cahaya utama
mainLight.position.set(5, 5, 5);
scene.add(mainLight);

// Point lights untuk efek dramatis
const pointLight1 = new THREE.PointLight(0xff66cc, 1, 80); // Warna pink
pointLight1.position.set(5, 5, -5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x66ccff, 1, 80); // Warna biru
pointLight2.position.set(-5, 5, -5);
scene.add(pointLight2);

// --- Materials ---
// Material dengan efek glow
const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        'c': { type: 'f', value: 0.5 },
        'p': { type: 'f', value: 6.0 },
        glowColor: { type: 'c', value: new THREE.Color(0x00ffff) },
        viewVector: { type: 'v3', value: camera.position }
    },
    vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
            vec3 vNormal = normalize( normalMatrix * normal );
            vec3 vNormel = normalize( normalMatrix * viewVector );
            intensity = pow( c - dot(vNormal, vNormel), p );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4( glow, 1.0 );
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

// --- Geometry & Mesh ---

// Grid (lebih subtle)
const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0xffffff);
gridHelper.position.y = -5;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.05; // Opacity dikurangi
scene.add(gridHelper);

// Energy Field (lebih dinamis)
const energyFieldGeometry = new THREE.SphereGeometry(8, 64, 64); // Segment ditambah
const energyFieldMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08, // Opacity dikurangi
    wireframe: true,
    wireframeLinewidth: 1 // Garis wireframe lebih tipis
});
const energyField = new THREE.Mesh(energyFieldGeometry, energyFieldMaterial);
scene.add(energyField);

// DNA (Optimized)
// Modify the createDNA function to add velocity to spheres
function createDNA() {
    const dnaGroup = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ 
        vertexColors: true, 
        blending: THREE.AdditiveBlending 
    });

    const points = [];
    const colors = [];
    const spheres = []; // Array to track spheres

    const radius = 1;
    const height = 4;
    const numSegments = 100;
    const segmentsPerTurn = 25;

    // Create DNA strands
    for (let i = 0; i < numSegments; i++) {
        const t = i / numSegments;
        const angle = t * Math.PI * 8;

        // Strand 1
        const x1 = radius * Math.cos(angle);
        const y1 = t * height - height / 2;
        const z1 = radius * Math.sin(angle);
        points.push(x1, y1, z1);
        colors.push(0.24, 0.47, 0.66);

        // Strand 2
        const x2 = radius * Math.cos(angle + Math.PI);
        const y2 = t * height - height / 2;
        const z2 = radius * Math.sin(angle + Math.PI);
        points.push(x2, y2, z2);
        colors.push(0.24, 0.47, 0.66);

        // Create nucleotide spheres with reduced frequency
        if (i % (segmentsPerTurn / 2) === 0) {
            const sphereGeometry = new THREE.SphereGeometry(0.07, 8, 8);
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.8
            });
            
            // Create and position spheres
            const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere1.position.set(x1, y1, z1);
            sphere1.userData.originalPos = new THREE.Vector3(x1, y1, z1);
            sphere1.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
            dnaGroup.add(sphere1);
            spheres.push(sphere1);

            const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere2.position.set(x2, y2, z2);
            sphere2.userData.originalPos = new THREE.Vector3(x2, y2, z2);
            sphere2.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
            dnaGroup.add(sphere2);
            spheres.push(sphere2);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const line = new THREE.LineSegments(geometry, lineMaterial);
    dnaGroup.add(line);

    // Add the spheres array to the group's userData for later access
    dnaGroup.userData.spheres = spheres;

    return dnaGroup;
}

// Add this function to update sphere positions
function updateDNASpheres(dnaGroup, time) {
    const spheres = dnaGroup.userData.spheres;
    
    spheres.forEach(sphere => {
        // Update position based on velocity
        sphere.position.add(sphere.userData.velocity);
        
        // Calculate distance from original position
        const distance = sphere.position.distanceTo(sphere.userData.originalPos);
        
        // Apply force to return to original position if too far
        if (distance > 0.5) { // Maximum distance threshold
            const returnForce = new THREE.Vector3()
                .subVectors(sphere.userData.originalPos, sphere.position)
                .multiplyScalar(0.02); // Return force strength
            
            sphere.userData.velocity.add(returnForce);
        }
        
        // Add random movement
        sphere.userData.velocity.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.001,
            (Math.random() - 0.5) * 0.001,
            (Math.random() - 0.5) * 0.001
        ));
        
        // Apply damping to prevent excessive speeds
        sphere.userData.velocity.multiplyScalar(0.98);
        
        // Optional: Add pulsing effect
        const scale = 1 + Math.sin(time * 2) * 0.1;
        sphere.scale.setScalar(scale);
    });
}

// Modify your animate function to include this new update
// Add this inside your existing animate function, before controls.update():


const dna = createDNA();
scene.add(dna);

// Particles (Optimized)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 500; // Jumlah partikel dikurangi
const particlePositions = new Float32Array(particlesCount * 3);
const particleVelocities = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    particlePositions[i] = (Math.random() - 0.5) * 10;
    particleVelocities[i] = (Math.random() - 0.5) * 0.01; // Kecepatan dikurangi
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03, // Ukuran sedikit diperbesar
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true // Partikel yang jauh terlihat lebih kecil
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Medical Crosses (Optimized)
function createMedicalCross() {
    const crossGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    const verticalGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);

    const horizontalBar = new THREE.Mesh(crossGeometry, glowMaterial);
    const verticalBar = new THREE.Mesh(verticalGeometry, glowMaterial);

    const cross = new THREE.Group();
    cross.add(horizontalBar);
    cross.add(verticalBar);

    return cross;
}

const numCrosses = 3; // Jumlah cross dikurangi
const crosses = new THREE.Group();
for (let i = 0; i < numCrosses; i++) {
    const cross = createMedicalCross();
    cross.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
    );
    cross.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    crosses.add(cross);
}
scene.add(crosses);

// Icosahedron (New)
// const icosahedronGeometry = new THREE.IcosahedronGeometry(1, 1); // Detail 1 untuk efek low-poly
// const icosahedronMaterial = new THREE.MeshPhongMaterial({
//     color: 0x66ccff,
//     emissive: 0x0066ff,
//     emissiveIntensity: 0.5,
//     flatShading: true // Efek faceted/low-poly
// });
// const icosahedron = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
// icosahedron.position.set(0, 0, -3); // Posisi di depan
// scene.add(icosahedron);

// --- Mouse Interaction ---
const mouse = new THREE.Vector2();
const targetRotation = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    targetRotation.x = mouse.y * 0.2; // Sensitivitas dikurangi
    targetRotation.y = mouse.x * 0.2; // Sensitivitas dikurangi
}

window.addEventListener('mousemove', onMouseMove);

// --- Animation ---
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    dna.rotation.y += 0.002;

    // Rotasi Energy Field (lebih smooth)
    energyField.rotation.x += 0.0005;
    energyField.rotation.y += 0.0005;

    // Update partikel
    const positions = particles.geometry.attributes.position.array;
    const velocities = particles.geometry.attributes.velocity.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Boundary check (lebih smooth)
        if (Math.abs(positions[i]) > 5) velocities[i] *= -0.5;
        if (Math.abs(positions[i + 1]) > 5) velocities[i + 1] *= -0.5;
        if (Math.abs(positions[i + 2]) > 5) velocities[i + 2] *= -0.5;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Rotasi dan pulsing effect untuk crosses
    crosses.children.forEach((cross, index) => {
        cross.rotation.y += 0.01;
        cross.scale.setScalar(1 + Math.sin(time * 2 + index) * 0.05); // Pulsing lebih subtle
    });

    // Rotasi Icosahedron
    // icosahedron.rotation.x += 0.005;
    // icosahedron.rotation.y += 0.005;

    // Update posisi kamera dengan parallax
    camera.position.x += (targetRotation.y - camera.position.x) * 0.02; // Lebih smooth
    camera.position.y += (targetRotation.x - camera.position.y) * 0.02; // Lebih smooth
    camera.lookAt(scene.position);

    // Update glow material
    glowMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, energyField.position);
    updateDNASpheres(dna, time);
    controls.update();
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// --- Start Animation ---
animate();  