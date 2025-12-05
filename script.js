let scene, camera, renderer, globe;
let snowParticles = [];
let isShaking = false;
let targetRotX = 0, targetRotY = 0;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);

    // Lumières
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffd700, 0.5);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);

    globe = new THREE.Group();
    scene.add(globe);

    // Base en bois
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.3, 0.5, 32),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8, metalness: 0.2 })
    );
    base.position.y = -2.25;
    globe.add(base);

    // Socle
    const innerBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.2, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    innerBase.position.y = -1.9;
    globe.add(innerBase);

    createTree();
    createHouse();

    // Sphère en verre
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(2, 64, 64),
        new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            roughness: 0.05,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transmission: 0.9,
            thickness: 0.5
        })
    );
    sphere.position.y = -0.6;
    globe.add(sphere);

    createSnowParticles();
    setupEvents();

    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });
}

function createTree() {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2511 })
    );
    trunk.position.y = -1.6;
    tree.add(trunk);

    const foliage = new THREE.MeshStandardMaterial({ color: 0x0d5c0d });
    const sizes = [[0.5, 0.8, -1.2], [0.4, 0.7, -0.7], [0.3, 0.6, -0.2]];

    sizes.forEach(([r, h, y]) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), foliage);
        cone.position.y = y;
        tree.add(cone);
    });

    const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5 })
    );
    star.position.y = 0.3;
    tree.add(star);

    tree.position.x = -0.6;
    globe.add(tree);
}

function createHouse() {
    const house = new THREE.Group();

    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.5, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xd2691e })
    );
    walls.position.y = -1.55;
    house.add(walls);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 0.4, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b0000 })
    );
    roof.position.y = -1.1;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.25, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    door.position.set(0, -1.675, 0.31);
    house.add(door);

    const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffeb3b, emissive: 0xffeb3b, emissiveIntensity: 0.3 })
    );
    win.position.set(0.15, -1.5, 0.31);
    house.add(win);

    house.position.x = 0.7;
    globe.add(house);
}

function createSnowParticles() {
    const geometry = new THREE.SphereGeometry(0.02, 4, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const center = new THREE.Vector3(0, -0.6, 0);

    for (let i = 0; i < 300; i++) {
        const particle = new THREE.Mesh(geometry, material);

        particle.position.set(
            (Math.random() - 0.5) * 3.5,
            Math.random() * 3.5 - 2.4,
            (Math.random() - 0.5) * 3.5
        );

        if (particle.position.distanceTo(center) < 1.9) {
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.002,
                    -Math.random() * 0.005 - 0.005,
                    (Math.random() - 0.5) * 0.002
                ),
                settled: false
            };
            snowParticles.push(particle);
            globe.add(particle);
        }
    }
}

function shake() {
    isShaking = true;

    snowParticles.forEach(p => {
        p.userData.settled = false;
        const angle = Math.random() * Math.PI * 2;
        const strength = Math.random() * 0.04 + 0.02;

        p.userData.velocity.set(
            Math.cos(angle) * strength * (Math.random() + 0.5),
            Math.random() * 0.05 + 0.01,
            Math.sin(angle) * strength * (Math.random() + 0.5)
        );
    });

    setTimeout(() => isShaking = false, 2000);
}

function setupEvents() {
    if (!isMobile) {
        addEventListener('mousemove', e => {
            const x = (e.clientX / innerWidth) * 2 - 1;
            const y = -(e.clientY / innerHeight) * 2 + 1;
            targetRotX = y * 0.3;
            targetRotY = x * Math.PI;
        });
        addEventListener('click', shake);
    } else {
        let startX, startY;

        addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;

            const prompt = document.getElementById('shake-prompt');
            if (prompt) {
                prompt.style.opacity = '0';
                setTimeout(() => prompt.remove(), 500);
            }
        }, { once: true });

        addEventListener('touchmove', e => {
            e.preventDefault();
            const dx = (e.touches[0].clientX - startX) / innerWidth;
            const dy = (e.touches[0].clientY - startY) / innerHeight;
            targetRotY = dx * Math.PI * 2;
            targetRotX = -dy * Math.PI;
        }, { passive: false });

        setupShakeDetection();
    }
}

function setupShakeDetection() {
    let accHistory = [];
    let throttle = false;

    const startMotion = () => {
        addEventListener('devicemotion', e => {
            if (throttle || !e.accelerationIncludingGravity) return;

            const acc = e.accelerationIncludingGravity;
            const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

            accHistory.push(total);
            if (accHistory.length > 10) accHistory.shift();

            if (accHistory.length >= 3) {
                const recent = accHistory.slice(-3);
                const variation = Math.max(...recent) - Math.min(...recent);

                if (variation > 5) {
                    shake();

                    throttle = true;
                    setTimeout(() => throttle = false, 100);
                }
            }
        });
    };

    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
        const btn = document.createElement('button');
        btn.textContent = 'Activer le shake';
        btn.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
            padding:20px 40px;font-size:18px;background:white;border:none;border-radius:30px;
            cursor:pointer;z-index:2000;box-shadow:0 4px 20px rgba(0,0,0,0.3)`;

        btn.onclick = async () => {
            const perm = await DeviceMotionEvent.requestPermission();
            if (perm === 'granted') startMotion();
            btn.remove();
        };

        document.body.appendChild(btn);
    } else if (DeviceMotionEvent) {
        startMotion();
    }
}

function animate() {
    requestAnimationFrame(animate);

    globe.rotation.y += (targetRotY - globe.rotation.y) * 0.05;
    globe.rotation.x += (targetRotX - globe.rotation.x) * 0.05;

    const center = new THREE.Vector3(0, -0.6, 0);

    snowParticles.forEach(p => {
        if (p.userData.settled) return;

        p.position.add(p.userData.velocity);

        if (!isShaking) {
            p.userData.velocity.y -= 0.0003;
            p.userData.velocity.x *= 0.98;
            p.userData.velocity.z *= 0.98;

            const t = Date.now() * 0.001 + p.id;
            p.position.x += Math.sin(t) * 0.0003;
            p.position.z += Math.cos(t) * 0.0003;
        }

        const dist = p.position.distanceTo(center);

        if (dist > 1.8) {
            const normal = p.position.clone().sub(center).normalize();
            p.position.copy(center.clone().add(normal.multiplyScalar(1.78)));

            const dot = p.userData.velocity.dot(normal);
            p.userData.velocity.sub(normal.multiplyScalar(2 * dot)).multiplyScalar(0.3);
            p.userData.velocity.y -= 0.005;

            if (p.userData.velocity.length() < 0.005) {
                p.userData.velocity.y = -0.01;
            }
        }

        if (p.position.y < -1.75) {
            p.position.y = -1.75;
            const v = p.userData.velocity;

            if (Math.abs(v.y) < 0.003 && Math.abs(v.x) < 0.003 && Math.abs(v.z) < 0.003) {
                p.userData.settled = true;
                v.set(0, 0, 0);
            } else {
                v.y *= -0.3;
                v.x *= 0.7;
                v.z *= 0.7;
            }
        }
    });

    renderer.render(scene, camera);
}

init();
animate();
